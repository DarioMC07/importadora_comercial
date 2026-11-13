/**
 * Migra los espacios vendedor1, vendedor2, vendedor3 a:
 *   - Smaylan (cosméticos, 10 productos)
 *   - Chocolates Capri (chocolates, 10 productos)
 *   - Trencito (helados, 1 producto)
 *
 * Actualiza nombres de workspace, slugs, credenciales de usuario,
 * elimina productos/catálogos anteriores y carga los catálogos nuevos.
 *
 * NO toca el workspace 005 (AVÉLI) ni el 004 (Chaco Tools).
 *
 * Uso:
 *   node --env-file=.env.local scripts/seed-new-catalogs.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

// ── Mapeo de workspaces ─────────────────────────────────────────────────
const WORKSPACES = [
  {
    id: "11111111-0000-4000-8000-000000000001",
    userId: "22222222-0000-4000-8000-000000000001",
    newName: "Smaylan",
    newSlug: "smaylan",
    newEmail: "smaylan@demo.importhub.test",
    newPassword: "Smaylan-2026!",
    newFullName: "Smaylan Cosmética",
  },
  {
    id: "11111111-0000-4000-8000-000000000002",
    userId: "22222222-0000-4000-8000-000000000002",
    newName: "Chocolates Capri",
    newSlug: "chocolates-capri",
    newEmail: "capri@demo.importhub.test",
    newPassword: "Capri-2026!",
    newFullName: "Chocolates Capri",
  },
  {
    id: "11111111-0000-4000-8000-000000000003",
    userId: "22222222-0000-4000-8000-000000000003",
    newName: "Trencito Express",
    newSlug: "trencito",
    newEmail: "trencito@demo.importhub.test",
    newPassword: "Trencito-2026!",
    newFullName: "Trencito Express",
  },
];

// ── Catálogos ───────────────────────────────────────────────────────────

const CATALOGO_SMAYLAN = [
  {
    sku: "SM-CH001",
    name: "Crema Hidratante Facial – Aloe Vera",
    category: "Cremas Faciales",
    sale_price: 35,
    description:
      "Crema ligera para uso diario, hidrata y protege la piel. Fórmula no grasa con aloe vera natural. Ingredientes clave: Aloe vera, vitamina E, glicerina vegetal. Tamaños: 50 ml, 100 ml. Tipo de piel: Todo tipo de piel.",
  },
  {
    sku: "SM-CH002",
    name: "Crema Antiarrugas – Retinol",
    category: "Cremas Faciales",
    sale_price: 55,
    description:
      "Crema nocturna con retinol y ácido hialurónico que reduce líneas de expresión y mejora la elasticidad. Ingredientes clave: Retinol, ácido hialurónico, manteca de karité. Tamaños: 30 ml, 50 ml. Tipo de piel: Piel madura.",
  },
  {
    sku: "SM-CH003",
    name: "Crema para Manchas – Vitamina C",
    category: "Cremas Faciales",
    sale_price: 45,
    description:
      "Tratamiento despigmentante con vitamina C estabilizada. Ayuda a unificar el tono de la piel. Ingredientes clave: Vitamina C, niacinamida, extracto de regaliz. Tamaños: 30 ml. Tipo de piel: Piel con manchas o tono desigual.",
  },
  {
    sku: "SM-CH004",
    name: "Bloqueador Solar SPF 50",
    category: "Protección Solar",
    sale_price: 40,
    description:
      "Protector solar de amplio espectro, resistente al agua. Textura ligera y no comedogénica. Ingredientes clave: Óxido de zinc, titanio, vitamina E. Tamaños: 60 ml, 120 ml. Tipo de piel: Todo tipo de piel.",
  },
  {
    sku: "SM-CH005",
    name: "Sérum de Ácido Hialurónico",
    category: "Sérums",
    sale_price: 60,
    description:
      "Sérum concentrado que proporciona hidratación profunda. Ideal como base antes de la crema. Ingredientes clave: Ácido hialurónico de bajo peso molecular, agua de rosas. Tamaños: 30 ml. Tipo de piel: Todo tipo de piel.",
  },
  {
    sku: "SM-CH006",
    name: "Gel Limpiador Facial – Té Verde",
    category: "Limpieza Facial",
    sale_price: 30,
    description:
      "Limpiador facial en gel que elimina impurezas sin resecar. Ideal para pieles mixtas o grasas. Ingredientes clave: Extracto de té verde, ácido salicílico, pantenol. Tamaños: 150 ml. Tipo de piel: Piel mixta a grasa.",
  },
  {
    sku: "SM-CH007",
    name: "Tónico Facial – Agua de Rosas",
    category: "Tónicos",
    sale_price: 25,
    description:
      "Tónico facial natural que refresca, tonifica y prepara la piel para el cuidado posterior. Ingredientes clave: Agua de rosas, hamamelis, alantoína. Tamaños: 200 ml. Tipo de piel: Todo tipo de piel.",
  },
  {
    sku: "SM-CH008",
    name: "Mascarilla Facial de Arcilla",
    category: "Mascarillas",
    sale_price: 28,
    description:
      "Mascarilla purificante que limpia los poros en profundidad. Uso semanal recomendado. Ingredientes clave: Arcilla bentonita, caolín, aceite de árbol de té. Tamaños: 100 g. Tipo de piel: Piel grasa o con tendencia acneica.",
  },
  {
    sku: "SM-CH009",
    name: "Crema para Contorno de Ojos",
    category: "Cremas Faciales",
    sale_price: 50,
    description:
      "Fórmula especializada para reducir ojeras, bolsas e hinchazón. Textura ultraligera. Ingredientes clave: Cafeína, péptidos, vitamina K. Tamaños: 15 ml. Tipo de piel: Todo tipo de piel.",
  },
  {
    sku: "SM-CH010",
    name: "Aceite Facial Nutritivo – Rosa Mosqueta",
    category: "Aceites Faciales",
    sale_price: 48,
    description:
      "Aceite prensado en frío de rosa mosqueta. Regenera, nutre y mejora cicatrices. Ingredientes clave: Aceite de rosa mosqueta 100% puro, vitamina A y C naturales. Tamaños: 30 ml. Tipo de piel: Piel seca o dañada.",
  },
];

const CATALOGO_CAPRI = [
  {
    sku: "CC-B100",
    name: "Barra de Chocolate Bitter 100 g",
    category: "Barras de Chocolate",
    sale_price: 18,
    description:
      "Barra de chocolate amargo intenso, elaborada con cacao seleccionado de origen boliviano. Ideal para quienes disfrutan de un sabor profundo y sin azúcar añadida. Contenido neto: 100 g.",
  },
  {
    sku: "CC-L100",
    name: "Barra de Chocolate con Leche 100 g",
    category: "Barras de Chocolate",
    sale_price: 15,
    description:
      "Chocolate suave y cremoso con leche entera. Perfecto para disfrutar en cualquier momento del día. Contenido neto: 100 g.",
  },
  {
    sku: "CC-W100",
    name: "Barra de Chocolate Blanco 100 g",
    category: "Barras de Chocolate",
    sale_price: 16,
    description:
      "Chocolate blanco elaborado con manteca de cacao pura. Dulce, suave y con un delicado aroma a vainilla. Contenido neto: 100 g.",
  },
  {
    sku: "CC-BS12",
    name: "Bombones Surtidos – Caja de 12 unidades",
    category: "Bombones",
    sale_price: 45,
    description:
      "Selección de bombones rellenos: trufa, caramelo, avellana y frambuesa. Presentación elegante ideal para regalo. Contenido neto: 12 unidades / 180 g.",
  },
  {
    sku: "CC-T70",
    name: "Tableta de Chocolate 70% Cacao 200 g",
    category: "Tabletas Premium",
    sale_price: 35,
    description:
      "Tableta premium con 70% de cacao. Sabor intenso y equilibrado, con notas frutales. Contenido neto: 200 g.",
  },
  {
    sku: "CC-CP250",
    name: "Chocolate en Polvo para Bebida 250 g",
    category: "Bebidas",
    sale_price: 22,
    description:
      "Mezcla instantánea de cacao en polvo con azúcar. Solo añadir leche caliente para una bebida reconfortante. Contenido neto: 250 g.",
  },
  {
    sku: "CC-TN8",
    name: "Trufas de Chocolate Negro – 8 unidades",
    category: "Trufas",
    sale_price: 38,
    description:
      "Trufas artesanales de chocolate negro espolvoreadas con cacao puro. Textura cremosa e intensa. Contenido neto: 8 unidades / 120 g.",
  },
  {
    sku: "CC-LA120",
    name: "Barra de Chocolate con Almendras 120 g",
    category: "Barras de Chocolate",
    sale_price: 20,
    description:
      "Barra de chocolate con leche con trozos de almendras tostadas. Crujiente y deliciosa. Contenido neto: 120 g.",
  },
  {
    sku: "CC-Q80",
    name: "Chocolate con Quinua 80 g",
    category: "Barras de Chocolate",
    sale_price: 19,
    description:
      "Innovadora barra de chocolate con leche y quinua crocante. Fusión perfecta de tradición y sabor. Contenido neto: 80 g.",
  },
  {
    sku: "CC-PR24",
    name: "Caja Regalo Premium – 24 Bombones",
    category: "Bombones",
    sale_price: 85,
    description:
      "Exclusiva caja de 24 bombones surtidos con acabado artesanal. Incluye tarjeta personalizable. Contenido neto: 24 unidades / 360 g.",
  },
];

const CATALOGO_TRENCITO = [
  {
    sku: "TE-HEL001",
    name: "Helado Trencito Express 1 litro",
    category: "Helados",
    sale_price: 25,
    description:
      "Helado artesanal elaborado con leche fresca y frutas naturales. Sabor intenso y textura cremosa. Ingredientes: Leche entera, azúcar, frutas naturales, crema de leche. Sabores: Fresa, Chocolate, Vainilla, Maracuyá, Coco, Canela. Peso neto: 1 litro. Envase plástico con tapa hermética. Mantener a -18°C. Vida útil: 6 meses. País de origen: Bolivia.",
  },
];

// ── Ejecución ───────────────────────────────────────────────────────────

async function main() {
  console.log("═══ Migrando workspaces y catálogos ═══\n");

  for (const ws of WORKSPACES) {
    console.log(`── ${ws.newName} ──`);

    // 1. Renombrar workspace
    const { error: wsErr } = await admin
      .from("seller_workspaces")
      .update({ public_name: ws.newName, slug: ws.newSlug })
      .eq("id", ws.id);
    if (wsErr) {
      console.error(`  ✗ Renombrar workspace: ${wsErr.message}`);
      continue;
    }
    console.log(`  ✓ Workspace renombrado → ${ws.newName} (${ws.newSlug})`);

    // 2. Actualizar credenciales de usuario
    const { error: userErr } = await admin.auth.admin.updateUserById(ws.userId, {
      email: ws.newEmail,
      password: ws.newPassword,
      user_metadata: { full_name: ws.newFullName },
    });
    if (userErr) {
      console.error(`  ✗ Actualizar usuario: ${userErr.message}`);
    } else {
      console.log(`  ✓ Usuario → ${ws.newEmail} / ${ws.newPassword}`);
    }

    // 2b. Actualizar perfil en profiles
    const { error: profErr } = await admin
      .from("profiles")
      .update({ full_name: ws.newFullName })
      .eq("id", ws.userId);
    if (profErr) {
      console.error(`  ✗ Actualizar profile: ${profErr.message}`);
    }

    // 3. Borrar catálogo público existente del workspace
    const { error: catDelErr } = await admin
      .from("catalog_listings")
      .delete()
      .eq("workspace_id", ws.id);
    if (catDelErr) console.error(`  ✗ Borrar catalog_listings: ${catDelErr.message}`);
    else console.log("  ✓ Catálogo público anterior eliminado");

    // 4. Borrar inventory_movements relacionados
    const { data: prodIds } = await admin
      .from("products")
      .select("id")
      .eq("workspace_id", ws.id);
    if (prodIds && prodIds.length > 0) {
      const ids = prodIds.map((p) => p.id);
      const { error: movErr } = await admin
        .from("inventory_movements")
        .delete()
        .in("product_id", ids);
      if (movErr) console.error(`  ✗ Borrar movements: ${movErr.message}`);

      // 4b. Borrar sale_items que referencien estos products
      const { error: siErr } = await admin
        .from("sale_items")
        .delete()
        .in("product_id", ids);
      if (siErr) console.error(`  ✗ Borrar sale_items: ${siErr.message}`);

      // 4c. Borrar import_items
      const { error: iiErr } = await admin
        .from("import_items")
        .delete()
        .in("product_id", ids);
      if (iiErr) console.error(`  ✗ Borrar import_items: ${iiErr.message}`);
    }

    // 5. Borrar productos anteriores del workspace
    const { error: prodDelErr } = await admin
      .from("products")
      .delete()
      .eq("workspace_id", ws.id);
    if (prodDelErr) console.error(`  ✗ Borrar products: ${prodDelErr.message}`);
    else console.log("  ✓ Productos anteriores eliminados");

    // 6. Borrar proveedores anteriores
    // Primero borrar imports que referencien a esos proveedores
    const { error: impDelErr } = await admin
      .from("imports")
      .delete()
      .eq("workspace_id", ws.id);
    if (impDelErr) console.error(`  ✗ Borrar imports: ${impDelErr.message}`);

    const { error: supDelErr } = await admin
      .from("suppliers")
      .delete()
      .eq("workspace_id", ws.id);
    if (supDelErr) console.error(`  ✗ Borrar suppliers: ${supDelErr.message}`);

    // 7. Borrar clientes anteriores
    // Primero borrar sales que referencien a esos clientes
    const { error: saleDelErr } = await admin
      .from("sales")
      .delete()
      .eq("workspace_id", ws.id);
    if (saleDelErr) console.error(`  ✗ Borrar sales: ${saleDelErr.message}`);

    const { error: custDelErr } = await admin
      .from("customers")
      .delete()
      .eq("workspace_id", ws.id);
    if (custDelErr) console.error(`  ✗ Borrar customers: ${custDelErr.message}`);

    // 8. Insertar productos nuevos del catálogo
    const catalogo =
      ws.newSlug === "smaylan"
        ? CATALOGO_SMAYLAN
        : ws.newSlug === "chocolates-capri"
          ? CATALOGO_CAPRI
          : CATALOGO_TRENCITO;

    let insertados = 0;
    for (const item of catalogo) {
      const payload = {
        workspace_id: ws.id,
        sku: item.sku,
        name: item.name,
        category: item.category,
        sale_price: item.sale_price,
        description: item.description,
        stock: 0,
        min_stock: 0,
        base_cost: 0,
        origin_country: "Bolivia",
        origin_public: true,
        published: true,
        active: true,
      };

      const { data: inserted, error: insErr } = await admin
        .from("products")
        .upsert(payload, { onConflict: "workspace_id,sku" })
        .select("id, name, sale_price")
        .single();

      if (insErr) {
        console.error(`  ✗ ${item.sku}: ${insErr.message}`);
      } else {
        insertados++;
        console.log(`  ✓ ${item.sku} – ${item.name} (${item.sale_price} Bs)`);

        // 9. Publicar en catalog_listings
        const slug = makeSlug(item.name);
        const { error: listErr } = await admin.from("catalog_listings").upsert(
          {
            workspace_id: ws.id,
            product_id: inserted.id,
            slug,
            name: item.name,
            description: item.description,
            category: item.category,
            price: item.sale_price,
            availability: "DISPONIBLE",
            origin_country: "Bolivia",
            seller_public_name: ws.newName,
            seller_slug: ws.newSlug,
            images: "[]",
          },
          { onConflict: "product_id" },
        );
        if (listErr) console.error(`    ✗ Publicar en catálogo: ${listErr.message}`);
      }
    }
    console.log(`  → ${insertados}/${catalogo.length} productos insertados\n`);
  }

  console.log("═══ ¡Migración completa! ═══\n");
  console.log("Credenciales actualizadas:");
  console.log("┌─────────────────────┬─────────────────────────────────────┬────────────────┐");
  console.log("│ Espacio             │ Correo                              │ Contraseña     │");
  console.log("├─────────────────────┼─────────────────────────────────────┼────────────────┤");
  for (const ws of WORKSPACES) {
    console.log(
      `│ ${ws.newName.padEnd(19)} │ ${ws.newEmail.padEnd(35)} │ ${ws.newPassword.padEnd(14)} │`,
    );
  }
  console.log("│ AVÉLI (sin cambio)  │ aveli@demo.importhub.test           │ Aveli-2026!    │");
  console.log("└─────────────────────┴─────────────────────────────────────┴────────────────┘");
}

function makeSlug(name) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const hex = Math.random().toString(16).slice(2, 8);
  return `${base}-${hex}`;
}

main();

