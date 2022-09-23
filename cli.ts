import { Command } from "https://deno.land/x/cliffy@v0.25.1/command/mod.ts";
import { dev } from "./mod.ts";

new Command()
  .name("brawler")
  .description(
    "Develop and deploy Deno scripts for Cloudflare Workers with Wrangler",
  )
  .command("dev", "Start a local server for developing your worker")
  .arguments("<script:string>")
  .action(async (_, script) => await dev(script))
  .parse();
