import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

/** Real PostgreSQL SQL engine with a TCP wire endpoint; never a hosted account. */
export async function startTestPostgres() {
  const db = await PGlite.create();
  const server = new PGLiteSocketServer({
    db,
    port: 0,
    host: "127.0.0.1",
    maxConnections: 10,
  });
  await server.start();
  return {
    db,
    url: `postgresql://postgres:postgres@${server.getServerConn()}/postgres?sslmode=disable`,
    async close() {
      await server.stop();
      await db.close();
    },
  };
}
