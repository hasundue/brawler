import { assert } from "https://deno.land/std@0.156.0/testing/asserts.ts";
import { build } from "./mod.ts";

Deno.test("transpile examples/hono/index.ts", async () => {
  await build("./examples/hono/index.ts");
});
