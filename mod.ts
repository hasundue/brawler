import * as log from "https://deno.land/std@0.161.0/log/mod.ts";
import {
  basename,
  dirname,
  extname,
  join,
} from "https://deno.land/std@0.161.0/path/mod.ts";
import { format } from "https://deno.land/std@0.161.0/datetime/mod.ts";
import { transform } from "https://deno.land/x/dnt@0.31.0/transform.ts";
import { jason } from "https://deno.land/x/jason_formatter@v2.2.0/mod.ts";

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
    console.error("deno.json already exists.");
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
    console.error(`${configPath} already exists.`);
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
  tempDir?: string;
};

const makeTempDir = async () => {
  const tempDir = await Deno.makeTempDir({ prefix: "brawler" });
  globalThis.addEventListener("unload", async () => {
    await Deno.remove(tempDir);
  });
  return tempDir;
};

export async function build(
  scriptPath: string,
  options?: BuildOptions,
) {
  const logger = log.getLogger(options?.logLevel ?? "log");
  logger.debug(`Building ${scriptPath}...`);

  const output = await transform({
    entryPoints: [scriptPath],
    target: "ES2021",
  });

  const tempDir = options?.tempDir ?? await makeTempDir();
  const encoder = new TextEncoder();

  for (const file of output.main.files) {
    await Deno.mkdir(
      join(tempDir, dirname(file.filePath)),
      { recursive: true },
    );
    await Deno.writeFile(
      join(tempDir, file.filePath),
      encoder.encode(file.fileText),
    );
  }

  const count = output.main.files.length;
  logger.debug(`Transformed ${count} files.`);
}

function watch(
  scriptPath: string,
  builder: () => Promise<void>,
) {
  const watcher = Deno.watchFs(dirname(scriptPath));

  const handler = async () => {
    for await (const event of watcher) {
      if (event.kind === "modify" && extname(event.paths[0]) === ".ts") {
        builder();
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

function buildWranglerCmd(
  scriptName: string,
  subcmd: "dev" | "publish",
  options?: DevOptions,
) {
  const { logLevel, ...wranglerOptions } = options ?? {};

  const wranglerCmd = Deno.build.os === "windows" ? "wrangler.cmd" : "wrangler";
  const cmd = [wranglerCmd, subcmd, scriptName];
  if (logLevel) cmd.concat(["--log-level", logLevel]);

  Object.entries(wranglerOptions).forEach(([key, value]) => {
    const prefix = key.length === 1 ? "-" : "--";
    cmd.push(prefix + key);
    if (typeof value === "string") cmd.push(value);
  });

  return cmd;
}

export async function dev(
  scriptPath: string,
  options?: DevOptions,
) {
  const logLevel = options?.logLevel;
  const logger = log.getLogger(logLevel ?? "log");

  const scriptDir = dirname(scriptPath);
  const tempDir = await makeTempDir();

  await build(scriptPath, { logLevel, tempDir });

  logger.debug(`Launching wrangler...`);

  const wrangler = Deno.run({
    cmd: buildWranglerCmd(basename(scriptPath), "dev", options),
    cwd: tempDir,
    stdin: "inherit",
    stdout: "inherit",
  });

  logger.debug(`Watching changes in ${scriptDir}...`);

  const builder = () => build(scriptPath, { logLevel, tempDir });
  const watcher = watch(scriptDir, builder);

  const status = await wrangler.status();
  wrangler.close();
  await Deno.remove(tempDir, { recursive: true });

  watcher.close();

  return status.code;
}

export type PublishOptions = DevOptions;

export async function publish(
  scriptPath: string,
  options?: PublishOptions,
) {
  const logLevel = options?.logLevel;
  const logger = log.getLogger(logLevel ?? "log");

  const tempDir = await makeTempDir();

  await build(scriptPath, { logLevel, tempDir });

  const configPath = options?.config ??
    join(dirname(scriptPath), "wrangler.toml");

  try {
    await Deno.copyFile(configPath, join(tempDir, basename(configPath)));
  } catch {
    logger.warning("wrangler.toml not found.");
  }

  const wrangler = Deno.run({
    cmd: buildWranglerCmd(basename(scriptPath), "publish", options),
    cwd: tempDir,
    stdin: "inherit",
    stdout: "inherit",
  });

  const status = await wrangler.status();
  wrangler.close();
  await Deno.remove(tempDir, { recursive: true });

  return status.code;
}
