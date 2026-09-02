import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { env } from "./config/env";
import { usersController } from "./modules/users/users.controller";

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: "Vibe Backend API",
          version: "1.0.0",
          description: "ElysiaJS + Drizzle ORM + MySQL backend powered by Bun",
        },
      },
    })
  )
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }))
  .use(usersController)
  .listen(env.PORT);

console.log(`🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`);
console.log(`📑 Swagger Documentation available at http://${app.server?.hostname}:${app.server?.port}/swagger`);

export type App = typeof app;
