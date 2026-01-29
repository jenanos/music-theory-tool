import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path relative to the package
const dbPath = join(__dirname, "..", "data", "music.db");

// Create the libsql client
const client = createClient({
    url: `file:${dbPath}`,
});

// Create Drizzle instance with schema
export const db = drizzle(client, { schema });

// Export the raw client for advanced use cases
export { client };
