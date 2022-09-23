import { assertStringIncludes } from "https://deno.land/std@0.157.0/testing/asserts.ts";
import { basename, join } from "https://deno.land/std@0.157.0/path/mod.ts";
import { build, cacheDir, init } from "./mod.ts";

const dir = Deno.cwd();
const testDir = "./test";

Deno.test("init", async () => {
  const dirInfo = await Deno.stat(testDir);
  if (dirInfo.isDirectory) {
    await Deno.remove(testDir, { recursive: true });
  }
  await Deno.mkdir(testDir);
  Deno.chdir(testDir);

  await init();

  assertStringIncludes(
    await Deno.readTextFile("deno.json"),
    "https://pax.deno.dev/cloudflare/workers-types/index.d.ts",
  );

  assertStringIncludes(
    await Deno.readTextFile("wrangler.toml"),
    "test",
  );

  Deno.chdir(dir);
});

Deno.test("init brawler-test -c brawler.toml", async () => {
  const dirInfo = await Deno.stat(testDir);
  if (dirInfo.isDirectory) {
    await Deno.remove(testDir, { recursive: true });
  }
  await Deno.mkdir(testDir);
  Deno.chdir(testDir);

  await init("brawler-test", { config: "brawler.toml" });

  assertStringIncludes(
    await Deno.readTextFile("deno.json"),
    "https://pax.deno.dev/cloudflare/workers-types/index.d.ts",
  );

  assertStringIncludes(
    await Deno.readTextFile("brawler.toml"),
    "brawler-test",
  );

  Deno.chdir(dir);
});

Deno.test("build examples/hono/index.ts", async () => {
  const scriptPath = "./examples/hono/index.ts";
  const outdir = cacheDir(scriptPath);
  const output = join(outdir, basename(scriptPath));

  await build(scriptPath);

  assertStringIncludes(
    await Deno.readTextFile(output),
    'import { Hono } from "./deps/deno.land/x/hono@v2.1.4/mod.js";',
  );
});
