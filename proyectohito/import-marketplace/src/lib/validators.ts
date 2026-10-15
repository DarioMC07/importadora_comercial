import { z } from "zod";

/**
 * Validación compartida cliente/servidor con Zod.
 * Los mensajes están en español y los esquemas rechazan campos inesperados
 * (.strict()) como defensa adicional.
 */

export const uuidSchema = z.string().uuid("Identificador inválido");

export const montoSchema = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).replace(",", ".").trim())
  .pipe(z.string().regex(/^\d+(\.\d{1,2})?$/, "Monto inválido (máx. 2 decimales)"));

export const cantidadSchema = z
  .number({ message: "Cantidad inválida" })
  .int("Debe ser un número entero")
  .positive("Debe ser mayor a cero")
  .max(999, "Cantidad demasiado grande");

// --- Autenticación ----------------------------------------------------------
export const loginSchema = z
  .object({
    email: z.string().email("Ingresa un correo válido").max(160),
    password: z.string().min(8, "Mínimo 8 caracteres").max(72),
  })
  .strict();

export const recuperacionSchema = z
  .object({ email: z.string().email("Ingresa un correo válido").max(160) })
  .strict();

// --- Proveedores -------------------------------------------------------------
export const proveedorSchema = z
  .object({
    code: z.string().trim().min(1, "Código requerido").max(40),
    name: z.string().trim().min(2, "Nombre requerido").max(160),
    email: z.string().email("Correo inválido").max(160).optional().or(z.literal("")),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    country: z.string().trim().min(2, "País requerido").max(80),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
    active: z.boolean().default(true),
  })
  .strict();

// --- Productos ---------------------------------------------------------------
export const productoSchema = z
  .object({
    sku: z.string().trim().min(1, "SKU requerido").max(60),
    name: z.string().trim().min(2, "Nombre requerido").max(160),
    description: z.string().trim().max(4000).optional().or(z.literal("")),
    category: z.string().trim().min(1, "Categoría requerida").max(80),
    image_url: z.string().max(1000).refine(v => !v || /^\/aveli\/[\w-]+\.png$/.test(v) || /^https?:\/\//.test(v), "URL de imagen inválida").optional(),
    sizes: z.string().trim().max(200).optional(),
    colors: z.string().trim().max(500).optional(),
    catalog_availability: z.enum(["Disponible", "Agotado", "Consultar disponibilidad"]).optional(),
    base_cost: montoSchema,
    sale_price: montoSchema,
    freight_alloc: montoSchema,
    duty_alloc: montoSchema,
    other_alloc: montoSchema,
    dim_length: z.string().optional().or(z.literal("")),
    dim_width: z.string().optional().or(z.literal("")),
    dim_height: z.string().optional().or(z.literal("")),
    dim_unit: z.enum(["cm", "m", "in"]).default("cm"),
    weight_kg: z.string().optional().or(z.literal("")),
    min_stock: z.number().int().min(0, "No puede ser negativo").max(100000),
    unit: z.string().trim().min(1).max(20).default("unidad"),
    origin_country: z.string().trim().max(80).optional().or(z.literal("")),
    origin_public: z.boolean().default(false),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
    active: z.boolean().default(true),
  })
  .strict();

// --- Importaciones -----------------------------------------------------------
export const importItemSchema = z
  .object({
    product_id: uuidSchema,
    quantity: cantidadSchema,
    unit_cost: montoSchema,
  })
  .strict();

export const importacionSchema = z
  .object({
    supplier_id: uuidSchema,
    code: z.string().trim().min(1, "Código requerido").max(40),
    origin_country: z.string().trim().min(2).max(80),
    ordered_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
    eta_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
    currency: z.string().length(3).default("USD"),
    fx_rate: z.string().optional().or(z.literal("")),
    freight_cost: montoSchema,
    duties_cost: montoSchema,
    other_costs: montoSchema,
    items: z.array(importItemSchema).min(1, "Agrega al menos un producto").max(200),
  })
  .strict();

// --- Clientes ----------------------------------------------------------------
export const clienteSchema = z
  .object({
    code: z.string().trim().min(1, "Código requerido").max(40),
    name: z.string().trim().min(2, "Nombre requerido").max(160),
    ci_nit: z.string().trim().max(30).optional().or(z.literal("")),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    email: z.string().email("Correo inválido").max(160).optional().or(z.literal("")),
    address: z.string().trim().max(300).optional().or(z.literal("")),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .strict();

// --- Ventas ------------------------------------------------------------------
export const ventaItemSchema = z
  .object({
    product_id: uuidSchema,
    quantity: cantidadSchema,
    unit_price: montoSchema.optional(),
  })
  .strict();

export const ventaSchema = z
  .object({
    customer_id: uuidSchema.optional().or(z.literal("")),
    request_id: uuidSchema.optional(),
    payment_method: z.enum(["EFECTIVO", "QR", "OTRO"]),
    discount: montoSchema,
    items: z.array(ventaItemSchema).min(1, "Agrega al menos un producto").max(200),
  })
  .strict();

export const ajusteInventarioSchema = z
  .object({
    product_id: uuidSchema,
    delta: z
      .number({ message: "Ajuste inválido" })
      .int("Debe ser entero")
      .min(-100000)
      .max(100000)
      .refine((n) => n !== 0, "El ajuste no puede ser cero"),
    reason: z.string().trim().min(3, "Describe el motivo (mín. 3 caracteres)").max(500),
  })
  .strict();

// --- Solicitud pública de compra ---------------------------------------------
export const solicitudPublicaSchema = z
  .object({
    customer: z
      .object({
        name: z.string().trim().min(2, "Nombre requerido").max(160),
        phone: z.string().trim().min(5, "Teléfono inválido").max(30),
        email: z.string().email("Correo inválido").max(160).optional().or(z.literal("")),
        consent: z.literal(true, { message: "Debes aceptar el aviso de privacidad" }),
      })
      .strict(),
    items: z
      .array(
        z.object({ product_id: uuidSchema, quantity: cantidadSchema }).strict(),
      )
      .min(1, "El carrito está vacío")
      .max(100),
  })
  .strict();

export const estadoSolicitudSchema = z
  .object({
    request_id: uuidSchema,
    status: z.enum(["NUEVA", "CONTACTADA", "CONFIRMADA", "RECHAZADA"]),
  })
  .strict();

// --- Catálogo público (filtros) ----------------------------------------------
export const filtroCatalogoSchema = z.object({
  q: z.string().trim().max(120).optional(),
  categoria: z.string().trim().max(80).optional(),
  vendedor: z.string().trim().max(60).optional(),
  min: z.coerce.number().min(0).optional(),
  max: z.coerce.number().min(0).optional(),
  disponibilidad: z.enum(["DISPONIBLE", "POCAS_UNIDADES", "AGOTADO"]).optional(),
  orden: z.enum(["relevancia", "precio_asc", "precio_desc", "novedades"]).default("relevancia"),
  pagina: z.coerce.number().int().min(1).default(1),
});

export type FiltroCatalogo = z.infer<typeof filtroCatalogoSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProveedorInput = z.infer<typeof proveedorSchema>;
export type ProductoInput = z.infer<typeof productoSchema>;
export type ImportacionInput = z.infer<typeof importacionSchema>;
export type ClienteInput = z.infer<typeof clienteSchema>;
export type VentaInput = z.infer<typeof ventaSchema>;
export type SolicitudPublicaInput = z.infer<typeof solicitudPublicaSchema>;
