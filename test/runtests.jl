using Test
using StringManipulation

const root = pwd()
const bin = Sys.iswindows() ? "brawler.cmd" : "brawler"
const brawler = joinpath(root, "bin", bin)

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

  tempdir = mktempdir()
  cd(tempdir)

  run(`$brawler init`)

  @test match(`cat deno.json`, "cloudflare/workers-types")
  @test match(`cat wrangler.toml`, basename(tempdir))

  cd(mktempdir())

  run(`$brawler init brawler-test -c brawler.toml`)

  @test match(`cat deno.json`, "cloudflare/workers-types")
  @test match(`cat brawler.toml`, "brawler-test")
end


