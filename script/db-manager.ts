import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Client } from "pg";
import { loadEnv } from "../utils/loadEnv";
import { ShellCommand } from "../utils/commandShell";

loadEnv();

// POSTGRES_DB = database to USE, not the one to create
const TARGET_DB = process.env.POSTGRES_APP_DB || "app_chatapp";

// Admin connection (always to postgres)
function createAdminClient() {
    return new Client({
        host: process.env.POSTGRES_HOST || "localhost",
        port: Number(process.env.POSTGRES_PORT) || 5432,
        user: process.env.POSTGRES_USER || "postgres",
        password: process.env.POSTGRES_PASSWORD || "postgres",
        database: "postgres",
    });
}

async function checkConnection() {
    const client = createAdminClient();
    try {
        await client.connect();
        console.log("Connected to PostgreSQL server successfully.");
        await client.end();
    } catch (error) {
        console.error("Failed to connect to PostgreSQL server:", error);
        process.exit(1);
    }
}

await checkConnection();

async function main() {
    const adminClient = createAdminClient();
    await adminClient.connect();

    console.log("🔍 Checking database:", TARGET_DB);

    const exists = await adminClient.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [TARGET_DB]
    );

    if (exists.rowCount === 0) {
        console.log(`📦 Creating database ${TARGET_DB}...`);
        await adminClient.query(`
      CREATE DATABASE ${TARGET_DB}
        WITH 
        OWNER = ${process.env.POSTGRES_USER || "postgres"};
    `);
    } else {
        console.log("✅ Database already exists.");
    }

    console.log("⏰ Setting timezone...");
    await adminClient.query(
        `ALTER DATABASE ${TARGET_DB} SET timezone TO 'America/Sao_Paulo';`
    );

    await adminClient.end();

    // Now connect to the target DB
    console.log("🔗 Connecting to target DB:", TARGET_DB);

    const appClient = new Client({
        host: process.env.POSTGRES_HOST || "localhost",
        port: Number(process.env.POSTGRES_PORT) || 5432,
        user: process.env.POSTGRES_USER || "postgres",
        password: process.env.POSTGRES_PASSWORD || "postgres",
        database: TARGET_DB,
    });

    await appClient.connect();

    const db = drizzle(appClient);

    console.log("📦 Installing extensions...");

    const extensions = [
        `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
        `CREATE EXTENSION IF NOT EXISTS pgcrypto;`,
        `CREATE EXTENSION IF NOT EXISTS hstore;`,
        `CREATE EXTENSION IF NOT EXISTS citext;`,
        `CREATE EXTENSION IF NOT EXISTS unaccent;`,
        `CREATE EXTENSION IF NOT EXISTS btree_gin;`,
        `CREATE EXTENSION IF NOT EXISTS btree_gist;`,
        `CREATE EXTENSION IF NOT EXISTS intarray;`,
    ];

    for (const ext of extensions) {
        console.log(`➡️ ${ext}`);
        await db.execute(sql`${sql.raw(ext)}`);
    }

    console.log("🎉 PostgreSQL environment ready!");
    await appClient.end();
}

main()
    .then(async () => {
        console.log("🚀 Running drizzle-kit push silently...");
        await ShellCommand.run(`DATABASE_URL=postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB} drizzle-kit push`, { silent: false });
        console.log("✅ Migrations applied!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Error:", err);
        process.exit(1);
    });
