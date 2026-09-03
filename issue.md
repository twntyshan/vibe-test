# [Feature] Implementasi Login User (`POST /api/users/login`) & Pembuatan Tabel `sessions`

---

## 📌 Informasi Tugas
- **Target Pelaksana**: Junior Backend Developer / AI Assistant
- **Fitur**: User Login & Session Management API
- **Tech Stack**: ElysiaJS, TypeScript, Bun runtime, Drizzle ORM, MySQL
- **Status**: Ready to Implement

---

## 🎯 Ringkasan & Tujuan
Membuat fitur autentikasi login pengguna yang memvalidasi `email` dan `password` terhadap data di tabel `users`.
- Password diverifikasi menggunakan `Bun.password.verify` dengan hash bcrypt yang tersimpan di database.
- Jika kredensial valid, sistem membuat record baru di tabel `sessions` dengan `token` berupa UUID (`crypto.randomUUID()`) dan mengembalikan respon sukses dengan token tersebut.
- Jika email tidak ditemukan atau password tidak cocok, sistem wajib mengembalikan error seragam `"email atau password salah"` (HTTP status `400`).

---

## 🗄️ 1. Spesifikasi Database

### Struktur Tabel `sessions`
Tabel disimpan di database MySQL dengan struktur kolom sebagai berikut:

| Nama Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `INT` / `SERIAL` | Auto Increment, Primary Key |
| `token` | `VARCHAR(255)` | Not Null, Unique (UUID) |
| `user_id` | `INT` | Not Null, Foreign Key ke `users.id` |
| `created_at` | `TIMESTAMP` | Default: `CURRENT_TIMESTAMP`, Not Null |

---

## 📡 2. Spesifikasi Kontrak API (API Contract)

### Endpoint
- **Method**: `POST`
- **URL**: `/api/users/login`
- **Headers**: `Content-Type: application/json`

### Request Body
```json
{
  "email": "jhon@localhost",
  "password": "password"
}
```

#### Aturan Validasi Input:
- `email`: Tipe `string`, wajib berupa format email yang valid.
- `password`: Tipe `string`, wajib diisi (minimal 1 karakter / minimal 6 karakter).

---

### Response Body

#### 1. Berhasil (Success) - HTTP Status `200`
```json
{
  "data": "550e8400-e29b-41d4-a716-446655440000"
}
```
> **Catatan**: Nilai `"data"` adalah token UUID string yang tersimpan di tabel `sessions`.

#### 2. Gagal: Kredensial Salah - HTTP Status `400`
```json
{
  "error": "email atau password salah"
}
```
> **Penting**: Pesan error ini digunakan baik saat email tidak ditemukan maupun saat password tidak cocok, untuk mencegah kebocoran informasi user enumeration.

#### 3. Gagal: Validasi Format Input Tidak Sesuai - HTTP Status `400` / `422`
Respon standar schema validation dari ElysiaJS (contoh: format email tidak valid).

---

## 📁 3. Struktur Folder & Standar Penamaan File

Pastikan struktur file mengikuti standar arsitektur yang telah ada:

```
src/
├── config/
│   ├── db.ts                     # Koneksi Drizzle ke MySQL (sudah ada)
│   └── env.ts                    # Validasi environment variables (sudah ada)
├── db/
│   └── schema/
│       ├── index.ts              # Re-export semua schema (perlu diexport sessions)
│       ├── users.ts              # Schema tabel users (sudah ada)
│       └── sessions.ts           # [BARU] Definisi schema tabel sessions
├── routes/
│   └── users-route.ts            # Menambahkan endpoint POST /login
├── services/
│   └── users-services.ts         # Menambahkan logic login & pembuatan token session
└── index.ts                      # Entry point aplikasi (sudah mount users-route)
```

> **Catatan Standar Penamaan:**
> - Direktori route: `src/routes/` (format: `users-route.ts`)
> - Direktori service: `src/services/` (format: `users-services.ts`)
> - Direktori schema: `src/db/schema/` (format: `sessions.ts`)

---

## 🛠️ 4. Langkah-Langkah Implementasi (Step-by-Step Guide)

Ikuti tahapan-tahapan di bawah ini secara berurutan:

---

### Langkah 1: Buat Skema Database `sessions`
**File Target**: `src/db/schema/sessions.ts`

Buat file baru untuk mendefinisikan tabel `sessions` menggunakan Drizzle ORM (`mysql-core`). Hubungkan kolom `user_id` dengan foreign key ke `users.id`.

```typescript
// src/db/schema/sessions.ts
import { mysqlTable, serial, varchar, int, timestamp } from "drizzle-orm/mysql-core";
import { users } from "./users";

export const sessions = mysqlTable("sessions", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
```

Perbarui file `src/db/schema/index.ts` agar mengekspor file schema `sessions`:
```typescript
// src/db/schema/index.ts
export * from "./users";
export * from "./sessions";
```

---

### Langkah 2: Sinkronisasi Skema ke Database (Migration / Push)
Jalankan perintah Drizzle Kit di terminal untuk menerapkan tabel `sessions` ke database MySQL:

```bash
bun run db:push
```
*Atau jika project menggunakan alur migration:*
```bash
bun run db:generate
bun run db:migrate
```

---

### Langkah 3: Tambahkan Business Logic Login pada Service Layer
**File Target**: `src/services/users-services.ts`

Tambahkan interface input login dan method `login` ke dalam class `UsersService`:
1. Query user berdasarkan `email`. Jika tidak ditemukan, lemparkan error `"email atau password salah"`.
2. Verifikasi hash password menggunakan `await Bun.password.verify(data.password, user.password)`. Jika `false`, lemparkan error `"email atau password salah"`.
3. Buat token unik UUID menggunakan `crypto.randomUUID()`.
4. Simpan record session baru ke tabel `sessions`.
5. Kembalikan token ke caller.

Contoh implementasi:
```typescript
// Tambahkan import sessions di bagian atas src/services/users-services.ts
import { sessions } from "../db/schema/sessions";

// Tambahkan interface LoginUserInput
export interface LoginUserInput {
  email: string;
  password: string;
}

// Tambahkan method login pada UsersService class:
export class UsersService {
  // ... method findByEmail dan register yang sudah ada ...

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
```

---

### Langkah 4: Tambahkan Route `POST /login` di Route Layer
**File Target**: `src/routes/users-route.ts`

Tambahkan endpoint `.post("/login", ...)` ke dalam `usersRoute`:
- Route prefix sudah `/users`, sehingga path `.post("/login", ...)` akan menghasilkan `/api/users/login` (karena di-mount dengan prefix `/api` di `src/index.ts`).
- Validasi body request menggunakan Elysia `t.Object`.
- Tangkap error: jika `error.message === "email atau password salah"`, set status `400` dan kembalikan `{ error: "email atau password salah" }`.
- Respon berhasil mengembalikan status `200` dengan format `{ data: token }`.

Contoh implementasi:
```typescript
// src/routes/users-route.ts
import { Elysia, t } from "elysia";
import { usersService } from "../services/users-services";

export const usersRoute = new Elysia({ prefix: "/users" })
  // Endpoint registrasi yang sudah ada
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
  )

  // [BARU] Endpoint login user
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const result = await usersService.login(body);
        set.status = 200;
        return { data: result.token };
      } catch (error: any) {
        if (error.message === "email atau password salah") {
          set.status = 400;
          return { error: "email atau password salah" };
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
  );
```

---

## 🧪 5. Panduan Pengujian (Testing & Verification)

Jalankan server pengembangan:
```bash
bun run dev
```

### 1. Prasyarat Pengujian: Buat User Terlebih Dahulu
Pastikan sudah ada user di database untuk diuji login:
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "jhon@localhost",
    "password": "password"
  }'
```

---

### 2. Test Kasus Sukses (Login Berhasil)
Jalankan request login dengan email dan password yang sesuai:
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jhon@localhost",
    "password": "password"
  }'
```

**Ekspektasi Respon (HTTP 200):**
```json
{
  "data": "3e9b1d9c-1082-4f9e-9134-2e6f47dfa91b"
}
```
*(Token berupa UUID string)*

---

### 3. Test Kasus Gagal (Password Salah)
Kirim password yang salah untuk user terdaftar:
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jhon@localhost",
    "password": "passwordsalah"
  }'
```

**Ekspektasi Respon (HTTP 400):**
```json
{
  "error": "email atau password salah"
}
```

---

### 4. Test Kasus Gagal (Email Tidak Terdaftar)
Kirim email yang belum pernah didaftarkan:
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tidakada@localhost",
    "password": "password"
  }'
```

**Ekspektasi Respon (HTTP 400):**
```json
{
  "error": "email atau password salah"
}
```

---

### 5. Test Kasus Gagal (Validasi Schema Input Gagal)
Kirim payload dengan email tidak valid:
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bukan-email",
    "password": ""
  }'
```

**Ekspektasi Respon (HTTP 400 / 422):**
Respon validasi error bawaan ElysiaJS.

---

### 6. Verifikasi Database MySQL
Jalankan query database untuk memastikan sesi tersimpan:
```sql
SELECT * FROM sessions ORDER BY id DESC LIMIT 5;
```
- Pastikan kolom `token` terisi UUID token yang sama dengan respon API.
- Pastikan kolom `user_id` merujuk ke ID user yang tepat di tabel `users`.
- Pastikan `created_at` mencatat waktu pembuatan sesi.

---

## ✅ 6. Definition of Done (Checklist Penyelesaian)

- [ ] Tabel `sessions` telah dibuat di MySQL dengan kolom `id`, `token`, `user_id`, dan `created_at`.
- [ ] File schema `src/db/schema/sessions.ts` dibuat dan diekspor melalui `src/db/schema/index.ts`.
- [ ] Drizzle migration / push berhasil dijalankan tanpa error (`bun run db:push`).
- [ ] Method `login` di `src/services/users-services.ts` memverifikasi password dengan `Bun.password.verify`.
- [ ] Token UUID digenerate menggunakan `crypto.randomUUID()` dan disimpan ke tabel `sessions`.
- [ ] Route `POST /api/users/login` terimplementasi di `src/routes/users-route.ts`.
- [ ] Respon sukses mengembalikan HTTP `200` dengan `{ "data": "<token>" }`.
- [ ] Respon gagal kredensial mengembalikan HTTP `400` dengan `{ "error": "email atau password salah" }`.
- [ ] Verifikasi typecheck berhasil tanpa error (`bunx tsc --noEmit`).
- [ ] Server dapat dijalankan dengan lancar (`bun run dev`).
