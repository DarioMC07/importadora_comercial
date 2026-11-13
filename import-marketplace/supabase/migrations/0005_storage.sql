-- ============================================================================
-- 0005_storage.sql — Buckets de almacenamiento y creación automática de perfil
-- ============================================================================

-- Perfil automático al registrarse un usuario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Usuario'));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Buckets
--  - product-images: PÚBLICO. Solo imágenes, máx. 2 MB, máx. 5 por producto
--    (límite de cantidad validado en la app + constraint a nivel de datos).
--  - private-docs: PRIVADO. Requiere URLs firmadas de corta duración.
-- Convención de ruta: <bucket>/<workspace_id>/<recurso_id>/<archivo>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 'product-images', true, 2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'private-docs', 'private-docs', false, 5242880,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

-- Helper: workspace dueño de la carpeta raíz de un objeto.
create or replace function public.object_workspace(object_name text)
returns uuid
language sql immutable
as $$
  select (string_to_array(object_name, '/'))[1]::uuid
$$;

-- product-images: lectura pública; escritura solo del espacio propietario.
create policy product_images_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-images');

create policy product_images_member_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and public.is_member_of(public.object_workspace(name))
  );

create policy product_images_member_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_member_of(public.object_workspace(name))
  );

create policy product_images_member_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_member_of(public.object_workspace(name))
  );

-- private-docs: acceso solo para miembros del espacio (vía URLs firmadas).
create policy private_docs_member_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'private-docs'
    and public.is_member_of(public.object_workspace(name))
  );

create policy private_docs_member_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'private-docs'
    and public.is_member_of(public.object_workspace(name))
  );

create policy private_docs_member_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'private-docs'
    and public.is_member_of(public.object_workspace(name))
  );
