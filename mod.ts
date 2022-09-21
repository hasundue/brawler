import { transform } from "https://deno.land/x/dnt@0.30.0/transform.ts";
import $ from "https://deno.land/x/dax@0.12.0/mod.ts";

export async function build(script: string) {
  const output = await transform({
    entryPoints: [script],
    target: "ES2021",
  });
  console.log(output);

  const file = output.main.files[0];
  const text = file.fileText;

  return text;
}
