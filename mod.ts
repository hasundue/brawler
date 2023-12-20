import * as log from "https://deno.land/std@0.209.0/log/mod.ts";
import { dirname, join } from "https://deno.land/std@0.209.0/path/mod.ts";
import { signal } from "https://deno.land/std@0.209.0/signal/mod.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.19.10/mod.js";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.8.2/mod.ts";
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

export type BuildOptions = {
  logLevel?: LogLevel;
  outdir?: string;
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
    outfile: join(options?.outdir ?? "dist", "index.js"),
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

export type DevOptions = BuildOptions & {
  logLevel?: LogLevel;
  config?: string;
} & WranglerOptions;

const wranglerCommand = Deno.build.os === "windows"
  ? "wrangler.cmd"
  : "wrangler";

function wranglerArgs(
  subcmd: "dev" | "deploy",
  options?: DevOptions,
) {
  const { logLevel, outdir, ...wranglerOptions } = options ?? {};
  const args = [subcmd, join(outdir ?? "dist", "index.js")];

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

  await build(scriptPath, options);

  logger.debug(`Launching wrangler...`);
  const command = new Deno.Command(wranglerCommand, {
    args: wranglerArgs("dev", options),
    stdin: "inherit",
    stdout: "inherit",
  });
  const wrangler = command.spawn();

  const builder = async (mutex: Mutex) => {
    await mutex.acquire();
    await build(scriptPath, options);
    mutex.release();
  };

  logger.debug(`Watching changes in ${scriptDir}...`);
  const watcher = watch(scriptDir, builder);

  const signals = signal("SIGINT");
  (async () => {
    for await (const _ of signals) {
      logger.debug("Received signal, killing wrangler...");
      wrangler.kill("SIGINT");
      break;
    }
    signals.dispose();
  })();

  const status = await wrangler.status;
  watcher.close();
  return status.code;
}

export type DeployOptions = DevOptions;

export async function deploy(
  scriptPath: string,
  options?: DeployOptions,
) {
  const logLevel = options?.logLevel;

  await build(scriptPath, { logLevel });

  const command = new Deno.Command(wranglerCommand, {
    args: wranglerArgs("deploy", options),
  });
  const wrangler = command.spawn();

  const status = await wrangler.status;
  return status.code;
}
