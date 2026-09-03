/**
 * Custom error classes untuk standardisasi error handling di seluruh aplikasi.
 * Menggunakan custom error class menghindari perbandingan string hardcoded
 * pada error.message di layer routing.
 */

export class UnauthorizedError extends Error {
  readonly statusCode = 401;

  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class BadRequestError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}
