import { db } from "../config/db";
import { users } from "../db/schema/users";
import { sessions } from "../db/schema/sessions";
import { eq } from "drizzle-orm";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserInput {
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

  /**
   * Login user dan buat sesi baru
   */
  async login(data: LoginUserInput) {
    // 1. Cari user berdasarkan email
    const user = await this.findByEmail(data.email);
    if (!user) {
      throw new Error("email atau password salah");
    }

    // 2. Verifikasi password dengan hash bcrypt
    const isPasswordValid = await Bun.password.verify(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error("email atau password salah");
    }

    // 3. Generate token UUID baru
    const token = crypto.randomUUID();

    // 4. Simpan session baru ke tabel sessions
    await db.insert(sessions).values({
      token,
      userId: user.id,
    });

    // 5. Kembalikan token
    return { token };
  }
}

export const usersService = new UsersService();

