import { test, expect } from "@playwright/test";

/**
 * E2E: flujo vertical completo del vendedor.
 * iniciar sesión → recibir importación → subir stock → publicar → vender → descontar stock.
 */

async function loginVendedor1(page: import("@playwright/test").Page) {
  await page.goto("/ingresar");
  await page.getByLabel("Correo electrónico").fill("vendedor1@demo.importhub.test");
  await page.getByLabel("Contraseña").fill("Demo-2026!");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Flujo vertical del vendedor", () => {
  test("recibir importación incrementa el stock una sola vez", async ({ page }) => {
    await loginVendedor1(page);
    await page.goto("/dashboard/inventario");
    const fila = page.getByRole("row", { name: /Cable USB-C reforzado/ });
    const stockAntes = await fila.locator("td").nth(2).innerText();

    await page.goto("/dashboard/importaciones");
    const tarjeta = page.locator("article", { hasText: "IMP-2026-002" });
    page.once("dialog", (d) => d.accept());
    await tarjeta.getByRole("button", { name: "Recibir" }).click();

    // Repetir la acción no duplica el stock (idempotencia del RPC).
    await page.reload();
    const tarjeta2 = page.locator("article", { hasText: "IMP-2026-002" });
    await expect(tarjeta2.getByText("RECIBIDO")).toBeVisible();

    await page.goto("/dashboard/inventario");
    const stockDespues = await page
      .getByRole("row", { name: /Cable USB-C reforzado/ })
      .locator("td")
      .nth(2)
      .innerText();
    const antes = parseInt(stockAntes, 10);
    const despues = parseInt(stockDespues, 10);
    expect(despues).toBe(antes + 200); // 200 unidades del ítem del seed
  });

  test("publicar y despublicar cambia el catálogo público", async ({ page }) => {
    await loginVendedor1(page);
    await page.goto("/dashboard/productos");
    const fila = page.getByRole("row", { name: /Bocina portátil BassGo/ });
    page.once("dialog", (d) => d.accept());
    await fila.getByRole("button", { name: "Publicar" }).click();
    await page.reload();
    await expect(
      page.getByRole("row", { name: /Bocina portátil BassGo/ }).getByText("Publicado"),
    ).toBeVisible();

    // Aparece en el marketplace público.
    await page.goto("/catalogo?q=BassGo");
    await expect(page.getByText("Bocina portátil BassGo")).toBeVisible();

    // Despublicar: desaparece del catálogo sin borrar el producto.
    await page.goto("/dashboard/productos");
    page.once("dialog", (d) => d.accept());
    await page.getByRole("row", { name: /Bocina portátil BassGo/ })
      .getByRole("button", { name: "Despublicar" })
      .click();
    await page.reload();
    await expect(
      page.getByRole("row", { name: /Bocina portátil BassGo/ }).getByText("Borrador"),
    ).toBeVisible();
    await page.goto("/catalogo?q=BassGo");
    await expect(page.getByText("Bocina portátil BassGo")).toHaveCount(0);
  });

  test("venta confirmada descuenta stock y la anulación lo repone", async ({ page }) => {
    await loginVendedor1(page);
    await page.goto("/dashboard/inventario");
    const leerStock = async () =>
      parseInt(
        await page.getByRole("row", { name: /Auriculares Bluetooth/ }).locator("td").nth(2).innerText(),
        10,
      );
    const stockInicial = await leerStock();

    // Crear y confirmar una venta de 2 unidades.
    await page.goto("/dashboard/ventas");
    await page.getByRole("button", { name: "+ Registrar venta" }).click();
    await page.locator("select").nth(2).selectOption({ label: /AUR-BT-01/ });
    await page.getByRole("button", { name: "Guardar y confirmar" }).click();
    await page.reload();

    await page.goto("/dashboard/inventario");
    expect(await leerStock()).toBe(stockInicial - 2);

    // Anular la venta: reverso que repone el stock.
    await page.goto("/dashboard/ventas");
    const ventaNueva = page.locator("article").first();
    page.once("dialog", (d) => d.accept());
    await ventaNueva.getByRole("button", { name: "Anular" }).click();
    await page.reload();

    await page.goto("/dashboard/inventario");
    expect(await leerStock()).toBe(stockInicial);
    await expect(page.getByText("Reverso").first()).toBeVisible();
  });

  test("rechaza confirmar una venta con cantidad mayor al stock", async ({ page }) => {
    await loginVendedor1(page);
    await page.goto("/dashboard/ventas");
    await page.getByRole("button", { name: "+ Registrar venta" }).click();
    await page.locator("select").nth(2).selectOption({ label: /SMW-02/ }); // stock 4
    await page.locator("input[type='number']").fill("999");
    await page.getByRole("button", { name: "Guardar y confirmar" }).click();
    await expect(page.getByRole("alert")).toContainText(/Stock insuficiente/i);
  });
});
