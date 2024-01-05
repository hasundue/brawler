import { Hono } from "npm:hono@3.12.0";

const app = new Hono();

app.get("/", (c) => c.text("Hello! Hono!"));

export default app;
