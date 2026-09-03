import { db } from "../config/db";
import { users } from "../db/schema/users";
import { eq } from "drizzle-orm";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export class UsersService {
  /**
   * Cari user berdasarkan email
   */
  async findByEmail(email: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Registrasi user baru dengan password bcrypt
   */
  async register(data: RegisterUserInput) {
    // 1. Cek apakah email sudah terdaftar
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new Error("Email already exist");
    }

    // 2. Hash password menggunakan bcrypt bawaan Bun
    const hashedPassword = await Bun.password.hash(data.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    // 3. Simpan data user ke database
    await db.insert(users).values({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });

    return { success: true };
  }
}

export const usersService = new UsersService();
