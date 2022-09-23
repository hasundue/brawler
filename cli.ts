import {
  Command,
  EnumType,
} from "https://deno.land/x/cliffy@v0.25.1/command/mod.ts";
import { dev, init, wranglerLogLevel } from "./mod.ts";

new Command()
  .name("brawler")
  .description("Develop and deploy Cloudflare Workers with Deno and Wrangler")
  .command(
    "init",
    "Create wrangler.toml and deno.json configuration files",
  )
  .option("-c, --config <path:string>", "Path to .toml configuration file")
  .arguments("[name:string] [options...]")
  .action((options, name) => init(name, options))
  .command(
    "dev",
    "Start a local server for developing your worker.\nYou can pass any other options available in wrangler.",
  )
  .type("log-level", new EnumType(wranglerLogLevel))
  .option("-*, --* [value]", "Options passed to wrangler", {
    hidden: true,
  })
  .option("--log-level <level:log-level>", "Specify logging level")
  .arguments("<script:string> [options...]")
  .action((options, script) =>
    dev(script, {
      logLevel: options.logLevel ?? "log",
      ...options,
    })
  )
  .parse();
