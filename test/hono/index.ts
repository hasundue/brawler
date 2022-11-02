import { Hono } from "https://deno.land/x/hono@v2.4.1/mod.ts";

const app = new Hono();

app.get("/", (c) => c.text("Hello, again! Hono!"));

export default app;
