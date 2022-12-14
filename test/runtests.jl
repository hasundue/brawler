using Test
using StringManipulation
using HTTP
using URIs

const root = pwd()
const bin = Sys.iswindows() ? "brawler.cmd" : "brawler"
const brawler = "$root/bin/$bin"

const localhost = URIs.URI("http://localhost:8787")
const subdomain = ENV["CLOUDFLARE_SUBDOMAIN"]

const match(cmd::Cmd, str::String) = occursin(
  str,
  remove_decorations(readchomp(cmd))
)

function match(host::URIs.URI, str::String)
  sleep(1)
  res = HTTP.request("GET", host)
  return String(res.body) == str
end

@testset "build" begin
  run(`deno task build`)
  @test match(`$brawler --version`, "brawler")
end

@testset "help" begin
  @test match(`$brawler -h`, "brawler")
end

@testset "init" begin
  @test match(`$brawler dev -h`, "--config")

  mktempdir() do tempdir
    cd(tempdir) do
      run(`$brawler init`)
      @test match(`cat deno.json`, "cloudflare/workers-types")
      @test match(`cat wrangler.toml`, basename(tempdir))
    end
  end

  mktempdir() do tempdir
    cd(tempdir) do
      run(`$brawler init brawler-test -c brawler.toml`)
      @test match(`cat deno.json`, "cloudflare/workers-types")
      @test match(`cat brawler.toml`, "brawler-test")
    end
  end
end

@testset "dev hono" begin
  @test match(`$brawler dev -h`, "--config")
  @test match(`$brawler dev -h`, "--log-level")

  mktempdir() do tempdir
    cd(tempdir) do
      cp("$root/examples/hono/index.ts", "index.ts")

      proc = open(`$brawler dev index.ts -l --inspect false`, write=true)
      @test match(localhost, "Hello! Hono!")

      cp("$root/test/hono/index.ts", "index.ts", force=true)
      @test match(localhost, "Hello, again! Hono!")

      write(proc, 'x')
      close(proc)
    end
  end
end

@testset "publish hono" begin
  @test match(`$brawler dev -h`, "--config")
  @test match(`$brawler dev -h`, "--log-level")

  proc = run(`$brawler publish examples/hono/index.ts`)
  @test proc.exitcode == 0

  host = URIs.URI("https://brawler-hono.$subdomain")
  @test match(host, "Hello! Hono!")
end
