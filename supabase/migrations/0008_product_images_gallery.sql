-- Galería de imágenes de producto.
-- La portada es la imagen con position = 0. Toda escritura de la galería
-- pasa por set_product_images.

-- Una imagen solo puede pertenecer a un producto de su mismo espacio.
alter table public.products
  add constraint products_id_workspace_key unique (id, workspace_id);

alter table public.product_images
  add constraint product_images_product_workspace_fk
    foreign key (product_id, workspace_id)
    references public.products (id, workspace_id) on delete cascade,
  add constraint product_images_position_key unique (product_id, position),
  add constraint product_images_path_key unique (product_id, storage_path);

-- Reemplaza la galería completa de un producto, en el orden del arreglo.
-- p_images: [{"storage_path": text, "public_url": text}, …], máximo 8.
-- Devuelve las rutas de bucket que salieron de la galería, para borrarlas.
create or replace function public.set_product_images(p_product_id uuid, p_images jsonb)
returns text[]
language plpgsql security definer
set search_path = public
as $$
declare
  p public.products%rowtype;
  v_item jsonb;
  v_path text;
  v_url text;
  v_prefix text;
  v_suffix text;
  v_pos int := 0;
  v_removed text[];
  v_images jsonb;
begin
  select * into p from public.products where id = p_product_id for update;
  if not found then raise exception 'PRODUCTO_NO_ENCONTRADO'; end if;
  if not public.is_member_of(p.workspace_id) then raise exception 'NO_AUTORIZADO'; end if;
  if p_images is null or jsonb_typeof(p_images) <> 'array' then raise exception 'IMAGENES_INVALIDAS'; end if;
  if jsonb_array_length(p_images) > 8 then raise exception 'DEMASIADAS_IMAGENES'; end if;

  v_prefix := p.workspace_id::text || '/';

  select coalesce(array_agg(pi.storage_path), '{}'::text[])
    into v_removed
  from public.product_images pi
  where pi.product_id = p.id
    and left(pi.storage_path, char_length(v_prefix)) = v_prefix
    and not exists (
      select 1 from jsonb_array_elements(p_images) e
      where e ->> 'storage_path' = pi.storage_path
    );

  delete from public.product_images where product_id = p.id;

  for v_item in select * from jsonb_array_elements(p_images) loop
    v_path := v_item ->> 'storage_path';
    v_url := v_item ->> 'public_url';
    if v_path is null or v_url is null
       or char_length(v_path) not between 1 and 500
       or char_length(v_url) not between 1 and 1000 then
      raise exception 'IMAGENES_INVALIDAS';
    end if;
    if left(v_path, char_length(v_prefix)) = v_prefix then
      -- Imagen de bucket: la URL pública debe terminar en su ruta.
      v_suffix := '/storage/v1/object/public/product-images/' || v_path;
      if right(v_url, char_length(v_suffix)) <> v_suffix then
        raise exception 'IMAGENES_INVALIDAS';
      end if;
    elsif v_path <> v_url then
      -- Imagen heredada (la foto única anterior): ruta y URL son el mismo valor.
      raise exception 'IMAGENES_INVALIDAS';
    end if;
    insert into public.product_images (workspace_id, product_id, storage_path, public_url, position)
    values (p.workspace_id, p.id, v_path, v_url, v_pos);
    v_pos := v_pos + 1;
  end loop;

  select coalesce(jsonb_agg(jsonb_build_object('url', pi.public_url, 'alt', p.name) order by pi.position), '[]'::jsonb)
    into v_images
  from public.product_images pi
  where pi.product_id = p.id;

  update public.products
  set image_url = (
    select pi.public_url from public.product_images pi
    where pi.product_id = p.id and pi.position = 0
  )
  where id = p.id;

  update public.catalog_listings
  set images = v_images, updated_at = now()
  where product_id = p.id;

  insert into public.audit_logs (workspace_id, user_id, action, entity, entity_id, metadata)
  values (p.workspace_id, auth.uid(), 'ACTUALIZAR_IMAGENES', 'product', p.id,
          jsonb_build_object('cantidad', jsonb_array_length(p_images)));

  return v_removed;
end $$;

revoke all on function public.set_product_images(uuid, jsonb) from public, anon;
grant execute on function public.set_product_images(uuid, jsonb) to authenticated;

-- publish_product: igual que en 0007_product_rubro_attributes.sql, más la foto
-- única anterior (products.image_url) cuando el producto no tiene galería.
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

  if v_images = '[]'::jsonb and p.image_url is not null and p.image_url <> '' then
    v_images := jsonb_build_array(jsonb_build_object('url', p.image_url, 'alt', p.name));
  end if;

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
