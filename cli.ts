import { Command } from "https://deno.land/x/cliffy@v0.25.1/command/mod.ts";
import { transpile } from "./mod.ts";

new Command()
  .name("flash")
  .command("dev", "Start a local server for developing your worker")
  .arguments("<script:string>")
  .action(async (_, script: string) => transpile(script))
  .parse();
