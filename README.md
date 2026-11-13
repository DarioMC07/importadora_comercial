# Importadora Comercial — ImportHub

Marketplace multi-vendedor para pequeños importadores (Next.js 15 + Supabase).

## Estructura

| Ruta | Contenido |
|------|-----------|
| `import-marketplace/` | Aplicación web (código, migraciones Supabase, tests). Ver su [README](import-marketplace/README.md) |
| `docs/` | Decisiones de diseño (`DECISIONES.md`) y perfil Aveli (`AVELI.md`) |
| `docker-compose.yml` | Levanta la app web (Supabase corre aparte, ver README de la app) |

## Ramas

- `main`: estable.
- `develop`: integración. Las ramas de trabajo salen de `develop` y vuelven por PR.
