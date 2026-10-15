/**
 * Pruebas de políticas RLS (permitido/denegado) contra un Supabase real.
 *
 * Requiere variables en .env.test.local (o entorno):
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 * y el seed ejecutado (usuarios vendedor1/2 @demo.importhub.test, Demo-2026!).
 *
 * Ejecutar: npm run test:rls
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

let pasadas = 0;
let falladas = 0;

function prueba(nombre: string, condicion: boolean, detalle = "") {
  if (condicion) {
    pasadas++;
    console.log(`  ✓ ${nombre}`);
  } else {
    falladas++;
    console.error(`  ✗ ${nombre} ${detalle}`);
  }
}

async function login(email: string) {
  const cliente = createClient(url!, anonKey!, { auth: { persistSession: false } });
  const { error } = await cliente.auth.signInWithPassword({ email, password: "Demo-2026!" });
  if (error) throw new Error(`No se pudo iniciar sesión como ${email}: ${error.message}`);
  return cliente;
}

// IDs del seed: vendedor 1 (Andes Import) y vendedor 2 (Paceña Home).
const PRODUCTO_V2 = "33333333-0000-4000-8000-000000000006"; // Lámpara (vendedor 2)
const CLIENTE_V2 = "66666666-0000-4000-8000-000000000004";
const VENTA_V2 = "88888888-0000-4000-8000-000000000011";
const IMPORT_V2 = "55555555-0000-4000-8000-000000000003";
const WS_V2 = "11111111-0000-4000-8000-000000000002";

async function main() {
  console.log("\nPruebas RLS — rol anónimo (visitante)");
  const anon = createClient(url!, anonKey!, { auth: { persistSession: false } });

  const { data: catalogo } = await anon.from("catalog_listings").select("*").limit(5);
  prueba("anónimo PUEDE leer el catálogo público", (catalogo?.length ?? 0) > 0);

  const columnas = Object.keys(catalogo?.[0] ?? {});
  const prohibidas = ["base_cost", "stock", "min_stock", "freight_alloc", "duty_alloc", "supplier_id", "landed_unit_cost"];
  prueba(
    "el catálogo NO expone columnas privadas",
    prohibidas.every((c) => !columnas.includes(c)),
    `encontradas: ${columnas.filter((c) => prohibidas.includes(c)).join(", ")}`,
  );

  for (const tabla of ["products", "suppliers", "imports", "customers", "sales", "inventory_movements", "audit_logs"]) {
    const { data, error } = await anon.from(tabla).select("*").limit(1);
    prueba(
      `anónimo NO puede leer ${tabla}`,
      (data ?? []).length === 0 || !!error,
    );
  }

  const { error: insCat } = await anon
    .from("catalog_listings")
    .insert({ workspace_id: WS_V2, product_id: PRODUCTO_V2, slug: "x-aaaaaa", name: "x", category: "x", price: 1, availability: "DISPONIBLE", seller_public_name: "x", seller_slug: "x" });
  prueba("anónimo NO puede insertar en catalog_listings", !!insCat);

  console.log("\nPruebas RLS — vendedor 1 autenticado");
  const v1 = await login("vendedor1@demo.importhub.test");

  const { data: misProductos } = await v1.from("products").select("id, workspace_id");
  prueba(
    "vendedor 1 lee SOLO sus productos",
    (misProductos?.length ?? 0) > 0 && misProductos!.every((p) => p.workspace_id !== WS_V2),
  );

  const { data: prodAjeno } = await v1.from("products").select("*").eq("id", PRODUCTO_V2);
  prueba("vendedor 1 NO puede leer producto del vendedor 2 (IDOR por UUID)", (prodAjeno ?? []).length === 0);

  const { data: cliAjeno } = await v1.from("customers").select("*").eq("id", CLIENTE_V2);
  prueba("vendedor 1 NO puede leer cliente del vendedor 2", (cliAjeno ?? []).length === 0);

  const { data: ventaAjena } = await v1.from("sales").select("*").eq("id", VENTA_V2);
  prueba("vendedor 1 NO puede leer venta del vendedor 2", (ventaAjena ?? []).length === 0);

  const { error: updAjeno } = await v1
    .from("products")
    .update({ name: "hackeado" })
    .eq("id", PRODUCTO_V2);
  // RLS: la fila no es visible → 0 filas afectadas (sin error) o error.
  const { data: verifica } = await login("vendedor2@demo.importhub.test")
    .then((v2) => v2.from("products").select("name").eq("id", PRODUCTO_V2).single());
  prueba(
    "vendedor 1 NO puede modificar producto del vendedor 2",
    verifica?.name !== "hackeado",
    updAjeno ? `(error: ${updAjeno.message})` : "",
  );

  const { error: insAjeno } = await v1.from("customers").insert({
    workspace_id: WS_V2, code: "HACK-1", name: "Intruso",
  });
  prueba("vendedor 1 NO puede insertar cliente en espacio ajeno", !!insAjeno);

  const { error: delAjeno } = await v1.from("imports").delete().eq("id", IMPORT_V2);
  const v2b = await login("vendedor2@demo.importhub.test");
  const { data: impSigue } = await v2b.from("imports").select("id").eq("id", IMPORT_V2);
  prueba("vendedor 1 NO puede eliminar importación del vendedor 2", (impSigue ?? []).length === 1 || !!delAjeno);

  const { data: movs } = await v1.from("inventory_movements").select("id").limit(1);
  prueba("vendedor 1 SÍ lee su historial de movimientos", (movs?.length ?? 0) > 0);

  const { error: insMov } = await v1.from("inventory_movements").insert({
    workspace_id: "11111111-0000-4000-8000-000000000001",
    product_id: "33333333-0000-4000-8000-000000000001",
    type: "AJUSTE_POSITIVO", quantity: 100,
  });
  prueba("movimientos NO se insertan directo (solo por funciones)", !!insMov);

  console.log(`\nResultado: ${pasadas} pasadas, ${falladas} falladas.`);
  process.exit(falladas > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Error ejecutando pruebas RLS:", e);
  process.exit(1);
});
