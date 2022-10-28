import { Hono } from "https://deno.land/x/hono@v2.3.2/mod.ts";

const app = new Hono();

app.get("/", (c) => c.text("Hello, again! Hono!"));

export default app;
