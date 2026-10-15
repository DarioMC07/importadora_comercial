import { test, expect } from "@playwright/test";

/**
 * E2E: marketplace público y división del carrito por vendedor.
 */

test.describe("Marketplace público", () => {
  test("el visitante navega el catálogo sin datos internos", async ({ page }) => {
    await page.goto("/catalogo");
    await expect(page.getByRole("heading", { name: "Catálogo" })).toBeVisible();
    // La vista pública nunca muestra costos ni stock exacto.
    await expect(page.getByText(/costo/i)).toHaveCount(0);
    await expect(page.getByText(/stock exacto|\b\d+ unidades en almacén\b/i)).toHaveCount(0);
  });

  test("ficha pública muestra precio, vendedor y disponibilidad general", async ({ page }) => {
    await page.goto("/catalogo");
    await page.getByRole("link").filter({ hasText: "Auriculares Bluetooth" }).first().click();
    await expect(page.getByText("Andes Import")).toBeVisible();
    await expect(page.getByText(/Bs/)).toBeVisible();
    await expect(page.getByText(/Disponible|Pocas unidades|Agotado/)).toBeVisible();
    await expect(page.getByText(/proveedor|Shenzhen/i)).toHaveCount(0);
  });

  test("el carrito con dos vendedores genera dos solicitudes", async ({ page }) => {
    await page.goto("/catalogo");

    // Producto del vendedor 1
    await page.getByRole("link").filter({ hasText: "Auriculares Bluetooth" }).first().click();
    await page.getByRole("button", { name: "Agregar al carrito" }).click();

    // Producto del vendedor 2
    await page.goto("/catalogo");
    await page.getByRole("link").filter({ hasText: "Lámpara LED" }).first().click();
    await page.getByRole("button", { name: "Agregar al carrito" }).click();

    await page.goto("/carrito");
    await expect(page.getByText("Andes Import")).toBeVisible();
    await expect(page.getByText("Paceña Home")).toBeVisible();
    await expect(page.getByText("2 solicitudes")).toBeVisible();

    await page.getByLabel("Nombre completo *").fill("Cliente E2E");
    await page.getByLabel("Teléfono / celular *").fill("70000001");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Enviar solicitud de compra" }).click();

    await expect(page).toHaveURL(/\/solicitud\/confirmacion\//);
    // Dos códigos públicos no secuenciales (uno por vendedor).
    const codigos = page.locator("ul[aria-label='Códigos de solicitud'] li");
    await expect(codigos).toHaveCount(2);
    const textos = await codigos.allTextContents();
    expect(textos[0]).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(textos[1]).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(textos[0]).not.toBe(textos[1]);
  });
});
