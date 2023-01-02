import { Hono } from "https://deno.land/x/hono@v2.7.1/mod.ts";

const app = new Hono();

app.get("/", (c) => c.text("Hello! Hono!"));

export default app;
