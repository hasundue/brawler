using Test
using StringManipulation
using HTTP

const root = pwd()
const bin = Sys.iswindows() ? "brawler.cmd" : "brawler"
const brawler = joinpath(root, "bin", bin)

const host = "http://127.0.0.1:8787"

match(cmd::Cmd, str::String) = occursin(
  str,
  remove_decorations(readchomp(cmd))
)

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

      res = HTTP.request("GET", host)
      @test String(res.body) == "Hello! Hono!"

      cp("$root/test/hono/index.ts", "index.ts", force=true)
      sleep(1)

      res = HTTP.request("GET", host)
      @test_broken String(res.body) == "Hello, again! Hono!"

      kill(proc)
    end
  end
end
