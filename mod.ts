import * as log from "https://deno.land/std@0.157.0/log/mod.ts";
import {
  basename,
  dirname,
  join,
} from "https://deno.land/std@0.157.0/path/mod.ts";
import { format } from "https://deno.land/std@0.157.0/datetime/mod.ts";
import { transform } from "https://deno.land/x/dnt@0.30.0/transform.ts";
import { jason } from "https://deno.land/x/jason_formatter@v2.2.0/mod.ts";
import { watch } from "npm:chokidar@3.5.3";

export const wranglerLogLevel = [
  "debug",
  "info",
  "log",
  "warn",
  "error",
  "none",
] as const;

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

type InitOptions = {
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

type BuildOptions = {
  logLevel?: typeof wranglerLogLevel[number];
};

export const cacheDir = (scriptPath: string) =>
  join(dirname(scriptPath), ".cache", "brawler");

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

  const outdir = cacheDir(scriptPath);
  const encoder = new TextEncoder();

  for (const file of output.main.files) {
    await Deno.mkdir(
      join(outdir, dirname(file.filePath)),
      { recursive: true },
    );
    await Deno.writeFile(
      join(outdir, file.filePath),
      encoder.encode(file.fileText),
    );
  }

  const count = output.main.files.length;
  logger.debug(`Transformed ${count} files.`);
}

type DevOptions = {
  [x: string]: true | string | undefined;
  logLevel: typeof wranglerLogLevel[number];
};

export async function dev(
  scriptPath: string,
  options?: DevOptions,
) {
  const { logLevel, ...wranglerOptions } = options ?? { logLevel: "log" };
  const logger = log.getLogger(logLevel);

  const cwd = Deno.cwd();
  const scriptDir = dirname(scriptPath);

  await build(scriptPath, { logLevel });

  const outdir = cacheDir(scriptPath);
  Deno.chdir(outdir);

  const cmd = ["wrangler", "dev", basename(scriptPath)];
  cmd.concat(["--log-level", logLevel]);

  Object.entries(wranglerOptions).forEach(([key, value]) => {
    const prefix = key.length === 1 ? "-" : "--";
    cmd.push(prefix + key);
    if (typeof value === "string") cmd.push(value);
  });

  logger.debug(`Launching wrangler...`);
  const wrangler = Deno.run({ cmd, stdin: "inherit", stdout: "inherit" });

  Deno.chdir(cwd);

  logger.debug(`Watching changes in ${scriptDir}...`);
  const watcher = watch(scriptDir, { ignored: /(^|[\/\\])\../ }) // ignore dotfiles
    .on("change", () => build(scriptPath, { logLevel }));

  const status = await wrangler.status();
  wrangler.close();

  watcher.close();

  return status.code;
}
