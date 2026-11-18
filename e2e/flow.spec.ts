import { expect, Page, test } from '@playwright/test';

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const shot = (page: Page, name: string) => page.screenshot({ path: `test-results/${name}.png` });

async function setup(page: Page, url = '/') {
  const posts: Record<string, string>[] = [];
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('https://api.web3forms.com/**', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') posts.push(JSON.parse(req.postData() ?? '{}'));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ success: true }),
    });
  });
  await page.clock.setFixedTime(new Date('2026-11-18T10:00:00'));
  await page.goto(url);
  return { posts, errors };
}

async function unlockWithMusic(page: Page) {
  await page.waitForSelector('#playerWrap iframe', { timeout: 20_000 });
  await page.waitForTimeout(3000);
  const box = (await page.locator('#playerWrap').boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.touchscreen.tap(x, y);
  try {
    await expect(page.locator('body')).toHaveClass(/vidbg/, { timeout: 2500 });
  } catch {
    await page.mouse.click(x, y);
  }
  await expect(page.locator('body')).toHaveClass(/vidbg/, { timeout: 15_000 });
}

async function finishFlow(page: Page, posts: Record<string, string>[]) {
  await page.locator('.opt', { hasText: 'Cină' }).click();
  await page.getByRole('button', { name: 'Mai departe' }).click();
  await page.locator('#date').fill('2026-11-27');
  await page.locator('.chip', { hasText: '20:00' }).click();
  await page.locator('#note').fill('Vreau desert.');
  await page.getByRole('button', { name: 'Gata!' }).click();
  await expect.poll(() => posts.filter((p) => p['ora']).length).toBe(1);
  const p = posts.find((x) => x['ora'])!;
  expect(p['ora']).toBe('20:00');
  expect(p['nota']).toBe('Vreau desert.');
  await expect(page.locator('.poem')).toContainText('vineri, douăzeci și șapte', { timeout: 20_000 });
}

test('music path', async ({ page }) => {
  const { posts, errors } = await setup(page);
  await shot(page, '01-gate');
  await unlockWithMusic(page);

  // pause toggles the player and the label
  await page.getByRole('button', { name: 'Pauză' }).click();
  await expect(page.getByRole('button', { name: 'Pornește muzica' })).toBeVisible();
  // __music is a dev-mode-only hook; absent in production builds (BASE_URL runs against dist)
  if (await page.evaluate(() => !!(window as any).__music)) {
    await expect.poll(() => page.evaluate(() => (window as any).__music?.state())).toBe(2);
  }
  await page.getByRole('button', { name: 'Pornește muzica' }).click();
  await expect(page.getByRole('button', { name: 'Pauză' })).toBeVisible();

  // bg-mode crop: iframe extends >= 100px above and below the viewport
  const ib = (await page.locator('#playerWrap iframe').boundingBox())!;
  expect(ib.y).toBeLessThanOrEqual(-100);
  expect(ib.y + ib.height).toBeGreaterThanOrEqual(844 + 100);

  await page.waitForTimeout(500);
  await shot(page, '02-story');
  await page.locator('.no-link').scrollIntoViewIfNeeded();
  await page.locator('.no-link').click();
  await expect(page.locator('.judge')).toBeVisible();
  await page.locator('#reason').fill('Prea multă muncă');
  await page.waitForTimeout(600);
  await shot(page, '03-question-reason');
  await page.getByRole('button', { name: 'Trimite motivul' }).click();
  await expect.poll(() => posts.length).toBe(1);
  expect(JSON.stringify(posts[0])).toContain('motiv');

  await page.getByRole('button', { name: 'Da!' }).click();
  if (await page.evaluate(() => !!(window as any).__music)) {
    await expect
      .poll(() => page.evaluate(() => (window as any).__music?.videoId()), { timeout: 8000 })
      .toBe('1WpoKRnoPRU');
  }

  await finishFlow(page, posts);
  expect(posts.length).toBe(2);
  await page.waitForTimeout(6000);
  await shot(page, '04-done');
  expect(errors).toEqual([]);
});

test('no-music path', async ({ page }) => {
  const { posts, errors } = await setup(page);
  await page.waitForSelector('#playerWrap iframe', { timeout: 20_000 });
  const skip = page.locator('.gate button');
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator('#playerWrap')).toBeHidden();
  await expect(page.locator('.mini')).toHaveCount(0);
  await page.locator('.no-link').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Da!' }).click();
  await finishFlow(page, posts);
  expect(errors).toEqual([]);
});

test('embed error', async ({ page }) => {
  await setup(page, 'http://127.0.0.1:4200');
  await expect(page.getByText('Muzica nu se poate încărca aici.')).toBeVisible({ timeout: 12_000 });
  await expect(page.locator('.gate button')).toHaveClass(/btn-primary/);
});

test('no emoji', async ({ page }) => {
  const { posts } = await setup(page);
  const text = async () => page.evaluate(() => document.body.innerText.replace(/[\u266A-\u266C\u2669]/g, ''));
  expect(await text()).not.toMatch(EMOJI);
  await page.locator('.gate button').waitFor({ state: 'visible', timeout: 15_000 });
  await page.locator('.gate button').click();
  expect(await text()).not.toMatch(EMOJI);
  await page.locator('.no-link').click();
  expect(await text()).not.toMatch(EMOJI);
  await page.getByRole('button', { name: 'Da!' }).click();
  expect(await text()).not.toMatch(EMOJI);
  await page.locator('.opt', { hasText: 'Cină' }).click();
  await page.getByRole('button', { name: 'Mai departe' }).click();
  expect(await text()).not.toMatch(EMOJI);
  await page.locator('#date').fill('2026-11-27');
  await page.locator('.chip', { hasText: '20:00' }).click();
  await page.getByRole('button', { name: 'Gata!' }).click();
  await expect(page.locator('.poem')).toContainText('vineri', { timeout: 20_000 });
  await page.waitForTimeout(8000);
  expect(await text()).not.toMatch(EMOJI);
  expect(posts.length).toBeGreaterThan(0);
});

