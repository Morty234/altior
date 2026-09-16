// src/lib/db.ts — conexão com Neon Postgres
// Para iniciante: este arquivo cria uma função `sql` que você usa para fazer queries.
// Ele lê DATABASE_URL do seu .env.local (ex: postgresql://user:pass@host/neondb?sslmode=require)
// No Vercel, a mesma variável vai em Settings > Environment Variables.

import { neon } from "@neondatabase/serverless";

// Neon usa fetch por baixo, funciona tanto local quanto na Vercel
export const sql = neon(process.env.DATABASE_URL!);

// Helper: verifica se o banco está configurado
export function assertDb() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder")) {
    throw new Error(
      "DATABASE_URL não configurada. Crie um banco em https://console.neon.tech > Create Project > copie a Connection String e cole no seu .env.local"
    );
  }
}
