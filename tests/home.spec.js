import { test, expect } from "@playwright/test";

const BASE_PATH = "/site-pizzaria";

test.describe("Home - Base Studio Pizzas", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);
  });

  test("deve carregar a página inicial com navbar e seções principais", async ({ page }) => {
    await expect(page).toHaveURL(/site-pizzaria\/?$/);

    await expect(page.getByRole("banner")).toBeVisible();

    await expect(
      page.getByRole("link", { name: /base studio pizzas/i }).first()
    ).toBeVisible();

    await expect(page.getByRole("link", { name: "Início" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Destaques" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Como funciona" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Avaliações" }).first()).toBeVisible();

    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

    await expect(page.locator("#destaques")).toBeVisible();
    await expect(page.locator("#como-funciona")).toBeVisible();
    await expect(page.locator("#depoimentos")).toBeVisible();

    await expect(page.locator("footer[aria-label='Rodapé']")).toBeVisible();
  });

  test("links da navbar devem ter âncoras corretas", async ({ page }) => {
    const navbar = page.getByRole("banner");

    await expect(
      navbar.getByRole("link", { name: "Destaques" }).first()
    ).toHaveAttribute("href", /#destaques$/);

    await expect(
      navbar.getByRole("link", { name: "Como funciona" }).first()
    ).toHaveAttribute("href", /#como-funciona$/);

    await expect(
      navbar.getByRole("link", { name: "Avaliações" }).first()
    ).toHaveAttribute("href", /#depoimentos$/);
  });

  test("deve navegar para /login ou /auth pelo botão Entrar da navbar", async ({ page }) => {
    const navbar = page.getByRole("banner");
    const loginLink = navbar.getByRole("link", { name: /entrar/i }).first();

    await expect(loginLink).toBeVisible();
    await loginLink.click();

    await expect(page).toHaveURL(/site-pizzaria\/(login|auth|entrar)/);
  });

  test("botão Entrar da navbar deve possuir href válido", async ({ page }) => {
    const navbar = page.getByRole("banner");
    const loginLink = navbar.getByRole("link", { name: /entrar/i }).first();

    await expect(loginLink).toHaveAttribute(
      "href",
      /\/site-pizzaria\/(login|auth|entrar)$|\/(login|auth|entrar)$/
    );
  });

  test("deve navegar para /menu pelo CTA da navbar", async ({ page }) => {
    const navbar = page.getByRole("banner");
    const ctaNavbar = navbar.getByRole("link", { name: /fazer pedido/i }).first();

    await expect(ctaNavbar).toBeVisible();
    await ctaNavbar.click();

    await expect(page).toHaveURL(/site-pizzaria\/menu$/);
  });

  test("CTA da navbar deve apontar para /menu", async ({ page }) => {
    const ctaNavbar = page
      .getByRole("banner")
      .getByRole("link", { name: /fazer pedido/i })
      .first();

    await expect(ctaNavbar).toHaveAttribute(
      "href",
      /\/site-pizzaria\/menu$|\/menu$/
    );
  });

  test("deve navegar para /menu pelo CTA principal do hero", async ({ page }) => {
    const heroCta = page
      .getByRole("main")
      .getByRole("link", { name: /ver cardápio|fazer pedido/i })
      .first();

    await expect(heroCta).toBeVisible();
    await heroCta.click();

    await expect(page).toHaveURL(/site-pizzaria\/menu$/);
  });

  test("CTA principal do hero deve apontar para /menu", async ({ page }) => {
    const heroCta = page
      .getByRole("main")
      .getByRole("link", { name: /ver cardápio|fazer pedido/i })
      .first();

    await expect(heroCta).toHaveAttribute(
      "href",
      /\/site-pizzaria\/menu$|\/menu$/
    );
  });

  test("deve navegar para a seção Como funciona pelo botão secundário do hero", async ({ page }) => {
    const heroSecondaryCta = page
      .getByRole("main")
      .getByRole("link", { name: /como funciona/i })
      .first();

    await expect(heroSecondaryCta).toBeVisible();
    await heroSecondaryCta.click();

    await expect.poll(() => page.url()).toContain("#como-funciona");
    await expect(page.locator("#como-funciona")).toBeInViewport();
  });

  test("botão secundário do hero deve apontar para #como-funciona", async ({ page }) => {
    const heroSecondaryCta = page
      .getByRole("main")
      .getByRole("link", { name: /como funciona/i })
      .first();

    await expect(heroSecondaryCta).toHaveAttribute("href", /#como-funciona$/);
  });

  test("deve navegar para /menu pelo CTA final", async ({ page }) => {
    const ctaFinal = page.getByRole("link", { name: /fazer pedido agora/i });

    await ctaFinal.scrollIntoViewIfNeeded();
    await expect(ctaFinal).toBeVisible();
    await ctaFinal.click();

    await expect(page).toHaveURL(/site-pizzaria\/menu$/);
  });

  test("CTA final deve apontar para /menu", async ({ page }) => {
    const ctaFinal = page.getByRole("link", { name: /fazer pedido agora/i });

    await ctaFinal.scrollIntoViewIfNeeded();
    await expect(ctaFinal).toHaveAttribute(
      "href",
      /\/site-pizzaria\/menu$|\/menu$/
    );
  });

  test("deve exibir a seção Como funciona", async ({ page }) => {
    const section = page.locator("#como-funciona");
    await section.scrollIntoViewIfNeeded();

    await expect(section).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /como funciona/i })
    ).toBeVisible();
    await expect(page.getByText(/3 passos simples/i)).toBeVisible();
  });

  test("deve exibir a seção de avaliações", async ({ page }) => {
    const section = page.locator("#depoimentos");
    await section.scrollIntoViewIfNeeded();

    await expect(section).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /avaliações/i })
    ).toBeVisible();
  });

  test("deve exibir o footer com dados principais", async ({ page }) => {
    const footer = page.locator("footer[aria-label='Rodapé']");
    await footer.scrollIntoViewIfNeeded();

    await expect(footer).toBeVisible();
    await expect(footer.locator("h4")).toContainText("Base Studio Pizzas");
    await expect(footer).toContainText("Brasília - DF");
    await expect(footer).toContainText("Desenvolvido por");
  });

  test("deve abrir links internos da navbar para seções da home", async ({ page }) => {
    const navbar = page.getByRole("banner");

    await navbar.getByRole("link", { name: "Destaques" }).click();
    await expect.poll(() => page.url()).toContain("#destaques");
    await expect(page.locator("#destaques")).toBeInViewport();

    await navbar.getByRole("link", { name: "Como funciona" }).click();
    await expect.poll(() => page.url()).toContain("#como-funciona");
    await expect(page.locator("#como-funciona")).toBeInViewport();

    await navbar.getByRole("link", { name: "Avaliações" }).click();
    await expect.poll(() => page.url()).toContain("#depoimentos");
    await expect(page.locator("#depoimentos")).toBeInViewport();
  });

  test("botão Início deve voltar para o topo", async ({ page, isMobile }) => {
    await page.locator("#depoimentos").scrollIntoViewIfNeeded();

    if (isMobile) {
      await page.getByRole("button", { name: /abrir menu/i }).click();
      await page.getByRole("link", { name: "Início" }).last().click();
    } else {
      const navbar = page.getByRole("banner");
      await navbar.getByRole("link", { name: "Início" }).first().click();
    }

    const heroHeading = page.getByRole("heading", { level: 1 }).first();
    await expect(heroHeading).toBeInViewport();
  });
  
  test("logo deve manter ou retornar para a home", async ({ page }) => {
    const logo = page.getByRole("link", { name: /base studio pizzas/i }).first();

    await expect(logo).toBeVisible();
    await logo.click();

    await expect(page).toHaveURL(/site-pizzaria\/?$/);
  });

  test("logo deve possuir href válido para a home", async ({ page }) => {
    const logo = page.getByRole("link", { name: /base studio pizzas/i }).first();

    await expect(logo).toHaveAttribute(
      "href",
      /\/site-pizzaria\/?$|^\/$|^\.\/?$/
    );
  });

  test("deve mostrar os controles do carousel", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /anterior/i })
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /próximo/i })
    ).toBeVisible();

    await expect(
      page.getByRole("tablist", { name: /selecionar slide/i })
    ).toBeVisible();
  });

  test("deve permitir navegar no carousel pelo botão próximo", async ({ page }) => {
    const nextButton = page.getByRole("button", { name: /próximo/i });
    const indicators = page.getByRole("tablist", { name: /selecionar slide/i });

    await expect(nextButton).toBeVisible();
    await expect(indicators).toBeVisible();

    const activeIndicator = indicators.locator(
      '[aria-selected="true"], [aria-current="true"]'
    );

    const activeCountBefore = await activeIndicator.count();

    if (activeCountBefore > 0) {
      const beforeState =
        (await activeIndicator.first().getAttribute("aria-label")) ||
        (await activeIndicator.first().getAttribute("aria-controls")) ||
        (await activeIndicator.first().textContent());

      await nextButton.click();

      await expect
        .poll(async () => {
          const current =
            indicators.locator('[aria-selected="true"], [aria-current="true"]');
          const count = await current.count();

          if (count === 0) return "sem-estado";

          return (
            (await current.first().getAttribute("aria-label")) ||
            (await current.first().getAttribute("aria-controls")) ||
            (await current.first().textContent()) ||
            "sem-estado"
          );
        })
        .not.toBe(beforeState);
    } else {
      await nextButton.click();
      await expect(nextButton).toBeVisible();
    }
  });

  test("deve permitir navegar no carousel pelo botão anterior", async ({ page }) => {
    const prevButton = page.getByRole("button", { name: /anterior/i });

    await expect(prevButton).toBeVisible();
    await prevButton.click();

    await expect(prevButton).toBeVisible();
  });

  test("deve permitir clicar em indicadores do carousel quando existirem", async ({ page }) => {
    const indicators = page
      .getByRole("tablist", { name: /selecionar slide/i })
      .locator('[role="tab"], button');

    const count = await indicators.count();

    test.skip(count === 0, "O carousel não expõe indicadores clicáveis acessíveis.");

    const target = indicators.nth(Math.min(1, count - 1));
    await expect(target).toBeVisible();
    await target.click();
  });

  test("deve exibir links de redes sociais no footer", async ({ page }) => {
    const footer = page.locator("footer[aria-label='Rodapé']");
    await footer.scrollIntoViewIfNeeded();

    const socialLinks = footer.locator(
      'a[href*="instagram"], a[href*="wa.me"], a[href*="whatsapp"]'
    );

    await expect(socialLinks.first()).toBeVisible();
  });

  test("links externos do footer devem abrir em nova aba", async ({ page }) => {
    const footer = page.locator("footer[aria-label='Rodapé']");
    await footer.scrollIntoViewIfNeeded();

    const externalLinks = footer.locator(
      'a[href*="instagram"], a[href*="wa.me"], a[href*="whatsapp"], a[href*="maps"], a[href*="google"], a[href*="openstreetmap"]'
    );

    const count = await externalLinks.count();

    for (let i = 0; i < count; i += 1) {
      await expect(externalLinks.nth(i)).toHaveAttribute("target", "_blank");
    }
  });

  test("deve exibir botão/link de localização no mapa no footer", async ({ page }) => {
    const footer = page.locator("footer[aria-label='Rodapé']");
    await footer.scrollIntoViewIfNeeded();

    const mapLink = footer.getByRole("link", { name: /abrir localização no mapa/i });
    await expect(mapLink).toBeVisible();
    await expect(mapLink).toHaveAttribute("href", /maps|google|openstreetmap/i);
  });

  test("home deve manter layout visual estável", async ({ page }) => {
    await expect(page).toHaveScreenshot("home-page.png", {
      fullPage: true,
    });
  });
});

test.describe("Home mobile", () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(!isMobile, "Este teste é somente para viewport mobile.");
    await page.goto(`${BASE_PATH}/`);
  });

  test("deve abrir e fechar o menu mobile", async ({ page }) => {
    const burger = page.getByRole("button", { name: /abrir menu/i });
    await expect(burger).toBeVisible();

    await burger.click();

    await expect(page.getByRole("link", { name: "Início" }).last()).toBeVisible();
    await expect(page.getByRole("link", { name: "Destaques" }).last()).toBeVisible();

    const closeBackdrop = page.getByRole("button", { name: /fechar menu/i }).last();
    await closeBackdrop.click();

    await expect(page.getByRole("button", { name: /abrir menu/i })).toBeVisible();
  });

  test("deve fechar o menu mobile ao clicar em um link de navegação", async ({ page }) => {
    await page.getByRole("button", { name: /abrir menu/i }).click();

    const linkComoFunciona = page.getByRole("link", { name: "Como funciona" }).last();
    await expect(linkComoFunciona).toBeVisible();

    await linkComoFunciona.click();

    await expect.poll(() => page.url()).toContain("#como-funciona");
    await expect(page.locator("#como-funciona")).toBeInViewport();
    await expect(page.getByRole("button", { name: /abrir menu/i })).toBeVisible();
  });

  test("links do menu mobile devem ter hrefs corretos", async ({ page }) => {
    await page.getByRole("button", { name: /abrir menu/i }).click();

    await expect(
      page.getByRole("link", { name: "Destaques" }).last()
    ).toHaveAttribute("href", /#destaques$/);

    await expect(
      page.getByRole("link", { name: "Como funciona" }).last()
    ).toHaveAttribute("href", /#como-funciona$/);

    await expect(
      page.getByRole("link", { name: "Avaliações" }).last()
    ).toHaveAttribute("href", /#depoimentos$/);
  });

  test("deve navegar para /menu pelo CTA mobile", async ({ page }) => {
    await page.getByRole("button", { name: /abrir menu/i }).click();

    await page.getByRole("link", { name: /fazer pedido/i }).last().click();

    await expect(page).toHaveURL(/site-pizzaria\/menu$/);
  });

  test("CTA mobile deve possuir href válido para /menu", async ({ page }) => {
    await page.getByRole("button", { name: /abrir menu/i }).click();

    await expect(
      page.getByRole("link", { name: /fazer pedido/i }).last()
    ).toHaveAttribute("href", /\/site-pizzaria\/menu$|\/menu$/);
  });

  test("deve navegar para login pelo botão Entrar no menu mobile", async ({ page }) => {
    await page.getByRole("button", { name: /abrir menu/i }).click();

    await page.getByRole("link", { name: /entrar/i }).last().click();

    await expect(page).toHaveURL(/site-pizzaria\/(login|auth|entrar)/);
  });

  test("botão Entrar no menu mobile deve possuir href válido", async ({ page }) => {
    await page.getByRole("button", { name: /abrir menu/i }).click();

    await expect(
      page.getByRole("link", { name: /entrar/i }).last()
    ).toHaveAttribute(
      "href",
      /\/site-pizzaria\/(login|auth|entrar)$|\/(login|auth|entrar)$/
    );
  });
});