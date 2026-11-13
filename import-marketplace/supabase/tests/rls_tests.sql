-- ============================================================================
-- Pruebas RLS en SQL puro (alternativa a scripts/run-rls-tests.mjs).
-- Ejecutar con:  psql "$DATABASE_URL" -f supabase/tests/rls_tests.sql
-- Simula usuarios con request.jwt.claims (patrón Supabase local).
-- ============================================================================

\set QUIET on
\pset format unaligned
\pset tuples_only on

create or replace function pg_temp.assert(cond boolean, nombre text)
returns void language plpgsql as $$
begin
  if cond then
    raise notice 'PASS: %', nombre;
  else
    raise exception 'FAIL: %', nombre;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Como VENDEDOR 1 (Andes Import)
-- ---------------------------------------------------------------------------
set role authenticated;
set request.jwt.claims to '{"sub":"22222222-0000-4000-8000-000000000001","role":"authenticated"}';

select pg_temp.assert(
  (select count(*) from public.products where workspace_id = '11111111-0000-4000-8000-000000000001') >= 5,
  'vendedor1 lee sus productos');

select pg_temp.assert(
  (select count(*) from public.products where workspace_id = '11111111-0000-4000-8000-000000000002') = 0,
  'vendedor1 NO lee productos del vendedor2');

select pg_temp.assert(
  (select count(*) from public.customers where id = '66666666-0000-4000-8000-000000000004') = 0,
  'vendedor1 NO lee cliente ajeno por UUID (IDOR)');

select pg_temp.assert(
  (select count(*) from public.sales where id = '88888888-0000-4000-8000-000000000011') = 0,
  'vendedor1 NO lee venta ajena');

-- Inserción en espacio ajeno debe fallar (WITH CHECK)
do $$
begin
  insert into public.customers (workspace_id, code, name)
  values ('11111111-0000-4000-8000-000000000002', 'HACK', 'Intruso');
  raise exception 'FAIL: insertó cliente en espacio ajeno';
exception when insufficient_privilege or check_violation then
  raise notice 'PASS: vendedor1 NO inserta en espacio ajeno';
end $$;

-- Escritura directa en movimientos debe fallar (sin política INSERT)
do $$
begin
  insert into public.inventory_movements (workspace_id, product_id, type, quantity)
  values ('11111111-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000001', 'AJUSTE_POSITIVO', 999);
  raise exception 'FAIL: insertó movimiento directo';
exception when insufficient_privilege then
  raise notice 'PASS: movimientos solo se escriben vía funciones';
end $$;

-- Idempotencia de recepción: recibir dos veces la misma importación
-- no duplica el stock.
do $$
declare
  stock_antes int;
  stock_despues int;
  stock_final int;
begin
  select stock into stock_antes from public.products
  where id = '33333333-0000-4000-8000-000000000003'; -- cable USB-C (import EN_TRANSITO)

  perform public.receive_import('55555555-0000-4000-8000-000000000002');
  select stock into stock_despues from public.products
  where id = '33333333-0000-4000-8000-000000000003';

  perform public.receive_import('55555555-0000-4000-8000-000000000002'); -- repetir
  select stock into stock_final from public.products
  where id = '33333333-0000-4000-8000-000000000003';

  perform pg_temp.assert(stock_despues = stock_antes + 200, 'recibir suma el stock del ítem');
  perform pg_temp.assert(stock_final = stock_despues, 'recibir dos veces NO duplica stock');
end $$;

-- confirm_sale dos veces descuenta una sola vez; stock insuficiente rechaza.
do $$
declare
  v_venta uuid;
  stock_antes int;
begin
  select stock into stock_antes from public.products
  where id = '33333333-0000-4000-8000-000000000005'; -- power bank

  v_venta := public.create_sale(
    '[{"product_id":"33333333-0000-4000-8000-000000000005","quantity":3}]'::jsonb,
    'EFECTIVO', 0, null, null);
  perform public.confirm_sale(v_venta);
  perform public.confirm_sale(v_venta); -- idempotente

  perform pg_temp.assert(
    (select stock from public.products where id = '33333333-0000-4000-8000-000000000005')
      = stock_antes - 3,
    'confirmar dos veces descuenta una sola vez');

  -- Anular repone con reverso.
  perform public.cancel_sale(v_venta, 'Prueba automatizada');
  perform pg_temp.assert(
    (select stock from public.products where id = '33333333-0000-4000-8000-000000000005')
      = stock_antes,
    'anular repone el stock con reverso');

  -- Cantidad mayor al stock: rechazada.
  begin
    v_venta := public.create_sale(
      '[{"product_id":"33333333-0000-4000-8000-000000000005","quantity":99999}]'::jsonb,
      'EFECTIVO', 0, null, null);
    perform public.confirm_sale(v_venta);
    raise exception 'FAIL: permitió vender más que el stock';
  exception when raise_exception then
    raise notice 'PASS: venta mayor al stock es rechazada';
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Como ANÓNIMO
-- ---------------------------------------------------------------------------
set role anon;
set request.jwt.claims to '{}';

select pg_temp.assert(
  (select count(*) from public.catalog_listings) > 0,
  'anónimo lee el catálogo público');

select pg_temp.assert(
  (select count(*) from public.products) = 0,
  'anónimo NO lee products');

select pg_temp.assert(
  (select count(*) from public.customers) = 0,
  'anónimo NO lee customers');

-- La solicitud pública divide el carrito por vendedor.
do $$
declare
  codigos text[];
begin
  codigos := public.create_purchase_requests(jsonb_build_object(
    'customer', jsonb_build_object('name','Test Anon','phone','70000000','consent',true),
    'items', jsonb_build_array(
      jsonb_build_object('product_id','33333333-0000-4000-8000-000000000001','quantity',1),
      jsonb_build_object('product_id','33333333-0000-4000-8000-000000000006','quantity',1)
    )
  ));
  perform pg_temp.assert(array_length(codigos, 1) = 2, 'carrito de 2 vendedores → 2 solicitudes');
end $$;

reset role;

select 'Todas las pruebas RLS en SQL terminaron.' as resultado;
