import { expect, test, type Page } from "@playwright/test";

async function setQueueCount(page: Page, queueCount: number) {
  const queueTrigger = page.getByRole("combobox", { name: "队列" });

  await queueTrigger.click();
  await page.getByRole("option").filter({ hasText: String(queueCount) }).first().click();
  await expect(page.locator("[data-canvas-root] [data-queue-row]")).toHaveCount(queueCount);
}

async function expectOperatorPortraitLayout(page: Page) {
  const boxes = await page.locator("[data-canvas-root] [data-portrait-frame]").evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      return {
        borderWidth: style.borderTopWidth,
        height: rect.height,
        width: rect.width,
      };
    }),
  );

  expect(boxes.length).toBeGreaterThan(0);

  for (const box of boxes) {
    expect(box.width).toBeGreaterThan(10);
    expect(box.height).toBeGreaterThan(10);
    expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(1.5);
    expect(box.borderWidth).toBe("0px");
  }

  const namePlacements = await page
    .locator("[data-canvas-root] [data-operator-tile]")
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const portrait = node.querySelector("[data-portrait-frame]");
        const name = node.querySelector("[data-slot-name]");
        const slotText = name?.parentElement;

        return {
          backgroundColor: slotText ? window.getComputedStyle(slotText).backgroundColor : "",
          hasPortrait: Boolean(portrait),
          hasName: Boolean(name),
          nameTop: name?.getBoundingClientRect().top ?? 0,
          portraitBottom: portrait?.getBoundingClientRect().bottom ?? 0,
        };
      }),
    );

  for (const placement of namePlacements) {
    expect(placement.hasPortrait).toBe(true);
    expect(placement.hasName).toBe(true);
    expect(placement.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(placement.nameTop).toBeGreaterThanOrEqual(placement.portraitBottom - 1);
  }
}

async function expectHeaderBlocksDoNotOverlap(page: Page) {
  const overlaps = await page.locator("[data-canvas-root] > header").evaluate((header) => {
    const rects = Array.from(header.children).map((child) => child.getBoundingClientRect());

    return rects.some((first, firstIndex) =>
      rects.some((second, secondIndex) => {
        if (firstIndex >= secondIndex) {
          return false;
        }

        const overlapX = Math.min(first.right, second.right) - Math.max(first.left, second.left);
        const overlapY = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top);

        return overlapX > 2 && overlapY > 2;
      }),
    );
  });

  expect(overlaps).toBe(false);
}

async function expectCompactCanvasInformation(page: Page) {
  const metrics = await page.locator("[data-canvas-root]").evaluate((canvas) => {
    const header = canvas.querySelector("header");
    const canvasRect = canvas.getBoundingClientRect();
    const canvasStyle = window.getComputedStyle(canvas);
    const headerRect = header?.getBoundingClientRect();
    const headerStyle = header ? window.getComputedStyle(header) : null;
    const headerSeparatorStyle = header ? window.getComputedStyle(header, "::after") : null;
    const rows = Array.from(canvas.querySelectorAll("[data-queue-row]"));
    const rowBorderWidths = rows.map((row) =>
      Number.parseFloat(window.getComputedStyle(row).borderBottomWidth || "0"),
    );
    const rowSeparatorHeights = rows.map((row) =>
      Number.parseFloat(window.getComputedStyle(row, "::after").height || "0"),
    );
    const queueBadges = rows.map((row) => {
      const rowRect = row.getBoundingClientRect();
      const badge = row.querySelector("[data-queue-index-badge]");
      const badgeRect = badge?.getBoundingClientRect();

      return {
        exists: Boolean(badge),
        leftOffset: badgeRect ? badgeRect.left - rowRect.left : 999,
        topOffset: badgeRect ? badgeRect.top - rowRect.top : 999,
      };
    });
    const facilityTitles = Array.from(canvas.querySelectorAll("[data-facility-title]")).map((title) => {
      const titleRect = title.getBoundingClientRect();
      const columnRect = title.closest("[data-facility-column]")?.getBoundingClientRect();

      return {
        centerOffset: columnRect
          ? Math.abs(titleRect.left + titleRect.width / 2 - (columnRect.left + columnRect.width / 2))
          : 999,
        exists: Boolean(columnRect),
        topOffset: columnRect ? titleRect.top - columnRect.top : 999,
      };
    });

    return {
      facilityTitles,
      canvasBorderTopWidth: Number.parseFloat(canvasStyle.borderTopWidth || "0"),
      canvasBoxShadow: canvasStyle.boxShadow,
      headerBorderBottomWidth: headerStyle
        ? Number.parseFloat(headerStyle.borderBottomWidth || "0")
        : 999,
      headerSeparatorHeight: headerSeparatorStyle
        ? Number.parseFloat(headerSeparatorStyle.height || "0")
        : 0,
      headerRatio: headerRect ? headerRect.height / canvasRect.height : 1,
      queueBadges,
      rowBorderWidths,
      rowSeparatorHeights,
      hasQueueDuration: canvas.textContent?.includes("早班") || canvas.textContent?.includes("晚班") || canvas.textContent?.includes("轮换 3"),
    };
  });

  expect(metrics.canvasBorderTopWidth).toBeLessThanOrEqual(0.8);
  expect(metrics.canvasBoxShadow).toContain("0.8px");
  expect(metrics.headerRatio).toBeLessThan(0.12);
  expect(metrics.headerBorderBottomWidth).toBeLessThanOrEqual(0.8);
  expect(metrics.headerSeparatorHeight).toBeGreaterThan(0);
  expect(metrics.headerSeparatorHeight).toBeLessThanOrEqual(0.81);
  for (const borderWidth of metrics.rowBorderWidths) {
    expect(borderWidth).toBeLessThanOrEqual(0.8);
  }
  for (const separatorHeight of metrics.rowSeparatorHeights) {
    expect(separatorHeight).toBeGreaterThan(0);
    expect(separatorHeight).toBeLessThanOrEqual(0.81);
  }
  expect(metrics.queueBadges.length).toBeGreaterThan(0);
  for (const badge of metrics.queueBadges) {
    expect(badge.exists).toBe(true);
    expect(badge.leftOffset).toBeLessThanOrEqual(8);
    expect(badge.topOffset).toBeLessThanOrEqual(8);
  }
  expect(metrics.facilityTitles.length).toBeGreaterThan(0);
  for (const title of metrics.facilityTitles) {
    expect(title.exists).toBe(true);
    expect(title.centerOffset).toBeLessThanOrEqual(4);
    expect(title.topOffset).toBeLessThanOrEqual(8);
  }
  expect(metrics.hasQueueDuration).toBe(false);
}

async function expectEfficiencyTextIsReadable(page: Page) {
  const efficiencyBlocks = await page
    .locator("[data-canvas-root] [data-room-efficiency]")
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = window.getComputedStyle(node);
        const children = Array.from(node.children).map((child) => {
          const rect = child.getBoundingClientRect();
          return {
            clientWidth: (child as HTMLElement).clientWidth,
            scrollWidth: (child as HTMLElement).scrollWidth,
            text: child.textContent ?? "",
            width: rect.width,
          };
        });

        return {
          textOverflow: style.textOverflow,
          whiteSpace: style.whiteSpace,
          children,
        };
      }),
    );

  expect(efficiencyBlocks.length).toBeGreaterThan(0);

  for (const block of efficiencyBlocks) {
    expect(block.textOverflow).not.toBe("ellipsis");
    expect(block.whiteSpace).not.toBe("nowrap");
    for (const child of block.children) {
      expect(child.text).toMatch(/纸面|折算/);
      expect(child.width).toBeGreaterThan(12);
      expect(child.scrollWidth).toBeLessThanOrEqual(child.clientWidth + 1);
    }
  }
}

test("sample 333 board renders and keeps editor controls outside canvas", async ({ page }) => {
  await page.goto("/sample/333");

  await expect(page.getByText("333 基建排班样例")).toBeVisible();
  const banner = page.getByRole("banner");
  await expect(banner.getByRole("heading", { name: "罗德岛排班表生成器" })).toBeVisible();
  await expect(banner.locator("p")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "PNG" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "导出图片" })).toHaveCount(1);
  await expect(page.locator("[data-canvas-root]")).toBeVisible();
  await expect(page.locator("[data-canvas-root]").getByText("导出图片")).toHaveCount(0);
});

test("operator filter remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByPlaceholder("名称 / alias").fill("Amiya");
  await expect(page.getByText(/干员池/)).toBeVisible();
});

test("operator overlays use fixed star height and top-left profession placement", async ({ page }) => {
  await page.goto("/sample/243");

  const tile = page.locator('[data-canvas-root] [data-operator-tile][data-filled="true"]').first();
  const portrait = tile.locator("[data-portrait-frame]").first();
  const professionIcon = tile.locator("[data-profession-icon]").first();
  await expect(tile).toBeVisible();
  await expect(portrait).toBeVisible();
  await expect(professionIcon).toBeVisible();

  const [portraitBox, professionBox] = await Promise.all([portrait.boundingBox(), professionIcon.boundingBox()]);
  expect(portraitBox).not.toBeNull();
  expect(professionBox).not.toBeNull();
  expect(professionBox!.x).toBeLessThanOrEqual(portraitBox!.x + portraitBox!.width * 0.36);
  expect(professionBox!.y).toBeLessThanOrEqual(portraitBox!.y + portraitBox!.height * 0.36);

  const oneStar = page.locator('[data-operator-pool-card][data-rarity="1"] [data-rarity-icon]').first();
  const sixStar = page.locator('[data-operator-pool-card][data-rarity="5"] [data-rarity-icon]').first();
  await expect(oneStar).toBeVisible();
  await expect(sixStar).toBeVisible();

  const [oneStarBox, sixStarBox] = await Promise.all([oneStar.boundingBox(), sixStar.boundingBox()]);
  expect(oneStarBox).not.toBeNull();
  expect(sixStarBox).not.toBeNull();
  expect(Math.abs(oneStarBox!.height - sixStarBox!.height)).toBeLessThanOrEqual(1);
  expect(oneStarBox!.width).toBeLessThan(sixStarBox!.width);
});

test("layout select popup does not cover queue select or crop previous options", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/sample/333");

  const layoutTrigger = page.getByRole("combobox", { name: "布局" });
  const queueTrigger = page.getByRole("combobox", { name: "队列" });

  await layoutTrigger.click();

  const popup = page.getByRole("listbox");
  const previousOption = page.getByRole("option", { name: "252" });
  await expect(popup).toBeVisible();
  await expect(previousOption).toBeVisible();

  const [popupBox, queueBox, previousOptionBox] = await Promise.all([
    popup.boundingBox(),
    queueTrigger.boundingBox(),
    previousOption.boundingBox(),
  ]);

  expect(popupBox).not.toBeNull();
  expect(queueBox).not.toBeNull();
  expect(previousOptionBox).not.toBeNull();

  const popupRight = popupBox!.x + popupBox!.width;
  const popupBottom = popupBox!.y + popupBox!.height;
  const queueRight = queueBox!.x + queueBox!.width;
  const queueBottom = queueBox!.y + queueBox!.height;

  const overlapsQueue =
    popupBox!.x < queueRight &&
    popupRight > queueBox!.x &&
    popupBox!.y < queueBottom &&
    popupBottom > queueBox!.y;

  expect(overlapsQueue).toBe(false);
  expect(previousOptionBox!.y).toBeGreaterThanOrEqual(popupBox!.y + 3);
});

for (const layoutId of ["243", "333"]) {
  for (const queueCount of [1, 2, 3]) {
    test(`${layoutId} export keeps operator slots square with ${queueCount} queue(s)`, async ({
      page,
    }) => {
      await page.goto(`/sample/${layoutId}`);
      await setQueueCount(page, queueCount);

      await expectOperatorPortraitLayout(page);
      await expectHeaderBlocksDoNotOverlap(page);
      await expectCompactCanvasInformation(page);
      await expectEfficiencyTextIsReadable(page);
    });
  }
}

test("drag preview stays square when dragging an operator into the canvas", async ({ page }) => {
  await page.goto("/sample/243");

  const source = page.locator("[data-operator-pool-card]").first();
  const target = page.locator("[data-canvas-root] [data-operator-tile]").first();
  await expect(source).toBeVisible();
  await expect(target).toBeVisible();

  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  expect(sourceBox).not.toBeNull();
  expect(targetBox).not.toBeNull();

  await page.mouse.move(sourceBox!.x + sourceBox!.width / 2, sourceBox!.y + sourceBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + targetBox!.height / 2, {
    steps: 10,
  });

  const preview = page.locator('[data-drag-preview="operator"]');
  await expect(preview).toBeVisible();
  const previewBox = await preview.boundingBox();
  expect(previewBox).not.toBeNull();
  expect(Math.abs(previewBox!.width - previewBox!.height)).toBeLessThanOrEqual(1);

  await page.mouse.up();
});
