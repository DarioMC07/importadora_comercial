-- ============================================================================
-- 0004_rls.sql — Row Level Security: mínimo privilegio, denegación por
-- defecto, políticas separadas por operación. La membresía se resuelve SIEMPRE
-- desde workspace_members en el servidor; jamás se confía en un workspace_id
-- enviado por el navegador.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.seller_workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.suppliers enable row level security;
alter table public.imports enable row level security;
alter table public.import_items enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.catalog_listings enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.customers enable row level security;
alter table public.purchase_requests enable row level security;
alter table public.purchase_request_items enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: cada usuario solo ve/edita su propio perfil
-- ---------------------------------------------------------------------------
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- seller_workspaces: solo miembros. Sin INSERT/DELETE para roles normales
-- (los espacios se crean por script administrativo o platform_admin).
-- ---------------------------------------------------------------------------
create policy workspaces_select_member on public.seller_workspaces
  for select to authenticated using (public.is_member_of(id));
create policy workspaces_update_member on public.seller_workspaces
  for update to authenticated
  using (public.is_member_of(id)) with check (public.is_member_of(id));

-- ---------------------------------------------------------------------------
-- workspace_members: un usuario ve sus propias membresías y las de su espacio.
-- La escritura se realiza únicamente con service_role (seed/admin).
-- ---------------------------------------------------------------------------
create policy members_select_self on public.workspace_members
  for select to authenticated
  using (user_id = auth.uid() or public.is_member_of(workspace_id));

-- ---------------------------------------------------------------------------
-- Catálogo público: ÚNICA tabla legible por visitantes anónimos.
-- No tiene políticas de escritura: solo las funciones security definer
-- (publish/unpublish/sync) pueden modificarla.
-- ---------------------------------------------------------------------------
create policy catalog_select_public on public.catalog_listings
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Tablas privadas de negocio: patrón uniforme de 4 políticas por tabla,
-- siempre ancladas a la membresía resuelta en servidor (anti-IDOR/BOLA).
-- ---------------------------------------------------------------------------

-- suppliers
create policy suppliers_select on public.suppliers
  for select to authenticated using (public.is_member_of(workspace_id));
create policy suppliers_insert on public.suppliers
  for insert to authenticated with check (public.is_member_of(workspace_id));
create policy suppliers_update on public.suppliers
  for update to authenticated
  using (public.is_member_of(workspace_id)) with check (public.is_member_of(workspace_id));
create policy suppliers_delete on public.suppliers
  for delete to authenticated using (public.is_member_of(workspace_id));

-- imports (la recepción y el cambio de estado ocurren en funciones)
create policy imports_select on public.imports
  for select to authenticated using (public.is_member_of(workspace_id));
create policy imports_insert on public.imports
  for insert to authenticated with check (public.is_member_of(workspace_id));
create policy imports_update on public.imports
  for update to authenticated
  using (public.is_member_of(workspace_id)) with check (public.is_member_of(workspace_id));
create policy imports_delete on public.imports
  for delete to authenticated using (public.is_member_of(workspace_id));

-- import_items
create policy import_items_select on public.import_items
  for select to authenticated using (public.is_member_of(workspace_id));
create policy import_items_insert on public.import_items
  for insert to authenticated with check (public.is_member_of(workspace_id));
create policy import_items_update on public.import_items
  for update to authenticated
  using (public.is_member_of(workspace_id)) with check (public.is_member_of(workspace_id));
create policy import_items_delete on public.import_items
  for delete to authenticated using (public.is_member_of(workspace_id));

-- products
create policy products_select on public.products
  for select to authenticated using (public.is_member_of(workspace_id));
create policy products_insert on public.products
  for insert to authenticated with check (public.is_member_of(workspace_id));
create policy products_update on public.products
  for update to authenticated
  using (public.is_member_of(workspace_id)) with check (public.is_member_of(workspace_id));
create policy products_delete on public.products
  for delete to authenticated using (public.is_member_of(workspace_id));

-- product_images
create policy product_images_select on public.product_images
  for select to authenticated using (public.is_member_of(workspace_id));
create policy product_images_insert on public.product_images
  for insert to authenticated with check (public.is_member_of(workspace_id));
create policy product_images_update on public.product_images
  for update to authenticated
  using (public.is_member_of(workspace_id)) with check (public.is_member_of(workspace_id));
create policy product_images_delete on public.product_images
  for delete to authenticated using (public.is_member_of(workspace_id));

-- inventory_movements: historial inmutable. Solo lectura para miembros;
-- las escrituras las hacen exclusivamente las funciones de negocio.
create policy movements_select on public.inventory_movements
  for select to authenticated using (public.is_member_of(workspace_id));

-- customers
create policy customers_select on public.customers
  for select to authenticated using (public.is_member_of(workspace_id));
create policy customers_insert on public.customers
  for insert to authenticated with check (public.is_member_of(workspace_id));
create policy customers_update on public.customers
  for update to authenticated
  using (public.is_member_of(workspace_id)) with check (public.is_member_of(workspace_id));
create policy customers_delete on public.customers
  for delete to authenticated using (public.is_member_of(workspace_id));

-- purchase_requests: el alta pública ocurre SOLO por create_purchase_requests()
-- (security definer). Los miembros leen y actualizan el estado de las suyas.
create policy requests_select on public.purchase_requests
  for select to authenticated using (public.is_member_of(workspace_id));
create policy requests_update on public.purchase_requests
  for update to authenticated
  using (public.is_member_of(workspace_id)) with check (public.is_member_of(workspace_id));

-- purchase_request_items
create policy request_items_select on public.purchase_request_items
  for select to authenticated using (public.is_member_of(workspace_id));

-- sales: lectura miembros; creación/confirmación/anulación solo por funciones.
create policy sales_select on public.sales
  for select to authenticated using (public.is_member_of(workspace_id));
create policy sales_update on public.sales
  for update to authenticated
  using (public.is_member_of(workspace_id)) with check (public.is_member_of(workspace_id));

-- sale_items
create policy sale_items_select on public.sale_items
  for select to authenticated using (public.is_member_of(workspace_id));

-- audit_logs: solo lectura para miembros del espacio; escritura solo interna.
create policy audit_select on public.audit_logs
  for select to authenticated using (public.is_member_of(workspace_id));
