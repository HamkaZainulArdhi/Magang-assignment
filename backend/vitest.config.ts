import { defineConfig } from "vitest/config";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Load the test database/JWT configuration before any test module imports the app.
const envFile = resolve(process.cwd(), ".env.test");
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const env = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined),
);

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
    env,
  },
});
