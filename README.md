# brawler

[![Test](https://github.com/hasundue/brawler/actions/workflows/test.yml/badge.svg)](https://github.com/hasundue/brawler/actions/workflows/test.yml)

![Deno](https://img.shields.io/badge/Deno-1.25.4-blue)
![Node](https://img.shields.io/badge/Node-16.17.0-blue)
![Wrangler](https://img.shields.io/badge/Wrangler-2.1.6-blue)
![Ubuntu](https://img.shields.io/badge/Ubuntu-latest-blue)
![Windows](https://img.shields.io/badge/Windows-latest-blue)

`brawler` is a command-line tool and library to develop and deploy
[Deno](https://deno.land) scripts for
[Cloudflare Workers](https://workers.cloudflare.com) with
[Wrangler](https://developers.cloudflare.com/workers/wrangler/get-started).

> **Warning**\
> The project is still in an early-beta stage and not tested extensively yet.

## Installation

Use the script installer of `deno`:

```sh
deno install -A --name brawler https://deno.land/x/brawler@0.1.0/cli.ts
```

Note that `wrangler` (https://github.com/cloudflare/wrangler2) must be also
installed to use `brawler`.

## Usage

Use `brawler init`, `brawler dev`, and `brawler publish` instead of
`wrangler init`, `wrangler dev`, and `wrangler publish`, respectively.

You can pass any options available in `wrangler`.

See `brawler --help` and `wrangler --help` for details.

```sh
# create wrangler.toml and deno.json in cwd (optional)
brawler init

# develop a script locally with hot-reload
touch index.ts
brawler dev index.ts

# publish it
brawler publish index.ts --name my-brawler-project
```

## How it works

`brawler` is basically just a wrapper of `wrangler`.

It transforms Deno scripts into Node modules by `dnt`
(https://github.com/denoland/dnt), and passes them to `wrangler`. It also
watches updates on a project by `Deno.watchFs` and repeats the procedure for
each update.

## Examples

- [/examples/hono](/examples/hono): Hello-world with
  [Hono](https://github.com/honojs/hono) framework
  - Hosted version: https://brawler-hono.hasundue.workers.dev

## Background

Yes, we have `denoflare` (https://denoflare.dev), which is a great project
letting you work with a pure Deno environment.

However, `denoflare` still lacks a significant portion of functionality in
`wrangler`, which is why this project exists for now.
