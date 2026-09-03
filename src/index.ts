import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { env } from "./config/env";
import { usersRoute } from "./routes/users-route";

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: "Vibe Backend API",
          version: "1.0.0",
          description: "ElysiaJS + Drizzle ORM + MySQL backend",
        },
      },
    })
  )
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  .group("/api", (app) => app.use(usersRoute))
  .listen(env.PORT);

console.log(`🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`);
console.log(`📑 Swagger: http://${app.server?.hostname}:${app.server?.port}/swagger`);

export type App = typeof app;

