# brawler

`brawler` is a command-line tool and library to develop and deploy Cloudflare
Workers with Deno and Wrangler.

It uses `dnt` (https://github.com/denoland/dnt) for Deno-to-Node transformation internally.

> **Warning**\
> The project is still in an early-beta stage and not tested extensively yet.

## Installation

Use the script installer of `deno`:

```sh
deno install -A --name brawler https://deno.land/x/brawler@0.1.0/cli.ts
```

Note that `wrangler` (https://github.com/cloudflare/wrangler2) must be also installed to use `brawler`.

## Usage

Use `brawler init`, `brawler dev`, and `brawler publish` instead of `wrangler init`, `wrangler dev`, and `wrangler publish`, respectively.

See `brawler --help` for details.

```sh
# create wrangler.toml and deno.json in the current directory
brawler init

# develop a script locally with hot-reload
touch index.ts
brawler dev index.ts

# publish it
brawler publish index.ts --name my-brawler-project
```

## Examples

- [/examples/hono](/examples/hono): Hello-world with Hono framework (https://github.com/honojs/hono)
  - Deployed at https://brawler-hono.hasundue.workers.dev
