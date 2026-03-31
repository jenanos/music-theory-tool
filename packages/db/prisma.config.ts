import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

const configDir = dirname(fileURLToPath(import.meta.url));

for (const envPath of [resolve(configDir, "../../.env"), resolve(configDir, ".env")]) {
    if (existsSync(envPath)) {
        process.loadEnvFile(envPath);
    }
}

export default defineConfig({
    schema: "./prisma/schema.prisma",
    migrations: {
        seed: "tsx src/seed.ts",
    },
});
