import { t } from "elysia";

export const createUserSchema = t.Object({
  name: t.String({ minLength: 2, error: "Name must be at least 2 characters" }),
  email: t.String({ format: "email", error: "Invalid email format" }),
  password: t.String({ minLength: 6, error: "Password must be at least 6 characters" }),
});

export const updateUserSchema = t.Partial(createUserSchema);

export const userParamsSchema = t.Object({
  id: t.Numeric({ error: "ID must be a valid number" }),
});
