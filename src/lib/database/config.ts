import type { PoolConfig } from "pg";

export class DatabaseConfigurationError extends Error {
  constructor() {
    super(
      "Set DATABASE_URL to a Postgres connection string before using accounts.",
    );
    this.name = "DatabaseConfigurationError";
  }
}

/** Pure configuration parsing; errors never echo a credential-bearing URL. */
export function databaseConfig(
  env: Record<string, string | undefined> = process.env,
): PoolConfig {
  const value = env.DATABASE_URL?.trim() || env.POSTGRES_URL?.trim();
  if (!value) throw new DatabaseConfigurationError();
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new DatabaseConfigurationError();
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname ||
    !url.pathname.slice(1)
  ) {
    throw new DatabaseConfigurationError();
  }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  // Hosted connections must authenticate the server and use TLS. Development
  // Postgres on the loopback interface can run without TLS.
  if (!loopback || env.VERCEL === "1") {
    url.searchParams.set("sslmode", "verify-full");
  }
  return {
    connectionString: url.toString(),
    max: 3,
    min: 0,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 10000,
    statement_timeout: 10000,
    allowExitOnIdle: true,
  };
}
