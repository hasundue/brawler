import {
  Command,
  EnumType,
} from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import { dev, publish, wranglerLogLevel } from "./mod.ts";

new Command()
  .name("brawler")
  .version("0.1.3") // @denopendabot hasundue/brawler
  .description("Develop and deploy Cloudflare Workers with Deno and Wrangler")
  .globalType("log-level", new EnumType(wranglerLogLevel))
  .globalOption(
    "-c, --config <path:string>",
    "Path to .toml configuration file",
  )
  .globalOption(
    "-o, --outdir <outdir:string>",
    "Directory to write the built worker to",
  )
  .globalOption(
    "--log-level <level:log-level>",
    "Specify logging level",
  )
  .globalOption("-*, --* [value]", "Options passed to wrangler", {
    hidden: true,
  })
  .command(
    "dev",
    "Start a local server for developing your worker",
  )
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
  .arguments("<script:string> [options...]")
  .action(async (options, script) => await publish(script, options))
  .parse();
