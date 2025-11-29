import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { loadEnv } from "../utils/loadEnv";

loadEnv();

// ENV obrigatórios
const PG_HOST = process.env.POSTGRES_HOST;
const PG_PORT = process.env.POSTGRES_PORT ?? "5432";
const PG_USER = process.env.POSTGRES_USER;
const PG_PASSWORD = process.env.POSTGRES_PASSWORD;
const PG_DATABASE = process.env.POSTGRES_DB;


if (!PG_HOST || !PG_USER || !PG_DATABASE || !PG_PASSWORD) {
    console.error("❌ Variáveis de ambiente faltando!");
    process.exit(1);
}

// ----------------------
// 📅 Datas
// ----------------------
const now = new Date();
const folderDate = now.toISOString().slice(0, 10); // YYYY-MM-DD
const dateTime = now
    .toISOString()
    .replace("T", "_")
    .replace(/:/g, "_")
    .replace(/\..+/, ""); // YYYY-MM-DD_HH_mm_ss

// ----------------------
// 📂 Caminhos
// ----------------------
const tmpFile = `/tmp/BKP_${dateTime}.sql`;

const backupDir = path.join("backups", folderDate);

// cria pasta
fs.mkdirSync(backupDir, { recursive: true });

// string de conexão
const connString = `postgresql://${PG_USER}@${PG_HOST}:${PG_PORT}/${PG_DATABASE}`;

// ----------------------
// 🧨 Executa pg_dump no /tmp
// ----------------------
const cmd = `PGPASSWORD="${PG_PASSWORD}" pg_dump --format=plain --no-owner --no-privileges --inserts "${connString}" > "${tmpFile}"`;

console.log("📦 Exportando temporariamente para:", tmpFile);

exec(cmd, (error) => {
    if (error) {
        console.error("❌ Erro ao exportar:", error);
        process.exit(1);
    }

    console.log("📥 Lendo arquivo temporário...");

    const content = fs.readFileSync(tmpFile, "utf8");

    // ------------------------------------
    // 🔍 PROCURAR O MARCADOR \restrict
    // ------------------------------------
    // Exemplo esperado no SQL:
    //   -- \restrict=instance_001
    //
    // Resultado final será:  ..._instance_001.sql
    //

    let restrict = "no_restrict";

    // Captura: \restrict <valor>
    const match = content.match(/\\restrict\s+([A-Za-z0-9_\-]+)/);

    if (match && match[1]) {
        restrict = match[1];
    }

    console.log("🔎 Restrict encontrado:", restrict);

    // Caminho final
    const finalFile = path.join(
        backupDir,
        `BKP_${dateTime}_${restrict}.sql`.toUpperCase()
    );

    // grava o arquivo final
    fs.writeFileSync(finalFile, content);

    console.log("✅ Backup final criado:");
    console.log("➡", finalFile);

    // limpa o arquivo temporário
    fs.unlinkSync(tmpFile);
});
