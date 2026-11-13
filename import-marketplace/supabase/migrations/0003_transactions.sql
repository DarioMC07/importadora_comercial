-- ============================================================================
-- 0003_transactions.sql — Operaciones transaccionales críticas
-- (recepción de importación, ajustes, ventas, anulación, solicitudes públicas)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Crear importación con ítems (BORRADOR). Total calculado en la transacción.
-- p_items: jsonb array de { "product_id": uuid, "quantity": int, "unit_cost": number }
-- ---------------------------------------------------------------------------
create or replace function public.create_import(
  p_supplier_id uuid,
  p_code text,
  p_origin_country text,
  p_ordered_at date,
  p_eta_at date,
  p_currency char(3),
  p_fx_rate numeric,
  p_freight_cost numeric,
  p_duties_cost numeric,
  p_other_costs numeric,
  p_items jsonb
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_ws uuid := public.my_workspace_id();
  v_import_id uuid;
  v_item jsonb;
  v_total numeric(14,2) := 0;
  v_pid uuid;
  v_qty int;
  v_cost numeric(14,2);
begin
  if v_ws is null then raise exception 'NO_AUTORIZADO'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'IMPORTACION_SIN_ITEMS';
  end if;
  if not exists (select 1 from public.suppliers where id = p_supplier_id and workspace_id = v_ws) then
    raise exception 'PROVEEDOR_NO_ENCONTRADO';
  end if;

  insert into public.imports (
    workspace_id, code, supplier_id, origin_country, ordered_at, eta_at,
    currency, fx_rate, freight_cost, duties_cost, other_costs
  ) values (
    v_ws, p_code, p_supplier_id, p_origin_country, p_ordered_at, p_eta_at,
    coalesce(p_currency, 'USD'), p_fx_rate,
    coalesce(p_freight_cost, 0), coalesce(p_duties_cost, 0), coalesce(p_other_costs, 0)
  ) returning id into v_import_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pid := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'quantity')::int;
    v_cost := (v_item ->> 'unit_cost')::numeric(14,2);
    if v_qty is null or v_qty <= 0 then raise exception 'CANTIDAD_INVALIDA'; end if;
    if v_cost is null or v_cost < 0 then raise exception 'COSTO_INVALIDO'; end if;
    -- El producto debe pertenecer al mismo espacio (anti-IDOR).
    if not exists (select 1 from public.products where id = v_pid and workspace_id = v_ws) then
      raise exception 'PRODUCTO_NO_ENCONTRADO';
    end if;
    insert into public.import_items (workspace_id, import_id, product_id, quantity, unit_cost)
    values (v_ws, v_import_id, v_pid, v_qty, v_cost);
    v_total := v_total + v_qty * v_cost;
  end loop;

  update public.imports
  set total_cost = v_total + coalesce(p_freight_cost,0) + coalesce(p_duties_cost,0) + coalesce(p_other_costs,0)
  where id = v_import_id;

  return v_import_id;
end $$;

-- ---------------------------------------------------------------------------
-- Recibir importación: genera ENTRADA_IMPORTACION y sube stock.
-- IDEMPOTENTE: la restricción única (product_id, type, ref_type, ref_id)
-- garantiza que repetir la acción jamás duplica el stock.
-- ---------------------------------------------------------------------------
create or replace function public.receive_import(p_import_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_import public.imports%rowtype;
  v_item public.import_items%rowtype;
begin
  select * into v_import from public.imports where id = p_import_id for update;
  if not found then raise exception 'IMPORTACION_NO_ENCONTRADA'; end if;
  if not public.is_member_of(v_import.workspace_id) then raise exception 'NO_AUTORIZADO'; end if;
  if v_import.status = 'CANCELADO' then raise exception 'IMPORTACION_CANCELADA'; end if;

  -- Idempotencia: si ya fue recibida, no hacer nada.
  if v_import.status = 'RECIBIDO' then return; end if;

  for v_item in
    select * from public.import_items where import_id = v_import.id
  loop
    insert into public.inventory_movements (
      workspace_id, product_id, type, quantity, reason, ref_type, ref_id, created_by
    ) values (
      v_import.workspace_id, v_item.product_id, 'ENTRADA_IMPORTACION',
      v_item.quantity, 'Recepción de importación ' || v_import.code, 'import', v_import.id, auth.uid()
    )
    on conflict (product_id, type, ref_type, ref_id) do nothing;

    -- Solo sube stock si el movimiento se insertó efectivamente.
    if found then
      update public.products
      set stock = stock + v_item.quantity
      where id = v_item.product_id;
    end if;
  end loop;

  update public.imports
  set status = 'RECIBIDO', received_at = current_date
  where id = v_import.id;

  insert into public.audit_logs (workspace_id, user_id, action, entity, entity_id)
  values (v_import.workspace_id, auth.uid(), 'RECIBIR_IMPORTACION', 'import', v_import.id);
end $$;

-- ---------------------------------------------------------------------------
-- Ajuste manual de inventario (requiere motivo, nunca stock negativo)
-- p_delta: entero con signo (positivo = AJUSTE_POSITIVO, negativo = AJUSTE_NEGATIVO)
-- ---------------------------------------------------------------------------
create or replace function public.adjust_inventory(
  p_product_id uuid,
  p_delta int,
  p_reason text
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_p public.products%rowtype;
  v_type public.movement_type;
begin
  select * into v_p from public.products where id = p_product_id for update;
  if not found then raise exception 'PRODUCTO_NO_ENCONTRADO'; end if;
  if not public.is_member_of(v_p.workspace_id) then raise exception 'NO_AUTORIZADO'; end if;
  if p_delta is null or p_delta = 0 then raise exception 'AJUSTE_CERO'; end if;
  if p_reason is null or char_length(trim(p_reason)) < 3 then
    raise exception 'MOTIVO_REQUERIDO';
  end if;
  if v_p.stock + p_delta < 0 then raise exception 'STOCK_NEGATIVO'; end if;

  v_type := case when p_delta > 0 then 'AJUSTE_POSITIVO'::public.movement_type
                 else 'AJUSTE_NEGATIVO'::public.movement_type end;

  insert into public.inventory_movements (
    workspace_id, product_id, type, quantity, reason, ref_type, ref_id, created_by
  ) values (
    v_p.workspace_id, v_p.id, v_type, abs(p_delta), trim(p_reason), 'manual', null, auth.uid()
  );

  update public.products set stock = stock + p_delta where id = v_p.id;

  insert into public.audit_logs (workspace_id, user_id, action, entity, entity_id, metadata)
  values (v_p.workspace_id, auth.uid(), 'AJUSTE_INVENTARIO', 'product', v_p.id,
          jsonb_build_object('delta', p_delta, 'motivo', left(trim(p_reason), 120)));
end $$;

-- ---------------------------------------------------------------------------
-- Crear venta en BORRADOR con snapshots financieros.
-- p_items: jsonb array de { "product_id": uuid, "quantity": int, "unit_price"?: number }
-- Si no se envía unit_price se toma el precio de venta actual.
-- ---------------------------------------------------------------------------
create or replace function public.create_sale(
  p_items jsonb,
  p_payment_method public.payment_method,
  p_discount numeric default 0,
  p_customer_id uuid default null,
  p_request_id uuid default null
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_ws uuid := public.my_workspace_id();
  v_sale_id uuid;
  v_item jsonb;
  v_p public.products%rowtype;
  v_qty int;
  v_price numeric(14,2);
  v_subtotal numeric(14,2) := 0;
  v_discount numeric(14,2) := coalesce(p_discount, 0);
  v_count int := 0;
  v_seq int;
  v_code text;
begin
  if v_ws is null then raise exception 'NO_AUTORIZADO'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'VENTA_SIN_ITEMS';
  end if;
  if v_discount < 0 then raise exception 'DESCUENTO_INVALIDO'; end if;
  if p_customer_id is not null and not exists (
    select 1 from public.customers where id = p_customer_id and workspace_id = v_ws
  ) then raise exception 'CLIENTE_NO_ENCONTRADO'; end if;
  if p_request_id is not null and not exists (
    select 1 from public.purchase_requests where id = p_request_id and workspace_id = v_ws
  ) then raise exception 'SOLICITUD_NO_ENCONTRADA'; end if;

  select count(*) + 1 into v_seq from public.sales where workspace_id = v_ws;
  v_code := 'V-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(v_seq::text, 4, '0');
  -- Evita colisión en el mismo segundo.
  while exists (select 1 from public.sales where workspace_id = v_ws and code = v_code) loop
    v_seq := v_seq + 1;
    v_code := 'V-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(v_seq::text, 4, '0');
  end loop;

  insert into public.sales (code, workspace_id, customer_id, request_id, payment_method, discount)
  values (v_code, v_ws, p_customer_id, p_request_id, p_payment_method, v_discount)
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_p from public.products
    where id = (v_item ->> 'product_id')::uuid and workspace_id = v_ws;
    if not found then raise exception 'PRODUCTO_NO_ENCONTRADO'; end if;
    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty <= 0 then raise exception 'CANTIDAD_INVALIDA'; end if;
    v_price := coalesce((v_item ->> 'unit_price')::numeric(14,2), v_p.sale_price);
    if v_price < 0 then raise exception 'PRECIO_INVALIDO'; end if;

    -- Snapshots históricos: la utilidad jamás se recalcula con costos futuros.
    insert into public.sale_items (
      workspace_id, sale_id, product_id, quantity, unit_price,
      base_cost_snapshot, landed_cost_snapshot
    ) values (
      v_ws, v_sale_id, v_p.id, v_qty, v_price, v_p.base_cost, v_p.landed_unit_cost
    );
    v_subtotal := v_subtotal + v_qty * v_price;
    v_count := v_count + 1;
  end loop;

  if v_discount > v_subtotal then raise exception 'DESCUENTO_MAYOR_AL_SUBTOTAL'; end if;

  update public.sales
  set subtotal = v_subtotal, total = v_subtotal - v_discount
  where id = v_sale_id;

  -- Si nace de una solicitud, queda marcada como convertida.
  if p_request_id is not null then
    update public.purchase_requests
    set status = 'CONVERTIDA'
    where id = p_request_id and workspace_id = v_ws;
  end if;

  return v_sale_id;
end $$;

-- ---------------------------------------------------------------------------
-- Confirmar venta: descuenta stock ATÓMICAMENTE y una sola vez.
-- ---------------------------------------------------------------------------
create or replace function public.confirm_sale(p_sale_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_sale public.sales%rowtype;
  v_item public.sale_items%rowtype;
  v_stock int;
begin
  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then raise exception 'VENTA_NO_ENCONTRADA'; end if;
  if not public.is_member_of(v_sale.workspace_id) then raise exception 'NO_AUTORIZADO'; end if;

  -- Idempotencia: confirmar dos veces no descuenta dos veces.
  if v_sale.status = 'CONFIRMADA' then return; end if;
  if v_sale.status = 'ANULADA' then raise exception 'VENTA_ANULADA'; end if;

  for v_item in select * from public.sale_items where sale_id = v_sale.id loop
    update public.products set stock = stock - v_item.quantity
    where id = v_item.product_id and stock >= v_item.quantity
    returning stock into v_stock;

    if not found then
      raise exception 'STOCK_INSUFICIENTE';
    end if;

    insert into public.inventory_movements (
      workspace_id, product_id, type, quantity, reason, ref_type, ref_id, created_by
    ) values (
      v_sale.workspace_id, v_item.product_id, 'SALIDA_VENTA', v_item.quantity,
      'Venta ' || v_sale.code, 'sale', v_sale.id, auth.uid()
    )
    on conflict (product_id, type, ref_type, ref_id) do nothing;
  end loop;

  update public.sales set status = 'CONFIRMADA', sold_at = now() where id = v_sale.id;

  insert into public.audit_logs (workspace_id, user_id, action, entity, entity_id)
  values (v_sale.workspace_id, auth.uid(), 'CONFIRMAR_VENTA', 'sale', v_sale.id);
end $$;

-- ---------------------------------------------------------------------------
-- Anular venta: repone stock mediante movimientos REVERSO. Nunca borra.
-- ---------------------------------------------------------------------------
create or replace function public.cancel_sale(p_sale_id uuid, p_reason text default null)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_sale public.sales%rowtype;
  v_item public.sale_items%rowtype;
begin
  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then raise exception 'VENTA_NO_ENCONTRADA'; end if;
  if not public.is_member_of(v_sale.workspace_id) then raise exception 'NO_AUTORIZADO'; end if;
  if v_sale.status = 'ANULADA' then return; end if; -- idempotente
  if v_sale.status = 'BORRADOR' then
    -- Un borrador no tiene movimientos: solo se anula.
    update public.sales set status = 'ANULADA' where id = v_sale.id;
    return;
  end if;

  for v_item in select * from public.sale_items where sale_id = v_sale.id loop
    insert into public.inventory_movements (
      workspace_id, product_id, type, quantity, reason, ref_type, ref_id, created_by
    ) values (
      v_sale.workspace_id, v_item.product_id, 'REVERSO', v_item.quantity,
      coalesce(nullif(trim(p_reason), ''), 'Anulación de venta ' || v_sale.code),
      'cancel', v_sale.id, auth.uid()
    )
    on conflict (product_id, type, ref_type, ref_id) do nothing;

    if found then
      update public.products set stock = stock + v_item.quantity where id = v_item.product_id;
    end if;
  end loop;

  update public.sales set status = 'ANULADA' where id = v_sale.id;

  insert into public.audit_logs (workspace_id, user_id, action, entity, entity_id, metadata)
  values (v_sale.workspace_id, auth.uid(), 'ANULAR_VENTA', 'sale', v_sale.id,
          jsonb_build_object('motivo', left(coalesce(p_reason, ''), 200)));
end $$;

-- ---------------------------------------------------------------------------
-- Solicitud pública de compra: divide el carrito por vendedor.
-- Invocable por anónimos a través del rol authenticated/anon vía server action.
-- p_payload: {
--   "customer": {"name": text, "phone": text, "email"?: text, "consent": boolean},
--   "items": [{"product_id": uuid, "quantity": int}]
-- }
-- Devuelve los códigos públicos generados (uno por vendedor).
-- ---------------------------------------------------------------------------
create or replace function public.create_purchase_requests(p_payload jsonb)
returns text[]
language plpgsql security definer
set search_path = public
as $$
declare
  v_name text := nullif(trim(p_payload #>> '{customer,name}'), '');
  v_phone text := nullif(trim(p_payload #>> '{customer,phone}'), '');
  v_email text := nullif(trim(p_payload #>> '{customer,email}'), '');
  v_consent boolean := coalesce((p_payload #>> '{customer,consent}')::boolean, false);
  v_item jsonb;
  v_ws uuid;
  v_ws_seen uuid[] := '{}';
  v_codes text[] := '{}';
  v_code text;
  v_request_id uuid;
  v_listing public.catalog_listings%rowtype;
  v_qty int;
  v_total numeric(14,2);
  v_count int := 0;
begin
  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 160 then
    raise exception 'NOMBRE_INVALIDO';
  end if;
  if v_phone is null or char_length(v_phone) < 5 or char_length(v_phone) > 30 then
    raise exception 'TELEFONO_INVALIDO';
  end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'CORREO_INVALIDO';
  end if;
  if not v_consent then raise exception 'CONSENTIMIENTO_REQUERIDO'; end if;
  if jsonb_typeof(p_payload -> 'items') <> 'array'
     or jsonb_array_length(p_payload -> 'items') = 0
     or jsonb_array_length(p_payload -> 'items') > 100 then
    raise exception 'ITEMS_INVALIDOS';
  end if;

  -- Validar todo el carrito ANTES de crear nada (todo o nada).
  for v_item in select * from jsonb_array_elements(p_payload -> 'items') loop
    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty <= 0 or v_qty > 999 then raise exception 'CANTIDAD_INVALIDA'; end if;
    select cl.* into v_listing from public.catalog_listings cl
    join public.seller_workspaces w on w.id = cl.workspace_id and w.active
    where cl.product_id = (v_item ->> 'product_id')::uuid;
    if not found then raise exception 'PRODUCTO_NO_DISPONIBLE'; end if;
    if v_listing.availability = 'AGOTADO' then raise exception 'PRODUCTO_AGOTADO'; end if;
    v_count := v_count + 1;
  end loop;

  -- Crear una solicitud por vendedor. El cliente jamás ve el workspace_id.
  for v_ws in
    select distinct cl.workspace_id
    from jsonb_array_elements(p_payload -> 'items') it
    join public.catalog_listings cl on cl.product_id = (it ->> 'product_id')::uuid
    order by 1
  loop
    v_code := public.make_request_code();
    while exists (select 1 from public.purchase_requests where public_code = v_code) loop
      v_code := public.make_request_code();
    end loop;

    select coalesce(sum((it ->> 'quantity')::int * cl.price), 0) into v_total
    from jsonb_array_elements(p_payload -> 'items') it
    join public.catalog_listings cl on cl.product_id = (it ->> 'product_id')::uuid
    where cl.workspace_id = v_ws;

    insert into public.purchase_requests (
      public_code, workspace_id, customer_name, customer_phone, customer_email,
      consent_given, total
    ) values (
      v_code, v_ws, v_name, v_phone, v_email, true, v_total
    ) returning id into v_request_id;

    insert into public.purchase_request_items (
      workspace_id, request_id, product_id, product_name, quantity, unit_price
    )
    select v_ws, v_request_id, cl.product_id, cl.name,
           (it ->> 'quantity')::int, cl.price
    from jsonb_array_elements(p_payload -> 'items') it
    join public.catalog_listings cl on cl.product_id = (it ->> 'product_id')::uuid
    where cl.workspace_id = v_ws;

    -- Vincular/crear cliente del espacio (búsqueda por teléfono del espacio).
    insert into public.customers (workspace_id, code, name, phone, email)
    values (
      v_ws,
      'C-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
      v_name, v_phone, v_email
    )
    on conflict (workspace_id, code) do nothing;

    update public.purchase_requests pr
    set customer_id = (
      select c.id from public.customers c
      where c.workspace_id = v_ws and c.phone = v_phone
      order by c.created_at asc limit 1
    )
    where pr.id = v_request_id;

    v_codes := array_append(v_codes, v_code);
  end loop;

  return v_codes;
end $$;

-- Permisos de ejecución: las mutaciones de negocio las ejecuta el usuario
-- autenticado; la creación de solicitudes también el visitante anónimo.
revoke all on all functions in schema public from public;
-- Los helpers usados dentro de políticas RLS deben ser ejecutables por los
-- roles que las evalúan (corren como security definer, pero el llamante
-- necesita el privilegio EXECUTE).
grant execute on function public.is_member_of(uuid) to anon, authenticated;
grant execute on function public.is_platform_admin() to anon, authenticated;
grant execute on function public.my_workspace_id() to authenticated;
grant execute on function public.availability_of(int, int) to anon, authenticated;
grant execute on function public.create_purchase_requests(jsonb) to anon, authenticated;
grant execute on function public.create_import(uuid, text, text, date, date, char, numeric, numeric, numeric, numeric, jsonb) to authenticated;
grant execute on function public.receive_import(uuid) to authenticated;
grant execute on function public.adjust_inventory(uuid, int, text) to authenticated;
grant execute on function public.create_sale(jsonb, public.payment_method, numeric, uuid, uuid) to authenticated;
grant execute on function public.confirm_sale(uuid) to authenticated;
grant execute on function public.cancel_sale(uuid, text) to authenticated;
grant execute on function public.publish_product(uuid) to authenticated;
grant execute on function public.unpublish_product(uuid) to authenticated;
