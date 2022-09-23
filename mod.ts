import * as log from "https://deno.land/std@0.157.0/log/mod.ts";
import {
  basename,
  dirname,
  join,
} from "https://deno.land/std@0.157.0/path/mod.ts";
import { transform } from "https://deno.land/x/dnt@0.30.0/transform.ts";

interface Options {
  log?: log.LevelName;
}

export function setup(options: Options) {
  log.setup({
    loggers: {
      default: {
        level: options.log,
        handlers: ["console"],
      },
    },
  });
}

const getOutdir = (scriptPath: string) =>
  join(dirname(scriptPath), ".cache", "brawler");

export async function build(scriptPath: string) {
  log.info(`building ${scriptPath}...`);

  const output = await transform({
    entryPoints: [scriptPath],
    target: "ES2021",
  });

  const outdir = getOutdir(scriptPath);
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
  log.info(`transformed ${count} files.`);
}

const list = (array: string[]) => array.join(", ");

export async function watch(
  scriptPath: string,
  watcher: Deno.FsWatcher,
) {
  for await (const event of watcher) {
    log.info(`Detected changes: ${list(event.paths)}`);
    await build(scriptPath);
  }
}

export async function dev(scriptPath: string) {
  const cwd = Deno.cwd();
  const scriptDir = dirname(scriptPath);

  await build(scriptPath);

  const outdir = getOutdir(scriptPath);
  log.info(`outdir = ${outdir}`);
  Deno.chdir(outdir);

  const wrangler = Deno.run({
    cmd: ["wrangler", "dev", basename(scriptPath)],
    stdin: "inherit",
    stdout: "inherit",
  });

  Deno.chdir(cwd);

  const watched: string[] = [];
  for await (const entry of Deno.readDir(scriptDir)) {
    if (entry.name !== ".cache") {
      watched.push(join(scriptDir, entry.name));
    }
  }

  log.info(`Watching changes: ${list(watched)}`);
  const watcher = Deno.watchFs(watched);
  watch(scriptPath, watcher);

  const status = await wrangler.status();
  wrangler.close();

  watcher.close();

  return status.code;
}
