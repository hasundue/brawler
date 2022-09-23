import * as log from "https://deno.land/std@0.157.0/log/mod.ts";
import { assert } from "https://deno.land/std@0.157.0/testing/asserts.ts";
import { build, setup } from "./mod.ts";

Deno.test("set the log level as WARNING", () => {
  setup({ log: "WARNING" });

  log.info(
    // this shouldn't be called
    () => assert(false),
  );

  log.error(
    // this should be called
    () => assert(true),
  );
});

Deno.test("build examples/hono/index.ts", async () => {
  await build("./examples/hono/index.ts");
});
