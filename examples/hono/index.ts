import { Hono } from "npm:hono@3.1.4";

const app = new Hono();

app.get("/", (c) => c.text("Hello! Hono!"));

export default app;
