import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Faltan variables de entorno");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

async function run() {
  // 1. Obtener workspace de AVÉLI
  const { data: ws, error: wsErr } = await admin
    .from("seller_workspaces")
    .select("id, public_name")
    .eq("slug", "aveli")
    .single();

  if (wsErr || !ws) {
    console.error("No se encontró el workspace de AVÉLI:", wsErr);
    process.exit(1);
  }

  console.log(`Workspace encontrado: ${ws.public_name} (${ws.id})`);

  // 2. Extraer los productos del catálogo desde 0006_aveli_catalog.sql
  const migrationPath = path.resolve("supabase/migrations/0006_aveli_catalog.sql");
  const content = fs.readFileSync(migrationPath, "utf-8");
  const match = content.match(/\$catalog\$(\[.*?\])\$catalog\$/s);

  if (!match) {
    console.error("No se pudo extraer el JSON del catálogo");
    process.exit(1);
  }

  const catalogItems = JSON.parse(match[1]);
  console.log(`Catálogo extraído con ${catalogItems.length} prendas.`);

  // 3. Insertar cada producto para el workspace de AVÉLI
  let insertados = 0;
  for (const item of catalogItems) {
    const productPayload = {
      workspace_id: ws.id,
      sku: item.sku,
      name: item.name,
      category: item.category,
      sale_price: item.sale_price,
      image_url: item.image_url,
      sizes: item.sizes,
      colors: item.colors,
      catalog_availability: item.catalog_availability,
      description: item.description,
      stock: 0,
      min_stock: 0,
      base_cost: 0,
      origin_country: "China",
      origin_public: true,
      published: true,
      active: true,
    };

    const { error } = await admin
      .from("products")
      .upsert(productPayload, { onConflict: "workspace_id,sku" });

    if (error) {
      console.error(`Error insertando ${item.sku}:`, error.message);
    } else {
      insertados++;
      console.log(`✓ ${item.sku} - ${item.name}`);
    }
  }

  console.log(`\n¡Listo! ${insertados}/${catalogItems.length} productos sincronizados en Supabase.`);
}

run();
