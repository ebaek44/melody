import { loadEnvConfig } from "@next/env";
import { closeDatabase, initializeDatabase } from "../src/lib/db";
import { DatabaseConfigurationError } from "../src/lib/database/config";

async function main() {
  loadEnvConfig(process.cwd());
  try {
    await initializeDatabase();
    console.log(
      "Postgres is connected. musicweb’s account and library schema is ready.",
    );
  } catch (error) {
    console.error(
      error instanceof DatabaseConfigurationError
        ? error.message
        : "Database connection/setup failed. Check the connection string, database access, and provider status.",
    );
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}
void main().catch(() => {
  console.error("Database setup did not complete.");
  process.exitCode = 1;
});
