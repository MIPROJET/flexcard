import { expect, test } from "@playwright/test";

const png1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: async () => ({ getTracks: () => [] }) },
    });
    class Utterance {
      text: string;
      lang = "fr-FR";
      rate = 1;
      pitch = 1;
      volume = 1;
      constructor(text: string) { this.text = text; }
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: Utterance });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: { cancel: () => undefined, speak: () => undefined },
    });
  });
  await page.route("**/rest/v1/rpc/create_vocal_profile", async (route) => {
    await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "E2E fallback" }) });
  });
  await page.route("**/storage/v1/object/**", async (route) => {
    await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "E2E upload fallback" }) });
  });
});

test("création de carte par vocal avec validations, journal et rendu final", async ({ page }) => {
  const consoleLines: string[] = [];
  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("[FlexCard Vocal]")) consoleLines.push(text);
  });

  await page.goto("/");
  await page.locator("button").filter({ hasText: "Parler maintenant" }).first().click();

  await expect(page).toHaveURL(/\/onboarding\/vocal/);
  await expect(page.getByRole("heading", { name: "Choisissez votre langue" })).toBeVisible();

  await page.getByRole("button", { name: /Français/ }).click();
  await expect(page.getByRole("heading", { name: /Création vocale/ })).toBeVisible();
  await page.getByRole("button", { name: /Commencer/ }).click();

  await expect(page.getByRole("heading", { name: "Bienvenue" })).toBeVisible();
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(page.getByRole("heading", { name: "Code parrain" })).toBeVisible();
  await page.getByRole("button", { name: /Continuer/ }).click();

  await expect(page.getByRole("heading", { name: "Identité" })).toBeVisible();
  await page.getByPlaceholder("Votre réponse…").fill("");
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(page.getByRole("alert")).toContainText("Je n'ai pas entendu votre nom");
  await page.getByPlaceholder("Votre réponse…").fill("Awa Traore");
  await page.getByRole("button", { name: /Continuer/ }).click();

  await expect(page.getByRole("heading", { name: "Téléphone principal" })).toBeVisible();
  await page.getByPlaceholder("Votre réponse…").fill("0701020304");
  await page.getByRole("button", { name: /Continuer/ }).click();

  await expect(page.getByRole("heading", { name: "Second numéro" })).toBeVisible();
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(page.getByRole("heading", { name: "Troisième numéro" })).toBeVisible();
  await page.getByRole("button", { name: /Continuer/ }).click();

  await expect(page.getByRole("heading", { name: "Votre activité" })).toBeVisible();
  await page.getByPlaceholder("Votre réponse…").fill("Couturière");
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(page.getByRole("heading", { name: "Localisation" })).toBeVisible();
  await page.getByPlaceholder("Votre réponse…").fill("Abobo");
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(page.getByRole("heading", { name: "WhatsApp" })).toBeVisible();
  await page.getByPlaceholder("Votre réponse…").fill("0701020304");
  await page.getByRole("button", { name: /Continuer/ }).click();

  await expect(page.getByRole("heading", { name: "Vérification" })).toBeVisible();
  await expect(page.getByText("Awa Traore").first()).toBeVisible();
  await page.getByRole("button", { name: /Continuer/ }).click();

  await expect(page.getByRole("heading", { name: "Photo de profil" })).toBeVisible();
  await page.locator('input[type="file"]').first().setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: png1x1 });
  await expect(page.getByRole("heading", { name: "Photo du lieu" })).toBeVisible();
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(page.getByRole("heading", { name: /Galerie/ })).toBeVisible();
  await page.getByRole("button", { name: /Continuer/ }).click();

  await expect(page.getByRole("heading", { name: "C'est terminé !" })).toBeVisible();
  await expect(page.getByTestId("vocal-execution-log")).toContainText("Étape 14/14");
  await page.getByRole("button", { name: /Activer ma carte FlexCard/ }).click();

  await expect(page).toHaveURL(/\/c\/awa-traore-0304/);
  await expect(page.getByText("Awa Traore").first()).toBeVisible();
  await expect(page.getByText("Couturière").first()).toBeVisible();
  expect(consoleLines.some((line) => line.includes("navigation"))).toBeTruthy();
  expect(consoleLines.some((line) => line.includes("Étape"))).toBeTruthy();
});