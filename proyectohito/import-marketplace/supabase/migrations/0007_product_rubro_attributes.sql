-- Rubro y atributos por rubro del producto.
-- products.attributes guarda SOLO datos comerciales públicos (talla, sabor,
-- marca…). Nunca costos, stock ni proveedor: se copia tal cual al catálogo.

alter table public.products
  add column if not exists rubro text not null default 'GENERAL',
  add column if not exists attributes jsonb not null default '{}'::jsonb;

alter table public.products
  add constraint products_rubro_check
    check (rubro in ('GENERAL', 'MODA', 'ALIMENTOS', 'COSMETICOS', 'TECNOLOGIA')),
  add constraint products_attributes_check
    check (jsonb_typeof(attributes) = 'object' and char_length(attributes::text) <= 6000);

alter table public.catalog_listings
  add column if not exists rubro text not null default 'GENERAL',
  add column if not exists attributes jsonb not null default '{}'::jsonb;

alter table public.catalog_listings
  add constraint catalog_listings_rubro_check
    check (rubro in ('GENERAL', 'MODA', 'ALIMENTOS', 'COSMETICOS', 'TECNOLOGIA')),
  add constraint catalog_listings_attributes_check
    check (jsonb_typeof(attributes) = 'object' and char_length(attributes::text) <= 6000);

-- Datos existentes: rubro según la tienda.
update public.products p
set rubro = m.rubro
from public.seller_workspaces w
join (values
  ('andes-import', 'TECNOLOGIA'),
  ('smaylan', 'COSMETICOS'),
  ('chocolates-capri', 'ALIMENTOS'),
  ('trencito', 'ALIMENTOS')
) as m(slug, rubro) on m.slug = w.slug
where w.id = p.workspace_id
  and p.rubro = 'GENERAL';

-- Datos existentes: un producto con tallas es de moda. colors no se copia
-- porque guarda códigos hexadecimales, no nombres legibles.
update public.products
set rubro = 'MODA',
    attributes = jsonb_build_object('talla', btrim(sizes))
where btrim(sizes) <> ''
  and rubro = 'GENERAL';

update public.catalog_listings cl
set rubro = p.rubro,
    attributes = p.attributes
from public.products p
where p.id = cl.product_id;

-- publish_product: igual que en 0002_functions.sql, más rubro y attributes.
create or replace function public.publish_product(p_product_id uuid)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  p public.products%rowtype;
  w public.seller_workspaces%rowtype;
  v_listing_id uuid;
  v_images jsonb;
  v_dims jsonb;
begin
  select * into p from public.products where id = p_product_id;
  if not found then raise exception 'PRODUCTO_NO_ENCONTRADO'; end if;
  if not public.is_member_of(p.workspace_id) then raise exception 'NO_AUTORIZADO'; end if;
  if not p.active then raise exception 'PRODUCTO_INACTIVO'; end if;
  if p.sale_price <= 0 then raise exception 'PRECIO_INVALIDO'; end if;

  select * into w from public.seller_workspaces where id = p.workspace_id;

  select coalesce(jsonb_agg(jsonb_build_object('url', pi.public_url, 'alt', p.name) order by pi.position), '[]'::jsonb)
    into v_images
  from public.product_images pi
  where pi.product_id = p.id;

  v_dims := jsonb_strip_nulls(jsonb_build_object(
    'largo', p.dim_length, 'ancho', p.dim_width, 'alto', p.dim_height,
    'unidad', p.dim_unit, 'peso_kg', p.weight_kg
  ));
  if v_dims = '{}'::jsonb then v_dims := null; end if;

  insert into public.catalog_listings as cl (
    workspace_id, product_id, slug, name, description, category, price,
    availability, origin_country, dims_public, seller_public_name, seller_slug, images,
    rubro, attributes
  ) values (
    p.workspace_id, p.id,
    coalesce((select slug from public.catalog_listings where product_id = p.id), public.make_listing_slug(p.name)),
    p.name, p.description, p.category, p.sale_price,
    public.availability_of(p.stock, p.min_stock),
    case when p.origin_public then p.origin_country else null end,
    v_dims, w.public_name, w.slug, v_images,
    p.rubro, p.attributes
  )
  on conflict (product_id) do update set
    name = excluded.name,
    description = excluded.description,
    category = excluded.category,
    price = excluded.price,
    availability = excluded.availability,
    origin_country = excluded.origin_country,
    dims_public = excluded.dims_public,
    images = excluded.images,
    rubro = excluded.rubro,
    attributes = excluded.attributes,
    updated_at = now()
  returning cl.id into v_listing_id;

  update public.products set published = true where id = p.id;

  insert into public.audit_logs (workspace_id, user_id, action, entity, entity_id, metadata)
  values (p.workspace_id, auth.uid(), 'PUBLICAR_PRODUCTO', 'product', p.id,
          jsonb_build_object('listing_id', v_listing_id));

  return v_listing_id;
end $$;

-- sync_catalog_listing: igual que en 0002_functions.sql, más rubro y attributes.
create or replace function public.sync_catalog_listing()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.published then
    update public.catalog_listings set
      name = new.name,
      description = new.description,
      category = new.category,
      price = new.sale_price,
      availability = public.availability_of(new.stock, new.min_stock),
      origin_country = case when new.origin_public then new.origin_country else null end,
      rubro = new.rubro,
      attributes = new.attributes,
      updated_at = now()
    where product_id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists trg_sync_catalog on public.products;
create trigger trg_sync_catalog
after update of name, description, category, sale_price, stock, min_stock, origin_country, origin_public, published, rubro, attributes
on public.products
for each row execute function public.sync_catalog_listing();
