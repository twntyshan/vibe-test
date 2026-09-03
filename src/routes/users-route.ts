import { Elysia, t } from "elysia";
import { usersService } from "../services/users-services";
import { extractBearerToken } from "../utils/auth";
import { BadRequestError, UnauthorizedError } from "../lib/errors";

export const usersRoute = new Elysia({ prefix: "/users" })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        await usersService.register(body);
        set.status = 201;
        return { data: "Ok" };
      } catch (error: any) {
        if (error instanceof BadRequestError) {
          set.status = 400;
          return { error: error.message };
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
  )
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const result = await usersService.login(body);
        set.status = 200;
        return { data: result.token };
      } catch (error: any) {
        if (error instanceof BadRequestError) {
          set.status = 400;
          return { error: error.message };
        }

        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
      detail: {
        summary: "User login",
        tags: ["Users"],
      },
    }
  )
  .get(
    "/login/current",
    async ({ headers, set }) => {
      try {
        const token = extractBearerToken(headers["authorization"]);
        const user = await usersService.getCurrentUser(token);
        set.status = 200;
        return { data: user };
      } catch (error: any) {
        if (error instanceof UnauthorizedError) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      detail: {
        summary: "Get current logged-in user profile",
        tags: ["Users"],
      },
    }
  )
  .delete(
    "/logout",
    async ({ headers, set }) => {
      try {
        const token = extractBearerToken(headers["authorization"]);
        await usersService.logout(token);
        set.status = 200;
        return { data: "OK" };
      } catch (error: any) {
        if (error instanceof UnauthorizedError) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      detail: {
        summary: "User logout and invalidate session",
        tags: ["Users"],
      },
    }
  );
