import { Hono } from "npm:hono@3.8.0";

const app = new Hono();

app.get("/", (c) => c.text("Hello! Hono!"));

export default app;
