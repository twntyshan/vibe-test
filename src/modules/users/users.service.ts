import { db } from "../../config/db";
import { users, type NewUser } from "../../db/schema";
import { eq } from "drizzle-orm";

export class UsersService {
  async getAllUsers() {
    return await db.select().from(users);
  }

  async getUserById(id: number) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  }

  async createUser(data: NewUser) {
    const [result] = await db.insert(users).values(data);
    return { id: result.insertId, ...data };
  }

  async updateUser(id: number, data: Partial<NewUser>) {
    await db.update(users).set(data).where(eq(users.id, id));
    return this.getUserById(id);
  }

  async deleteUser(id: number) {
    const existing = await this.getUserById(id);
    if (!existing) return null;
    await db.delete(users).where(eq(users.id, id));
    return existing;
  }
}

export const usersService = new UsersService();
