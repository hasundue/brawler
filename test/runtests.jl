using Test
using StringManipulation

const root = pwd()
const brawler = joinpath(root, "bin", "brawler")
const cache = joinpath(".cache", "test")

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

  mkpath(cache)
  cd(cache)
  rm("deno.json", force=true)
  rm("wrangler.toml", force=true)

  run(`$brawler init`)
  @test match(`cat deno.json`, "cloudflare/workers-types")
  @test match(`cat wrangler.toml`, "test")

  rm("deno.json", force=true)
  rm("brawler.toml", force=true)

  run(`$brawler init brawler-test -c brawler.toml`)
  @test match(`cat deno.json`, "cloudflare/workers-types")
  @test match(`cat brawler.toml`, "brawler-test")

  cd(root)
end

