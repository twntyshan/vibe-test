import { t } from "elysia";

export const createUserSchema = t.Object({
  name: t.String({ minLength: 2, error: "Name must be at least 2 characters" }),
  email: t.String({ format: "email", error: "Invalid email format" }),
});

export const updateUserSchema = t.Partial(createUserSchema);

export const userParamsSchema = t.Object({
  id: t.Numeric({ error: "ID must be a valid number" }),
});
