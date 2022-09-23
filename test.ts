import { assert } from "https://deno.land/std@0.157.0/testing/asserts.ts";
import { build, setup } from "./mod.ts";

Deno.test("build examples/hono/index.ts", async () => {
  await build("./examples/hono/index.ts");
});
