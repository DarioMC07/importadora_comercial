-- Función para eliminar un producto y sus dependencias de forma atómica y segura.
create or replace function public.delete_product(p_product_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  p public.products%rowtype;
begin
  select * into p from public.products where id = p_product_id;
  if not found then
    raise exception 'PRODUCTO_NO_ENCONTRADO';
  end if;

  if not public.is_member_of(p.workspace_id) then
    raise exception 'NO_AUTORIZADO';
  end if;

  -- Eliminar referencias en tablas asociadas al producto
  delete from public.purchase_request_items where product_id = p.id;
  delete from public.sale_items where product_id = p.id;
  delete from public.import_items where product_id = p.id;
  delete from public.inventory_movements where product_id = p.id;
  delete from public.product_images where product_id = p.id;
  delete from public.catalog_listings where product_id = p.id;

  -- Eliminar el producto
  delete from public.products where id = p.id;

  insert into public.audit_logs (workspace_id, user_id, action, entity, entity_id, metadata)
  values (
    p.workspace_id,
    auth.uid(),
    'ELIMINAR_PRODUCTO',
    'product',
    p.id,
    jsonb_build_object('sku', p.sku, 'name', p.name)
  );
end $$;

revoke all on function public.delete_product(uuid) from public, anon;
grant execute on function public.delete_product(uuid) to authenticated;

