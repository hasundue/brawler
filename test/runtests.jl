using Test
using StringManipulation
using HTTP

const root = pwd()
const bin = Sys.iswindows() ? "brawler.cmd" : "brawler"
const brawler = joinpath(root, "bin", bin)

const host = "http://localhost:8787"

match(cmd::Cmd, str::String) = occursin(
  str,
  remove_decorations(readchomp(cmd))
)

function match(host, str::String)
  sleep(1)
  res = HTTP.request("GET", host)
  return String(res.body) == str
end

@testset "install" begin
  run(`deno task install`)
  @test match(`$brawler --version`, "brawler")
end

@testset "help" begin
  @test match(`$brawler -h`, "brawler")
end

@testset "init" begin
  @test match(`$brawler init -h`, "brawler")

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
  @test match(`$brawler dev -h`, "--log-level")

  mktempdir() do tempdir
    cd(tempdir) do
      cp("$root/examples/hono/index.ts", "index.ts")

      proc = run(`$brawler dev index.ts -l`, wait=false)
      @test match(host, "Hello! Hono!")

      cp("$root/test/hono/index.ts", "index.ts", force=true)
      @test match(host, "Hello, again! Hono!")

      kill(proc)
    end
  end
end
