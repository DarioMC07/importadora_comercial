-- ============================================================================
-- 0001_schema.sql — Esquema base del marketplace multi-vendedor
-- PostgreSQL 15+ (Supabase). Dinero en numeric(14,2): jamás punto flotante.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.workspace_role as enum ('seller_owner', 'platform_admin');
create type public.import_status as enum ('BORRADOR', 'PEDIDO', 'EN_TRANSITO', 'RECIBIDO', 'CANCELADO');
create type public.availability_status as enum ('DISPONIBLE', 'POCAS_UNIDADES', 'AGOTADO');
create type public.movement_type as enum (
  'ENTRADA_IMPORTACION', 'SALIDA_VENTA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'REVERSO'
);
create type public.request_status as enum ('NUEVA', 'CONTACTADA', 'CONFIRMADA', 'RECHAZADA', 'CONVERTIDA');
create type public.payment_method as enum ('EFECTIVO', 'QR', 'OTRO');
create type public.sale_status as enum ('BORRADOR', 'CONFIRMADA', 'ANULADA');

-- ---------------------------------------------------------------------------
-- Identidad y espacios de trabajo (multiempresa)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null check (char_length(full_name) between 1 and 120),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.seller_workspaces (
  id          uuid primary key default gen_random_uuid(),
  public_name text not null check (char_length(public_name) between 2 and 120),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Fuente de verdad de la membresía. El workspace_id nunca se acepta del cliente.
create table public.workspace_members (
  workspace_id uuid not null references public.seller_workspaces (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  role         public.workspace_role not null default 'seller_owner',
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Proveedores e importaciones
-- ---------------------------------------------------------------------------
create table public.suppliers (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.seller_workspaces (id),
  code         text not null check (char_length(code) between 1 and 40),
  name         text not null check (char_length(name) between 2 and 160),
  email        text check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone        text check (char_length(phone) <= 30),
  country      text not null check (char_length(country) between 2 and 80),
  notes        text check (char_length(notes) <= 2000),
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, code)
);

create table public.imports (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.seller_workspaces (id),
  code           text not null check (char_length(code) between 1 and 40),
  supplier_id    uuid not null references public.suppliers (id),
  origin_country text not null check (char_length(origin_country) between 2 and 80),
  ordered_at     date,
  eta_at         date,
  received_at    date,
  status         public.import_status not null default 'BORRADOR',
  currency       char(3) not null default 'USD',
  fx_rate        numeric(14,6) check (fx_rate is null or fx_rate > 0),
  freight_cost   numeric(14,2) not null default 0 check (freight_cost >= 0),
  duties_cost    numeric(14,2) not null default 0 check (duties_cost >= 0),
  other_costs    numeric(14,2) not null default 0 check (other_costs >= 0),
  total_cost     numeric(14,2) not null default 0 check (total_cost >= 0),
  created_by     uuid references public.profiles (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (workspace_id, code)
);

create table public.import_items (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.seller_workspaces (id),
  import_id    uuid not null references public.imports (id) on delete cascade,
  product_id   uuid not null, -- FK se agrega tras crear products
  quantity     integer not null check (quantity > 0),
  unit_cost    numeric(14,2) not null check (unit_cost >= 0),
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Productos (privados) y catálogo público (proyección segura)
-- ---------------------------------------------------------------------------
create table public.products (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.seller_workspaces (id),
  sku            text not null check (char_length(sku) between 1 and 60),
  name           text not null check (char_length(name) between 2 and 160),
  description    text check (char_length(description) <= 4000),
  category       text not null check (char_length(category) between 1 and 80),
  active         boolean not null default true,
  base_cost      numeric(14,2) not null default 0 check (base_cost >= 0),
  sale_price     numeric(14,2) not null default 0 check (sale_price >= 0),
  freight_alloc  numeric(14,2) not null default 0 check (freight_alloc >= 0),
  duty_alloc     numeric(14,2) not null default 0 check (duty_alloc >= 0),
  other_alloc    numeric(14,2) not null default 0 check (other_alloc >= 0),
  dim_length     numeric(10,2) check (dim_length is null or dim_length >= 0),
  dim_width      numeric(10,2) check (dim_width is null or dim_width >= 0),
  dim_height     numeric(10,2) check (dim_height is null or dim_height >= 0),
  dim_unit       text not null default 'cm' check (dim_unit in ('cm', 'm', 'in')),
  weight_kg      numeric(10,3) check (weight_kg is null or weight_kg >= 0),
  stock          integer not null default 0 check (stock >= 0),
  min_stock      integer not null default 0 check (min_stock >= 0),
  unit           text not null default 'unidad' check (char_length(unit) between 1 and 20),
  origin_country text check (char_length(origin_country) between 2 and 80),
  origin_public  boolean not null default false,
  published      boolean not null default false,
  notes          text check (char_length(notes) <= 2000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (workspace_id, sku)
);

alter table public.import_items
  add constraint import_items_product_fk
  foreign key (product_id) references public.products (id);

create table public.product_images (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.seller_workspaces (id),
  product_id   uuid not null references public.products (id) on delete cascade,
  storage_path text not null check (char_length(storage_path) between 1 and 500),
  public_url   text not null check (char_length(public_url) between 1 and 1000),
  position     smallint not null default 0 check (position between 0 and 20),
  created_at   timestamptz not null default now()
);

-- Proyección pública: la única tabla de productos legible por el rol anónimo.
-- NUNCA contiene costos, stock exacto, proveedor ni datos internos.
create table public.catalog_listings (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.seller_workspaces (id),
  product_id        uuid not null unique references public.products (id) on delete cascade,
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*-[a-z0-9]{6}$'),
  name              text not null,
  description       text,
  category          text not null,
  price             numeric(14,2) not null check (price >= 0),
  availability      public.availability_status not null,
  origin_country    text, -- solo si origin_public = true
  dims_public       jsonb, -- dimensiones/attrs comerciales que el vendedor decide publicar
  seller_public_name text not null,
  seller_slug       text not null,
  images            jsonb not null default '[]'::jsonb, -- [{url, alt}] del bucket público
  published_at      timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Inventario (historial inmutable)
-- ---------------------------------------------------------------------------
create table public.inventory_movements (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.seller_workspaces (id),
  product_id   uuid not null references public.products (id),
  type         public.movement_type not null,
  quantity     integer not null check (quantity > 0),
  reason       text check (char_length(reason) <= 500),
  ref_type     text check (ref_type in ('import', 'sale', 'manual', 'cancel')),
  ref_id       uuid,
  created_by   uuid references public.profiles (id),
  created_at   timestamptz not null default now(),
  -- Idempotencia: el mismo origen no puede generar dos veces el mismo movimiento.
  unique (product_id, type, ref_type, ref_id)
);

-- ---------------------------------------------------------------------------
-- Clientes (por espacio; sin libreta global)
-- ---------------------------------------------------------------------------
create table public.customers (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.seller_workspaces (id),
  code         text not null check (char_length(code) between 1 and 40),
  name         text not null check (char_length(name) between 2 and 160),
  ci_nit       text check (char_length(ci_nit) <= 30), -- dato privado
  phone        text check (char_length(phone) <= 30),
  email        text check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  address      text check (char_length(address) <= 300),
  notes        text check (char_length(notes) <= 2000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, code)
);

-- ---------------------------------------------------------------------------
-- Solicitudes de compra y ventas (con snapshots financieros)
-- ---------------------------------------------------------------------------
create table public.purchase_requests (
  id              uuid primary key default gen_random_uuid(),
  public_code     text not null unique check (public_code ~ '^[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  workspace_id    uuid not null references public.seller_workspaces (id),
  customer_id     uuid references public.customers (id),
  customer_name   text not null check (char_length(customer_name) between 2 and 160),
  customer_phone  text not null check (char_length(customer_phone) between 5 and 30),
  customer_email  text check (customer_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  consent_given   boolean not null default false,
  status          public.request_status not null default 'NUEVA',
  total           numeric(14,2) not null default 0 check (total >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.purchase_request_items (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.seller_workspaces (id),
  request_id       uuid not null references public.purchase_requests (id) on delete cascade,
  product_id       uuid not null references public.products (id),
  product_name     text not null,          -- snapshot
  quantity         integer not null check (quantity > 0),
  unit_price       numeric(14,2) not null check (unit_price >= 0), -- snapshot del precio público
  created_at       timestamptz not null default now()
);

create table public.sales (
  id             uuid primary key default gen_random_uuid(),
  code           text not null check (char_length(code) between 1 and 40),
  workspace_id   uuid not null references public.seller_workspaces (id),
  customer_id    uuid references public.customers (id),
  request_id     uuid references public.purchase_requests (id),
  sold_at        timestamptz not null default now(),
  subtotal       numeric(14,2) not null default 0 check (subtotal >= 0),
  discount       numeric(14,2) not null default 0 check (discount >= 0),
  total          numeric(14,2) not null default 0 check (total >= 0),
  payment_method public.payment_method not null default 'EFECTIVO',
  status         public.sale_status not null default 'BORRADOR',
  created_by     uuid references public.profiles (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (workspace_id, code),
  check (discount <= subtotal)
);

create table public.sale_items (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references public.seller_workspaces (id),
  sale_id             uuid not null references public.sales (id),
  product_id          uuid not null references public.products (id),
  quantity            integer not null check (quantity > 0),
  unit_price          numeric(14,2) not null check (unit_price >= 0),      -- snapshot
  base_cost_snapshot  numeric(14,2) not null check (base_cost_snapshot >= 0),
  landed_cost_snapshot numeric(14,2) not null check (landed_cost_snapshot >= 0),
  created_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Auditoría de acciones sensibles
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id           bigint generated always as identity primary key,
  workspace_id uuid references public.seller_workspaces (id),
  user_id      uuid references public.profiles (id),
  action       text not null check (char_length(action) between 2 and 80),
  entity       text not null check (char_length(entity) between 2 and 60),
  entity_id    uuid,
  metadata     jsonb not null default '{}'::jsonb, -- jamás secretos ni CI/NIT completos
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------
create index idx_suppliers_ws        on public.suppliers (workspace_id);
create index idx_imports_ws_status   on public.imports (workspace_id, status);
create index idx_imports_ws_dates    on public.imports (workspace_id, ordered_at);
create index idx_import_items_import on public.import_items (import_id);
create index idx_import_items_ws     on public.import_items (workspace_id);
create index idx_products_ws_sku     on public.products (workspace_id, sku);
create index idx_products_ws_cat     on public.products (workspace_id, category);
create index idx_products_ws_active  on public.products (workspace_id, active);
create index idx_products_name_trgm  on public.products using gin (to_tsvector('spanish', name));
create index idx_product_images_prod on public.product_images (product_id);
create index idx_catalog_category    on public.catalog_listings (category);
create index idx_catalog_seller      on public.catalog_listings (workspace_id);
create index idx_catalog_price       on public.catalog_listings (price);
create index idx_catalog_published   on public.catalog_listings (published_at desc);
create index idx_catalog_search      on public.catalog_listings using gin (to_tsvector('spanish', name || ' ' || coalesce(description, '')));
create index idx_movements_ws_prod   on public.inventory_movements (workspace_id, product_id, created_at);
create index idx_movements_ref       on public.inventory_movements (ref_type, ref_id);
create index idx_customers_ws        on public.customers (workspace_id);
create index idx_requests_ws_status  on public.purchase_requests (workspace_id, status);
create index idx_requests_ws_created on public.purchase_requests (workspace_id, created_at desc);
create index idx_request_items_req   on public.purchase_request_items (request_id);
create index idx_sales_ws_sold       on public.sales (workspace_id, sold_at desc);
create index idx_sales_ws_status     on public.sales (workspace_id, status);
create index idx_sale_items_sale     on public.sale_items (sale_id);
create index idx_sale_items_prod     on public.sale_items (workspace_id, product_id);
create index idx_audit_ws_created    on public.audit_logs (workspace_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger trg_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger trg_touch before update on public.seller_workspaces for each row execute function public.touch_updated_at();
create trigger trg_touch before update on public.suppliers for each row execute function public.touch_updated_at();
create trigger trg_touch before update on public.imports for each row execute function public.touch_updated_at();
create trigger trg_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger trg_touch before update on public.customers for each row execute function public.touch_updated_at();
create trigger trg_touch before update on public.purchase_requests for each row execute function public.touch_updated_at();
create trigger trg_touch before update on public.sales for each row execute function public.touch_updated_at();
