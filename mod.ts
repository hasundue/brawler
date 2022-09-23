import * as log from "https://deno.land/std@0.157.0/log/mod.ts";
import { dirname, join } from "https://deno.land/std@0.157.0/path/mod.ts";
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

export async function build(scriptPath: string) {
  log.info(`building ${scriptPath}...`);

  const outdir = join(
    dirname(scriptPath),
    ".cache",
    "brawler",
  );

  log.info(`outdir = ${outdir}`);
  log.info(`transforming the script to Node.js format...`);

  const output = await transform({
    entryPoints: [scriptPath],
    target: "ES2021",
  });

  const count = output.main.files.length;

  log.info(`transformed ${count} files.`);

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

  log.info(`written out ${count} files.`);
}
