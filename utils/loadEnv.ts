import fs from "fs";
import path from "path";
import dotenv from "dotenv";

export function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  const examplePath = path.resolve(process.cwd(), ".env.example");

  if (fs.existsSync(envPath)) {
    console.log("🔄 Loading .env");
    dotenv.config({ path: envPath });
  } else if (fs.existsSync(examplePath)) {
    console.warn("⚠️  .env not found. Loading fallback: .env.example");
    dotenv.config({ path: examplePath });
  } else {
    console.error("❌ No .env or .env.example found!");
    process.exit(1);
  }
}
