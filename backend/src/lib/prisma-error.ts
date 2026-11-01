// Reads a Prisma error code without importing the runtime error classes,
// which keeps the helper usable from both src and tests.
export function prismaErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}
