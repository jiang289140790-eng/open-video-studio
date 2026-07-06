export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function assertNonEmpty(value: string, code: string, message: string): void {
  if (value.trim().length === 0) {
    throw new AppError(code, message);
  }
}
