import { test, expect } from "@playwright/test";

/**
 * E2E: aislamiento multiempresa.
 * El vendedor 1 jamás accede a recursos del vendedor 2, ni por URL ni por UUID.
 */

const CLIENTE_VENDEDOR_2 = "66666666-0000-4000-8000-000000000004";

async function loginVendedor1(page: import("@playwright/test").Page) {
  await page.goto("/ingresar");
  await page.getByLabel("Correo electrónico").fill("vendedor1@demo.importhub.test");
  await page.getByLabel("Contraseña").fill("Demo-2026!");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Aislamiento entre vendedores", () => {
  test("acceder por URL a un cliente ajeno devuelve 404", async ({ page }) => {
    await loginVendedor1(page);
    await page.goto(`/dashboard/clientes/${CLIENTE_VENDEDOR_2}`);
    await expect(page.getByText("Página no encontrada")).toBeVisible();
  });

  test("las listas del panel no muestran datos del otro vendedor", async ({ page }) => {
    await loginVendedor1(page);
    await page.goto("/dashboard/clientes");
    // "Verónica Siles" es cliente del vendedor 2 (Paceña Home).
    await expect(page.getByText("Verónica Siles")).toHaveCount(0);
    await page.goto("/dashboard/ventas");
    await expect(page.getByText("V-20260712-0001")).toHaveCount(0); // venta del vendedor 2
    await page.goto("/dashboard/productos");
    await expect(page.getByText("Lámpara LED de escritorio Lumina")).toHaveCount(0);
  });

  test("no existe selector para cambiar a un espacio ajeno", async ({ page }) => {
    await loginVendedor1(page);
    await expect(page.getByText("Paceña Home")).toHaveCount(0);
    await expect(page.getByText("Andes Import").first()).toBeVisible();
  });
});
