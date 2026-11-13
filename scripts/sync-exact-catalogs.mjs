import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Faltan variables de entorno");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

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

async function syncExactCatalogs() {
  const wsSmaylan = "11111111-0000-4000-8000-000000000001";
  const wsCapri = "11111111-0000-4000-8000-000000000002";
  const wsTrencito = "11111111-0000-4000-8000-000000000003";

  // Limpiar productos existentes de estos 3 espacios
  for (const wsId of [wsSmaylan, wsCapri, wsTrencito]) {
    await admin.from("catalog_listings").delete().eq("workspace_id", wsId);

    const { data: prods } = await admin.from("products").select("id").eq("workspace_id", wsId);
    if (prods && prods.length > 0) {
      const ids = prods.map((p) => p.id);
      await admin.from("purchase_request_items").delete().in("product_id", ids);
      await admin.from("inventory_movements").delete().in("product_id", ids);
      await admin.from("sale_items").delete().in("product_id", ids);
      await admin.from("import_items").delete().in("product_id", ids);
    }
    await admin.from("products").delete().eq("workspace_id", wsId);
  }

  // 1. SMAYLAN (5 productos reales del documento)
  const smaylanProds = [
    {
      sku: "SM-001",
      name: "Máscara de Pestañas Big Eyes Negra Waterproof – Dolce Bella",
      category: "Maquillaje",
      sale_price: 45.5,
      image_url: "/smaylan/SM-01.jpg",
      description:
        "Negro intenso de larga duración que levanta las pestañas desde la raíz para un efecto de ojo de muñeca sin grumos.",
      catalog_availability: "Disponible",
    },
    {
      sku: "SM-002",
      name: "Caja de 5 Mascarillas Hidrogel con Centella Asiática – Ruby Skin",
      category: "Cosmético facial",
      sale_price: 58.5,
      image_url: "/smaylan/SM-02.jpg",
      description:
        "Mascarillas de hidrogel premium que se adhieren como una segunda piel, ricas en centella asiática para calmar, reparar y regenerar las pieles sensibles o cansadas.",
      catalog_availability: "Disponible",
    },
    {
      sku: "SM-003",
      name: "Bases Matte Liquid Dolce Bella – Mediana a Alta Cobertura",
      category: "Maquillaje",
      sale_price: 78.0,
      image_url: "/smaylan/SM-03.jpg",
      description:
        "Base líquida de alta cobertura y acabado mate aterciopelado, ideal para controlar la oleosidad con una textura ligera y cómoda.",
      catalog_availability: "Disponible",
    },
    {
      sku: "SM-004",
      name: "Pack 6 Lipgloss – Dolce Bella",
      category: "Maquillaje",
      sale_price: 39.0,
      image_url: "/smaylan/SM-04.jpg",
      description:
        "Textura suave, ultra hidratante y no pegajosa, ideal para combinar looks diarios o llevar en el bolso.",
      catalog_availability: "Disponible",
    },
    {
      sku: "SM-005",
      name: "Pestañas Tipo Cortina – Marca Pfiffery",
      category: "Maquillaje",
      sale_price: 26.0,
      image_url: "/smaylan/SM-05.jpg",
      description:
        "Tira completa de pestañas postizas de alta calidad, perfectas para un acabado dramático, glamuroso y perfectamente tupido.",
      catalog_availability: "Disponible",
    },
  ];

  for (const item of smaylanProds) {
    const { data: p, error: pErr } = await admin
      .from("products")
      .insert({
        workspace_id: wsSmaylan,
        sku: item.sku,
        name: item.name,
        category: item.category,
        sale_price: item.sale_price,
        image_url: item.image_url,
        description: item.description,
        catalog_availability: item.catalog_availability,
        stock: 15,
        min_stock: 3,
        published: true,
        active: true,
        origin_country: "Bolivia",
        origin_public: true,
      })
      .select()
      .single();

    if (pErr) console.error("Error p smaylan:", pErr);
    else {
      await admin.from("catalog_listings").insert({
        workspace_id: wsSmaylan,
        product_id: p.id,
        slug: makeSlug(p.name),
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.sale_price,
        availability: "DISPONIBLE",
        origin_country: "Bolivia",
        seller_public_name: "Smaylan",
        seller_slug: "smaylan",
        images: [{ url: item.image_url, alt: p.name }],
      });
    }
  }
  console.log("✓ Smaylan sincronizado (5 productos con imágenes)");

  // 2. CHOCOLATES CAPRI (EXACTAMENTE los 2 productos del documento)
  const capriProds = [
    {
      sku: "CAPRI-001",
      name: "Capri Frutilla – 30 g",
      category: "Chocolates",
      sale_price: 7.0,
      image_url: "/capri/CAPRI-01.jpg",
      origin_country: "Chile",
      description:
        "Deliciosa barra de chocolate Capri con relleno cremoso sabor frutilla. Combina el sabor del chocolate con un toque dulce y frutal. Su presentación de 30 gramos es ideal para disfrutar en cualquier momento.",
      catalog_availability: "Disponible",
    },
    {
      sku: "CAPRI-002",
      name: "Capri Almendra – 30 g",
      category: "Chocolates",
      sale_price: 7.0,
      image_url: "/capri/CAPRI-02.jpg",
      origin_country: "Chile",
      description:
        "Barra de chocolate Capri con relleno sabor almendra, que ofrece una combinación de sabores ideal para quienes disfrutan del chocolate y los frutos secos. Su tamaño de 30 gramos es práctico para llevar y disfrutar como un pequeño antojo.",
      catalog_availability: "Disponible",
    },
  ];

  for (const item of capriProds) {
    const { data: p, error: pErr } = await admin
      .from("products")
      .insert({
        workspace_id: wsCapri,
        sku: item.sku,
        name: item.name,
        category: item.category,
        sale_price: item.sale_price,
        image_url: item.image_url,
        origin_country: item.origin_country,
        description: item.description,
        catalog_availability: item.catalog_availability,
        stock: 50,
        min_stock: 5,
        published: true,
        active: true,
        origin_public: true,
      })
      .select()
      .single();

    if (pErr) console.error("Error p capri:", pErr);
    else {
      await admin.from("catalog_listings").insert({
        workspace_id: wsCapri,
        product_id: p.id,
        slug: makeSlug(p.name),
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.sale_price,
        availability: "DISPONIBLE",
        origin_country: item.origin_country,
        seller_public_name: "Chocolates Capri",
        seller_slug: "chocolates-capri",
        images: [{ url: item.image_url, alt: p.name }],
      });
    }
  }
  console.log("✓ Chocolates Capri sincronizado (2 productos con imágenes)");

  // 3. TRENCITO (EXACTAMENTE el 1 producto del documento)
  const trencitoProds = [
    {
      sku: "TRENCITO-001",
      name: "Chocolate Trencito – 24 g",
      category: "Snacks y chocolates",
      sale_price: 6.0,
      image_url: "/trencito/TRENCITO-01.png",
      origin_country: "Chile",
      description:
        "Barra de chocolate de leche Trencito, de 24 g, con un sabor dulce y textura suave, ideal para disfrutar como snack.",
      catalog_availability: "Disponible",
    },
  ];

  for (const item of trencitoProds) {
    const { data: p, error: pErr } = await admin
      .from("products")
      .insert({
        workspace_id: wsTrencito,
        sku: item.sku,
        name: item.name,
        category: item.category,
        sale_price: item.sale_price,
        image_url: item.image_url,
        origin_country: item.origin_country,
        description: item.description,
        catalog_availability: item.catalog_availability,
        stock: 30,
        min_stock: 5,
        published: true,
        active: true,
        origin_public: true,
      })
      .select()
      .single();

    if (pErr) console.error("Error p trencito:", pErr);
    else {
      await admin.from("catalog_listings").insert({
        workspace_id: wsTrencito,
        product_id: p.id,
        slug: makeSlug(p.name),
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.sale_price,
        availability: "DISPONIBLE",
        origin_country: item.origin_country,
        seller_public_name: "Trencito Express",
        seller_slug: "trencito",
        images: [{ url: item.image_url, alt: p.name }],
      });
    }
  }
  console.log("✓ Trencito Express sincronizado (1 producto con imagen)");
}

syncExactCatalogs();

