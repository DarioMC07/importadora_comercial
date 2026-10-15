/**
 * Seed de usuarios para un proyecto Supabase REMOTO (o local sin `db reset`).
 * Usa la service_role key SOLO del lado servidor; jamás la envíes al cliente.
 *
 * Uso:
 *   1. Aplica las migraciones:  npx supabase db push  (o psql < migrations)
 *   2. Ejecuta el seed de datos: psql "$DATABASE_URL" -f supabase/seed.sql
 *      (el seed.sql también inserta usuarios si corres con permisos de owner;
 *       este script es la alternativa vía Admin API)
 *   3. SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const USUARIOS = [
  { id: "22222222-0000-4000-8000-000000000001", email: "vendedor1@demo.importhub.test", nombre: "Mariana Quispe" },
  { id: "22222222-0000-4000-8000-000000000002", email: "vendedor2@demo.importhub.test", nombre: "Jorge Mamani" },
  { id: "22222222-0000-4000-8000-000000000003", email: "vendedor3@demo.importhub.test", nombre: "Lucía Fernández" },
  { id: "22222222-0000-4000-8000-000000000004", email: "vendedor4@demo.importhub.test", nombre: "Pedro Rojas" },
  { id: "22222222-0000-4000-8000-000000000005", email: "aveli@demo.importhub.test", nombre: "AVÉLI", password: "Aveli-2026!" },
];

const PASSWORD_DEMO = "Demo-2026!";

async function main() {
  for (const u of USUARIOS) {
    const { error } = await admin.auth.admin.createUser({
      id: u.id,
      email: u.email,
      password: u.password || PASSWORD_DEMO,
      email_confirm: true,
      user_metadata: { full_name: u.nombre },
    });
    if (error && !error.message.includes("already")) {
      console.error(`✗ ${u.email}: ${error.message}`);
    } else {
      console.log(`✓ ${u.email}`);
    }
  }
  console.log("\nListo. Ahora ejecuta el seed de datos:");
  console.log('  psql "$DATABASE_URL" -f supabase/seed.sql');
}

main();
