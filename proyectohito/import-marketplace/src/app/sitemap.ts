import type { MetadataRoute } from "next";
import { crearClienteServidor } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/catalogo`, changeFrequency: "hourly", priority: 0.9 },
  ];

  try {
    const supabase = await crearClienteServidor();
    const { data } = await supabase
      .from("catalog_listings")
      .select("slug, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1000);
    for (const l of data ?? []) {
      base.push({
        url: `${siteUrl}/catalogo/${l.slug}`,
        lastModified: l.updated_at,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
  } catch {
    // Sin conexión a la base: sitemap mínimo.
  }

  return base;
}
