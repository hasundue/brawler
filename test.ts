import {
  afterAll,
  beforeAll,
  describe,
  it,
} from "https://deno.land/std@0.201.0/testing/bdd.ts";
import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.201.0/assert/mod.ts";
import { deadline, retry } from "https://deno.land/std@0.201.0/async/mod.ts";
import $ from "https://deno.land/x/dax@0.34.0/mod.ts";

const isWindows = Deno.build.os === "windows";
const brawler = isWindows ? "bin/brawler.cmd " : "bin/brawler";
const script = "examples/hono/index.ts";
const compatibility_date = "2023-08-15";

describe("brawler", () => {
  describe("$ brawler --version", () => {
    it(`should print version info`, async () => {
      const stdout = await $`${brawler} --version`.text();
      assertStringIncludes(stdout, "brawler");
    });
  });

  describe("$ brawler --help", () => {
    it(`should display help`, async () => {
      const stdout = await $`${brawler} -h`.text();
      assertStringIncludes(stdout, "brawler");
    });
  });
});

describe("brawler dev", { ignore: isWindows }, () => {
  describe("$ brawler dev", () => {
    it("should print an error", async () => {
      try {
        await $`${brawler} dev`.quiet();
        throw new Error("should have thrown");
      } catch {
        // OK
      }
    });
  });

  describe("$ brawler dev --help", () => {
    it(`should display help`, async () => {
      const text = await $`${brawler} dev -h`.text();
      assertStringIncludes(text, "brawler");
    });
  });

  describe("$ brawler dev index.ts", () => {
    const decoder = new TextDecoder();
    const content = Deno.readTextFileSync(script);
    let tmp: string;
    let child: Deno.ChildProcess;

    beforeAll(async () => {
      tmp = await Deno.makeTempDir();
      const command = new Deno.Command(brawler, {
        args: ["dev", script],
        stdout: "piped",
      });
      child = command.spawn();
    });

    afterAll(async () => {
      await child.stdout.cancel();
      child.kill("SIGINT");
      await child.status;
      await Deno.remove(tmp, { recursive: true });
      await Deno.writeTextFile(script, content);
    });

    it("should start a dev server", async () => {
      const reader = child.stdout.getReader();
      await deadline(
        (async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) throw new Error("unexpected EOF");
            const text = decoder.decode(value);
            if (text.includes("Ready on")) break;
          }
        })(),
        5000,
      );
      reader.releaseLock();
    });

    it("should serve the script", () =>
      retry(async () => {
        const response = await fetch("http://localhost:8787");
        assertEquals(response.status, 200);
        const text = await response.text();
        assertStringIncludes(text, "Hono!");
      }));

    it(`should live-reload`, async () => {
      const modified = content.replace("Hono!", "Brawler!");
      await Deno.writeTextFile(script, modified);

      const reader = child.stdout.getReader();
      await deadline(
        (async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) throw new Error("unexpected EOF");
            const text = decoder.decode(value);
            if (text.includes("Updated and ready on")) break;
          }
        })(),
        5000,
      );
      reader.releaseLock();

      await retry(async () => {
        const response = await fetch("http://localhost:8787");
        assertEquals(response.status, 200);
        const text = await response.text();
        assertStringIncludes(text, "Brawler!");
      });
    });
  });
});

describe("brawler deploy", () => {
  describe("$ brawler deploy", () => {
    it("should print an error", async () => {
      try {
        await $`${brawler} deploy`.quiet();
        throw new Error("should have thrown");
      } catch {
        // OK
      }
    });
  });
  describe("$ brawler deploy --help", () => {
    it(`should display help`, async () => {
      const text = await $`${brawler} deploy -h`.text();
      assertStringIncludes(text, "brawler");
    });
  });
  describe("$ brawler deploy index.ts", () => {
    it("should publish the script", async () => {
      const text =
        await $`${brawler} deploy ${script} --name brawler-hono --compatibility-date ${compatibility_date}`
          .text();
      assertStringIncludes(text, "Published");
    });
  });
});
