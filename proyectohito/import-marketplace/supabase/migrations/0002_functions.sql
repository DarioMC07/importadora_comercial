-- ============================================================================
-- 0002_functions.sql — Funciones de negocio atómicas e idempotentes
-- Todas las mutaciones críticas ocurren dentro de funciones (transacción
-- implícita de PostgreSQL) para evitar condiciones de carrera.
-- ============================================================================

-- Costo unitario puesto en almacén: columna calculada, jamás float.
alter table public.products
  add column landed_unit_cost numeric(14,2)
  generated always as (base_cost + freight_alloc + duty_alloc + other_alloc) stored;

comment on column public.products.landed_unit_cost is
  'Costo puesto en almacén = costo base + transporte + aranceles + otros asignados.';

-- ---------------------------------------------------------------------------
-- Helpers de autorización (security definer para evitar recursión en RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_member_of(ws uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws and user_id = auth.uid()
  );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where user_id = auth.uid() and role = 'platform_admin'
  );
$$;

-- El espacio del usuario autenticado (un vendedor pertenece a un solo espacio).
create or replace function public.my_workspace_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select workspace_id from public.workspace_members
  where user_id = auth.uid()
  order by created_at asc
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Utilidad: slug público no secuencial
-- ---------------------------------------------------------------------------
create or replace function public.make_listing_slug(p_name text)
returns text
language plpgsql
as $$
declare
  base text;
begin
  base := lower(p_name);
  base := translate(base, 'áéíóúüñ', 'aeiouun');
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := trim(both '-' from base);
  base := left(base, 60);
  if base = '' then base := 'producto'; end if;
  return base || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
end $$;

create or replace function public.make_public_code()
returns text
language sql volatile
as $$
  select upper(string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random()*32)::int, 1), ''))
  from generate_series(1, 8)
$$;

-- Código con guion: XXXX-XXXX
create or replace function public.make_request_code()
returns text
language sql volatile
as $$
  select substr(public.make_public_code(), 1, 4) || '-' || substr(public.make_public_code(), 5, 4)
$$;

-- ---------------------------------------------------------------------------
-- Estado de disponibilidad pública (sin exponer stock exacto)
-- ---------------------------------------------------------------------------
create or replace function public.availability_of(p_stock int, p_min_stock int)
returns public.availability_status
language sql immutable
as $$
  select case
    when p_stock <= 0 then 'AGOTADO'::public.availability_status
    when p_stock <= greatest(p_min_stock, 3) then 'POCAS_UNIDADES'::public.availability_status
    else 'DISPONIBLE'::public.availability_status
  end
$$;

-- ---------------------------------------------------------------------------
-- Publicar / despublicar: copia SOLO campos autorizados a catalog_listings
-- ---------------------------------------------------------------------------
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
    availability, origin_country, dims_public, seller_public_name, seller_slug, images
  ) values (
    p.workspace_id, p.id,
    coalesce((select slug from public.catalog_listings where product_id = p.id), public.make_listing_slug(p.name)),
    p.name, p.description, p.category, p.sale_price,
    public.availability_of(p.stock, p.min_stock),
    case when p.origin_public then p.origin_country else null end,
    v_dims, w.public_name, w.slug, v_images
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
    updated_at = now()
  returning cl.id into v_listing_id;

  update public.products set published = true where id = p.id;

  insert into public.audit_logs (workspace_id, user_id, action, entity, entity_id, metadata)
  values (p.workspace_id, auth.uid(), 'PUBLICAR_PRODUCTO', 'product', p.id,
          jsonb_build_object('listing_id', v_listing_id));

  return v_listing_id;
end $$;

create or replace function public.unpublish_product(p_product_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  p public.products%rowtype;
begin
  select * into p from public.products where id = p_product_id;
  if not found then raise exception 'PRODUCTO_NO_ENCONTRADO'; end if;
  if not public.is_member_of(p.workspace_id) then raise exception 'NO_AUTORIZADO'; end if;

  delete from public.catalog_listings where product_id = p.id;
  update public.products set published = false where id = p.id;

  insert into public.audit_logs (workspace_id, user_id, action, entity, entity_id)
  values (p.workspace_id, auth.uid(), 'DESPUBLICAR_PRODUCTO', 'product', p.id);
end $$;

-- Mantiene el catálogo sincronizado cuando cambian datos públicos o el stock
-- de un producto ya publicado. Jamás copia columnas privadas.
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
      updated_at = now()
    where product_id = new.id;
  end if;
  return new;
end $$;

create trigger trg_sync_catalog
after update of name, description, category, sale_price, stock, min_stock, origin_country, origin_public, published
on public.products
for each row execute function public.sync_catalog_listing();
