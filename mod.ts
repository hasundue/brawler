import * as log from "https://deno.land/std@0.157.0/log/mod.ts";
import { transform } from "https://deno.land/x/dnt@0.30.0/transform.ts";
import $ from "https://deno.land/x/dax@0.12.0/mod.ts";

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

export async function build(
  scriptPath: string,
) {
  const output = await transform({
    entryPoints: [scriptPath],
    target: "ES2021",
  });
  console.log(output);

  const file = output.main.files[0];
  const text = file.fileText;

  return text;
}
