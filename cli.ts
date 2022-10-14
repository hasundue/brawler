import {
  Command,
  EnumType,
} from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";
import { dev, init, publish, wranglerLogLevel } from "./mod.ts";

new Command()
  .name("brawler")
  .version("0.1.0")
  .description("Develop and deploy Cloudflare Workers with Deno and Wrangler")
  .globalType("log-level", new EnumType(wranglerLogLevel))
  .globalOption(
    "-c, --config <path:string>",
    "Path to .toml configuration file",
  )
  .command(
    "init",
    "Create wrangler.toml and deno.json configuration files",
  )
  .arguments("[name:string] [options...]")
  .action(async (options, name) => await init(name, options))
  .command(
    "dev",
    "Start a local server for developing your worker",
  )
  .option("-*, --* [value]", "Options passed to wrangler", {
    hidden: true,
  })
  .option("--log-level <level:log-level>", "Specify logging level")
  .arguments("<script:string> [options...]")
  .action(async (options, script) =>
    await dev(script, {
      logLevel: options.logLevel ?? "log",
      ...options,
    })
  )
  .command(
    "publish",
    "Publish your Worker to Cloudflare",
  )
  .option("-*, --* [value]", "Options passed to wrangler", {
    hidden: true,
  })
  .option("--log-level <level:log-level>", "Specify logging level")
  .arguments("<script:string> [options...]")
  .action(async (options, script) => await publish(script, options))
  .parse();
