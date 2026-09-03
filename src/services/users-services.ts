import { db } from "../config/db";
import { users } from "../db/schema/users";
import { sessions } from "../db/schema/sessions";
import { eq } from "drizzle-orm";
import { BadRequestError, UnauthorizedError } from "../lib/errors";

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
      throw new BadRequestError("Email already exist");
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
      throw new BadRequestError("email atau password salah");
    }

    // 2. Verifikasi password dengan hash bcrypt
    const isPasswordValid = await Bun.password.verify(data.password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestError("email atau password salah");
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

  /**
   * Mengambil data profil user saat ini berdasarkan token session
   */
  async getCurrentUser(token: string) {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        created_at: users.createdAt,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1);

    const currentUser = result[0];
    if (!currentUser) {
      throw new UnauthorizedError();
    }

    return currentUser;
  }

  /**
   * Logout user dan hapus session dari database.
   * Menggunakan single DELETE query dan cek rowsAffected
   * untuk menghindari double round-trip ke database.
   */
  async logout(token: string) {
    const [result] = await db
      .delete(sessions)
      .where(eq(sessions.token, token));

    // Jika tidak ada row yang terhapus, berarti token tidak valid
    if (result.affectedRows === 0) {
      throw new UnauthorizedError();
    }

    return { success: true };
  }
}

export const usersService = new UsersService();
