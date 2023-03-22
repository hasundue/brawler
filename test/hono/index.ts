import { Hono } from "https://deno.land/x/hono@v3.1.2/mod.ts";

const app = new Hono();

app.get("/", (c) => c.text("Hello, again! Hono!"));

export default app;
