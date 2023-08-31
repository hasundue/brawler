import * as log from "https://deno.land/std@0.186.0/log/mod.ts";
import {
  basename,
  dirname,
  join,
} from "https://deno.land/std@0.186.0/path/mod.ts";
import { format } from "https://deno.land/std@0.186.0/datetime/mod.ts";
import { jason } from "https://deno.land/x/jason_formatter@v2.2.0/mod.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.17.19/mod.js";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.8.1/mod.ts";
import { Mutex } from "https://deno.land/x/async@v2.0.2/mutex.ts";

export const wranglerLogLevel = [
  "debug",
  "info",
  "log",
  "warn",
  "error",
  "none",
] as const;

export type LogLevel = typeof wranglerLogLevel[number];

log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter: "[brawler] {msg}",
    }),
  },
  loggers: {
    debug: { level: "DEBUG", handlers: ["console"] },
    info: { level: "INFO", handlers: ["console"] },
    log: { level: "INFO", handlers: ["console"] },
    warn: { level: "WARNING", handlers: ["console"] },
    error: { level: "ERROR", handlers: ["console"] },
    none: { level: "NOTSET" },
  },
});

export type InitOptions = {
  config?: string; // path to .toml
};

export async function init(
  maybeName?: string,
  options?: InitOptions,
) {
  const configPath = options?.config ?? "wrangler.toml";

  try {
    await Deno.stat("deno.json");
    throw new Error("deno.json already exists.");
  } catch {
    // deno.json does not exist
    const options = {
      compilerOptions: {
        "types": [
          "https://pax.deno.dev/cloudflare/workers-types/index.d.ts",
        ],
      },
    };
    await Deno.writeTextFile("deno.json", jason(JSON.stringify(options)));
  }

  try {
    await Deno.stat(configPath);
    throw new Error(`${configPath} already exists.`);
  } catch {
    const name = maybeName ?? basename(Deno.cwd());
    const date = format(new Date(), "yyyy-MM-dd");
    const configs = [
      `name = "${name}"`,
      `compatibility_date = "${date}"`,
    ].join("\n").concat("\n");
    await Deno.writeTextFile(configPath, configs);
  }
}

export type BuildOptions = {
  logLevel?: typeof wranglerLogLevel[number];
  dist?: string;
};

export async function build(
  scriptPath: string,
  options?: BuildOptions,
) {
  const logger = log.getLogger(options?.logLevel ?? "log");
  logger.debug(`Building ${scriptPath}...`);

  const result = await esbuild.build({
    plugins: [...denoPlugins()],
    entryPoints: [scriptPath],
    outfile: join(options?.dist ?? "dist", "index.js"),
    bundle: true,
    format: "esm",
  });

  for (const warn of result.warnings) {
    logger.warning(warn.text);
  }
  for (const error of result.errors) {
    logger.error(error.text);
  }

  esbuild.stop();
}

function watch(
  scriptPath: string,
  builder: (mutex: Mutex) => Promise<void>,
) {
  const watcher = Deno.watchFs(dirname(scriptPath));
  const mutex = new Mutex();

  const handler = async () => {
    for await (const event of watcher) {
      if (event.kind === "modify" && !mutex.locked) {
        builder(mutex);
      }
    }
  };
  handler();

  return watcher;
}

export type WranglerOptions = {
  [x: string]: true | string | undefined;
};

export type DevOptions = WranglerOptions & {
  logLevel?: LogLevel;
  config?: string;
};

const wranglerCommand = Deno.build.os === "windows"
  ? "wrangler.cmd"
  : "wrangler";

function wranglerArgs(
  subcmd: "dev" | "publish",
  options?: DevOptions,
) {
  const { logLevel, ...wranglerOptions } = options ?? {};
  const args = [subcmd, join("dist", "index.js")];

  args.concat(["--no-bundle"]);
  if (logLevel) args.concat(["--log-level", logLevel]);

  Object.entries(wranglerOptions).forEach(([key, value]) => {
    const prefix = key.length === 1 ? "-" : "--";
    args.push(prefix + key);
    if (typeof value === "string") args.push(value);
  });

  return args;
}

export async function dev(
  scriptPath: string,
  options?: DevOptions,
) {
  const logLevel = options?.logLevel;
  const logger = log.getLogger(logLevel ?? "log");

  const scriptDir = dirname(scriptPath);

  await build(scriptPath, { logLevel });

  logger.debug(`Launching wrangler...`);
  const command = new Deno.Command(wranglerCommand, {
    args: wranglerArgs("dev", options),
    stdin: "inherit",
    stdout: "inherit",
  });
  const wrangler = command.spawn();

  const builder = async (mutex: Mutex) => {
    await mutex.acquire();
    await build(scriptPath, { logLevel });
    mutex.release();
  };

  logger.debug(`Watching changes in ${scriptDir}...`);
  const watcher = watch(scriptDir, builder);

  const status = await wrangler.status;
  watcher.close();
  return status.code;
}

export type PublishOptions = DevOptions;

export async function publish(
  scriptPath: string,
  options?: PublishOptions,
) {
  const logLevel = options?.logLevel;

  await build(scriptPath, { logLevel });

  const command = new Deno.Command(wranglerCommand, {
    args: wranglerArgs("publish", options),
  });
  const wrangler = command.spawn();

  const status = await wrangler.status;
  return status.code;
}
