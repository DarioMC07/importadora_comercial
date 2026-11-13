import { test, expect } from "@playwright/test";

/**
 * E2E: autenticación.
 * Requiere la app corriendo + Supabase con seed (ver README).
 */

test.describe("Autenticación", () => {
  test("un visitante es redirigido a /ingresar al abrir /dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/ingresar/);
  });

  test("rechaza credenciales incorrectas con mensaje genérico", async ({ page }) => {
    await page.goto("/ingresar");
    await page.getByLabel("Correo electrónico").fill("vendedor1@demo.importhub.test");
    await page.getByLabel("Contraseña").fill("contrasena-incorrecta");
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page.getByRole("alert")).toContainText("Credenciales incorrectas");
  });

  test("el vendedor inicia sesión y entra a su panel", async ({ page }) => {
    await page.goto("/ingresar");
    await page.getByLabel("Correo electrónico").fill("vendedor1@demo.importhub.test");
    await page.getByLabel("Contraseña").fill("Demo-2026!");
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Andes Import")).toBeVisible();
  });

  test("cerrar sesión devuelve al marketplace", async ({ page }) => {
    await page.goto("/ingresar");
    await page.getByLabel("Correo electrónico").fill("vendedor1@demo.importhub.test");
    await page.getByLabel("Contraseña").fill("Demo-2026!");
    await page.getByRole("button", { name: "Ingresar" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL("/");
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/ingresar/);
  });
});
