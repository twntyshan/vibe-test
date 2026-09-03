import { Elysia, t } from "elysia";
import { usersService } from "../services/users-services";

export const usersRoute = new Elysia({ prefix: "/users" })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        await usersService.register(body);
        set.status = 201;
        return { data: "Ok" };
      } catch (error: any) {
        if (error.message === "Email already exist") {
          set.status = 400;
          return { error: "Email already exist" };
        }

        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
      }),
      detail: {
        summary: "Register new user",
        tags: ["Users"],
      },
    }
  );
