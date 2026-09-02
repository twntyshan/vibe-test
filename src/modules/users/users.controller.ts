import { Elysia } from "elysia";
import { usersService } from "./users.service";
import { createUserSchema, updateUserSchema, userParamsSchema } from "./users.model";

export const usersController = new Elysia({ prefix: "/users" })
  .get("/", async () => {
    const data = await usersService.getAllUsers();
    return { success: true, data };
  }, {
    detail: { summary: "Get all users", tags: ["Users"] }
  })

  .get("/:id", async ({ params, set }) => {
    const user = await usersService.getUserById(params.id);
    if (!user) {
      set.status = 404;
      return { success: false, message: "User not found" };
    }
    return { success: true, data: user };
  }, {
    params: userParamsSchema,
    detail: { summary: "Get user by ID", tags: ["Users"] }
  })

  .post("/", async ({ body, set }) => {
    const newUser = await usersService.createUser(body);
    set.status = 201;
    return { success: true, data: newUser };
  }, {
    body: createUserSchema,
    detail: { summary: "Create new user", tags: ["Users"] }
  })

  .put("/:id", async ({ params, body, set }) => {
    const updated = await usersService.updateUser(params.id, body);
    if (!updated) {
      set.status = 404;
      return { success: false, message: "User not found" };
    }
    return { success: true, data: updated };
  }, {
    params: userParamsSchema,
    body: updateUserSchema,
    detail: { summary: "Update user by ID", tags: ["Users"] }
  })

  .delete("/:id", async ({ params, set }) => {
    const deleted = await usersService.deleteUser(params.id);
    if (!deleted) {
      set.status = 404;
      return { success: false, message: "User not found" };
    }
    return { success: true, message: "User deleted successfully", data: deleted };
  }, {
    params: userParamsSchema,
    detail: { summary: "Delete user by ID", tags: ["Users"] }
  });
