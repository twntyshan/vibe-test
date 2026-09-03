import { UnauthorizedError } from "../lib/errors";

/**
 * Mengekstrak Bearer token dari header Authorization.
 * Menghindari duplikasi logik parsing di setiap route handler.
 *
 * @param authorization - Nilai header Authorization (misal: "Bearer abc123")
 * @returns Token string yang sudah di-trim
 * @throws UnauthorizedError jika header tidak ada atau formatnya salah
 */
export function extractBearerToken(authorization: string | undefined): string {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new UnauthorizedError();
  }

  const token = authorization.slice(7).trim();
  if (!token) {
    throw new UnauthorizedError();
  }

  return token;
}
