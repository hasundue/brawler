# 🥊 Brawler

<!-- deno-fmt-ignore-start -->

[![Test](https://github.com/hasundue/brawler/actions/workflows/test.yml/badge.svg)](https://github.com/hasundue/brawler/actions/workflows/test.yml)
![Deno](https://img.shields.io/badge/Deno-v1.38.4-blue?logo=deno) <!-- @denopendabot denoland/deno -->
![Node](https://img.shields.io/badge/Node-v21.3.0-blue?logo=node) <!-- @denopendabot nodejs/node -->
![Wrangler](https://img.shields.io/badge/Wrangler-3.6.0-blue?logo=cloudflare)

Brawler is a wrapper of [Wrangler](https://developers.cloudflare.com/workers/wrangler/get-started) to develop and deploy
[Cloudflare Workers](https://workers.cloudflare.com) with [Deno](https://deno.land).

<!-- deno-fmt-ignore-end -->

> **Warning**\
> The project is still under development and not tested extensively yet.

## Installation

Use the script installer of `deno`:

```sh
deno install -A --name brawler https://deno.land/x/brawler/cli.ts
```

Note that `wrangler` must be also installed and executable.

## Usage

Use `brawler dev` and `brawler deploy` instead of `wrangler dev` and
`wrangler deploy`, respectively.

See `brawler --help` and `wrangler --help` for details.

Command-line options are passed through for `wrangler`.

```sh
# develop a script locally with hot-reload
touch index.ts
brawler dev index.ts

# publish it
brawler deploy index.ts --name my-brawler-project --compatibility-date 2023-08-15
```

## How it works

Brawler bundles Deno scripts with `esbuild` and `esbuild-deno-loader`, and
passes them to `wrangler`. It also watches updates on projects by `Deno.watchFs`
and repeats the procedure for each update.

## Examples

- [/examples/hono](/examples/hono): Hello-world with
  [Hono](https://github.com/honojs/hono) framework
  - Hosted version: https://brawler-hono.hasundue.workers.dev

## Background

Yes, we have Denoflare (https://denoflare.dev), which is a great project letting
you work with a pure Deno environment.

However, Denoflare still lacks some portion of functionality that Wrangler
provides, which is why this project exists for now.
