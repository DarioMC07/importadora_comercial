# DECISIONES — ImportHub

## Supuestos adoptados (ambigüedades no bloqueantes)

1. **Un vendedor = un espacio**. El modelo admite N miembros por espacio
   (`workspace_members`), pero el demo asigna un propietario por espacio y el
   inicio de sesión entra directamente a su espacio (sin selector).
2. **Moneda de operación**: los costos de importación pueden registrarse en
   moneda extranjera con tipo de cambio, pero los costos asignados al producto
   y todas las ventas se expresan en BOB (moneda configurable vía
   `NEXT_PUBLIC_APP_CURRENCY`).
3. **Asignación de costos indirectos**: transporte/aranceles/otros se asignan
   por producto de forma manual (`freight_alloc`, `duty_alloc`, `other_alloc`)
   en lugar de prorratearse automáticamente desde la importación. Es simple,
   auditable y suficiente para el MVP.
4. **Cliente por espacio**: un mismo comprador puede existir como cliente de
   varios vendedores (filas independientes); no hay libreta global. Las
   solicitudes públicas crean/vinculan clientes por teléfono dentro del espacio.
5. **Imágenes**: el seed no incluye imágenes (placeholder local), garantizando
   que el prototipo funcione sin red. La subida usa el bucket público
   `product-images` (máx. 2 MB, JPEG/PNG/WebP, ruta `<workspace_id>/…`).
6. **`platform_admin` mínimo**: no tiene pantalla para explorar datos
   comerciales; la creación/desactivación de espacios se realiza por script
   administrativo (service_role).
7. **Umbral de "pocas unidades"**: `stock <= max(min_stock, 3)` para no revelar
   el stock exacto aunque el vendedor configure mínimos en 0.

## Alcance

- Incluye: marketplace público, 5 espacios demo, autenticación, proveedores,
  importaciones con recepción atómica, productos con publicación segura,
  inventario con movimientos inmutables, clientes, solicitudes divididas por
  vendedor, ventas con snapshots, anulación con reverso, dashboard, reportes
  con CSV, pruebas unitarias/RLS/E2E.
- Excluye (fuera de alcance del MVP): pasarela de pago, facturación fiscal,
  contabilidad legal, logística aduanera oficial, exportación PDF (mejora
  secundaria), gestión multi-miembro con invitaciones por UI.

## Amenazas principales y mitigaciones

| Amenaza | Mitigación |
|---|---|
| **IDOR/BOLA** entre vendedores | `workspace_id` resuelto en servidor desde `workspace_members`; RLS en todas las tablas privadas; pruebas automatizadas de permitido/denegado |
| Fuga de datos estratégicos al público | Proyección `catalog_listings` con solo campos autorizados; el rol `anon` no tiene permiso sobre `products`; RPC security definer para solicitudes |
| Duplicación de stock por reintentos | Restricción única `(product_id, type, ref_type, ref_id)` + `ON CONFLICT DO NOTHING` en recepción/anulación |
| Condiciones de carrera en stock | Mutaciones dentro de funciones PL/pgSQL (transacción), `SELECT … FOR UPDATE`, descuento atómico `UPDATE … WHERE stock >= qty` |
| Fuerza bruta en login / spam de solicitudes | Rate limiting en memoria (documentado cómo escalarlo); mensajes genéricos |
| XSS | React escapa por defecto; CSP sin `unsafe-inline` en scripts salvo el requerido por Next en dev; Zod limita longitudes |
| CSRF | Server Actions con cookies `SameSite=Lax` (defecto Supabase SSR); sin endpoints GET mutadores |
| Exposición de `service_role` | Solo en script de seed de servidor; `.env*` ignorado; jamás en el bundle |
| Errores que revelan internals | Traducción de errores RPC a mensajes genéricos en español |

## Decisiones de arquitectura

1. **Proyección pública desacoplada (`catalog_listings`)** en lugar de una
   vista con columnas filtradas: separación física, control total del contrato
   público y sincronización por trigger/función al publicar o cambiar datos
   públicos o stock.
2. **Funciones de base de datos para mutaciones críticas**: atomicidad real
   (una transacción), idempotencia y cumplimiento de RLS sin abrir políticas
   de escritura directas a tablas sensibles.
3. **Snapshots financieros en `sale_items`** (`unit_price`,
   `base_cost_snapshot`, `landed_cost_snapshot`): los reportes históricos son
   inmunes a cambios de costos/precios posteriores.
4. **Dinero entero en centavos** en la capa TS y `numeric(14,2)` en SQL; la
   conversión ocurre solo en los bordes. `landed_unit_cost` es columna
   generada en PostgreSQL (fuente única de verdad).
5. **Server Components para lectura** y Client Components solo donde hay
   interacción (carrito, formularios, gráficos, tablas con filtro).
6. **Rate limiting con estrategia reemplazable**: implementación en memoria
   tras la interfaz `consume()`; en producción se cambia el backend sin tocar
   las acciones.
7. **Historial inmutable**: `inventory_movements` sin políticas de escritura
   para usuarios; las anulaciones crean `REVERSO`, nunca `DELETE`.

## Limitaciones conocidas

- Sin pasarela de pago ni facturación (por alcance).
- Rate limiting en memoria no es válido para múltiples instancias (ver README).
- El seed de usuarios en remoto requiere `service_role` o SQL directo (Admin API).
- La asignación de costos indirectos es manual por producto.
- Reportes limitados a ventas confirmadas; no proyectan flujo de caja.
- Las pruebas E2E requieren Supabase local (Docker) o un proyecto remoto.
