# Panel privado AVÉLI

El tema se activa únicamente para la sesión cuyo `workspaceSlug` es `aveli`.
Los productos se consultan y guardan con el espacio resuelto en el servidor; las políticas RLS existentes siguen aplicándose.

## Catálogo inicial

`supabase/migrations/0006_aveli_catalog.sql` añade los campos de fotografía, tallas, colores y disponibilidad comercial e inserta las 20 prendas del PDF en el espacio AVÉLI existente. No reemplaza productos ni crea movimientos de inventario. Las muestras HEX son aproximaciones visuales: el documento no proporciona nombres oficiales de colores. La disponibilidad comercial es independiente del stock numérico.

Las imágenes extraídas están en `public/aveli/`. Para regenerarlas y regenerar la migración se necesita Python con `pymupdf` y los dos PDF originales en Descargas:

```sh
python scripts/import-aveli.py
```

La opción `--apply` aplica la migración al contenedor local `supabase_db_import-marketplace`. En otro entorno, aplicar la migración con el procedimiento habitual del proyecto. Requiere que el espacio `aveli` ya exista; si se crea después, ejecutar la inserción del catálogo nuevamente.

## Uso

En **Productos → Agregar producto** se pueden cargar fotos JPG/PNG/WebP de hasta 2 MB, registrar precio en BOB, tallas y colores separados por comas, y marcar disponibilidad. Las imágenes nuevas usan el bucket existente `product-images`. Se puede editar una prenda y desmarcar **Producto activo** para desactivarla.

## Verificación local

```sh
npm run typecheck
npm test
node scripts/verify-aveli.mjs
```

La prueba de navegador utiliza Microsoft Edge instalado y la cuenta demo AVÉLI; `AVELI_TEST_PASSWORD` permite indicar su contraseña. Verifica inicio de sesión, fotografías, filtros, creación, persistencia, edición y ancho móvil. Elimina exclusivamente la prenda temporal `TEST-AVELI-E2E` de ese espacio al finalizar.
