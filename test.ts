import { assertStringIncludes } from "https://deno.land/std@0.157.0/testing/asserts.ts";
import { build } from "./mod.ts";

const decoder = new TextDecoder();

Deno.test("build examples/hono/index.ts", async () => {
  await build("./examples/hono/index.ts");
  const output = await Deno.readFile("./examples/hono/.cache/brawler/index.ts");

  assertStringIncludes(
    decoder.decode(output),
    'import { Hono } from "./deps/deno.land/x/hono@v2.1.4/mod.js";',
  );
});
