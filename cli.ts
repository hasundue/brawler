import {
  Command,
  EnumType,
} from "https://deno.land/x/cliffy@v0.25.1/command/mod.ts";
import { dev, wranglerLogLevel } from "./mod.ts";

new Command()
  .name("brawler")
  .description("Develop and deploy Cloudflare Workers with Deno and Wrangler")
  .command(
    "dev",
    "Start a local server for developing your worker.\nYou can pass any other options available in wrangler.",
  )
  .type("log-level", new EnumType(wranglerLogLevel))
  .option("--log-level <level:log-level>", "Specify logging level")
  .option("-*, --* [value]", "Options passed to wrangler", { hidden: true })
  .arguments("<script:string> [options...]")
  .action(async (options, script) => await dev(script, options))
  .parse();
