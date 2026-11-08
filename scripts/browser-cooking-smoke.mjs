import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173/');
  await page.waitForSelector('canvas');
  await page.getByRole('combobox').first().selectOption('en');
  assert(await page.locator('#workbench').count() === 0, 'Workbench should be closed at startup');
  const world = await page.locator('main > .world').boundingBox();
  assert(world.width === 1280 && world.height === 1000 && world.x === 0 && world.y === 0, 'World does not fill the viewport');
  assert(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), 'Main page scrolls below the world');
  await page.screenshot({ path: 'preview-fullscreen.png' });
  await page.getByRole('button', { name: 'Inventory', exact: false }).click();
  assert(await page.locator('#inventory .ingredient-card').count() === 20, 'Inventory page must contain 20 ingredients');
  assert(await page.getByRole('button', { name: 'Previous page', exact: true }).isDisabled(), 'First page allows previous');
  const seen = new Set();
  for (let pageIndex = 0; pageIndex < 8; pageIndex++) {
    for (const id of await page.locator('#inventory .ingredient-card').evaluateAll(cards => cards.map(card => card.dataset.ingredientId))) seen.add(id);
    if (pageIndex < 7) await page.getByRole('button', { name: 'Next page', exact: true }).click();
  }
  assert(await page.getByRole('button', { name: 'Next page', exact: true }).isDisabled(), 'Last page allows next');
  assert(seen.size === 160, 'Paging skipped or duplicated ingredients');
  assert((await page.locator('.inventory-pagination [role=status]').innerText()).includes('8 / 8'), 'Incorrect last page');
  await page.getByRole('button', { name: 'Close window', exact: true }).click();
  console.log('Full starting inventory: 8 pages, 20 cards each; page boundaries checked');
  await page.getByRole('button', { name: 'Use stove', exact: true }).click();
  assert(await page.locator('.ingredient-picker li').count() === 20, 'Cooking must show 20 slots per page');
  const grid = await page.locator('.ingredient-picker').evaluate(el => ({
    columns: getComputedStyle(el).gridTemplateColumns.split(' ').length,
    rows: getComputedStyle(el).gridTemplateRows.split(' ').length,
  }));
  assert(grid.columns === 5 && grid.rows === 4, 'Cooking picker is not 5 by 4');
  await page.getByRole('button', { name: 'Add Potato', exact: true }).click();
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await page.getByRole('button', { name: 'Previous page', exact: true }).click();
  assert(await page.locator('.pot-items li').count() === 1, 'Paging discarded selected ingredients');
  await page.getByRole('button', { name: 'Remove Potato', exact: true }).click();
  await page.screenshot({ path: 'preview-cooking-modal.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'preview-cooking-modal-mobile.png' });
  assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'Mobile picker overflows');
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.keyboard.press('Escape');
  assert(await page.locator('dialog[open]').count() === 0, 'Escape did not close cooking');
  console.log('Full-screen stage and 5x4 cooking modal, paging selection and Escape passed');

  // Only this isolated browser request receives test stock. Production initial state is unchanged.
  const fixtureIds = ['Item_Material_05', 'Item_Ore_H', 'Item_Mushroom_E', 'Item_PlantGet_A', 'Item_Material_07', 'Item_Material_01', 'Item_Material_06', 'Item_Fruit_A'];
  await page.route('**/src/main.tsx*', async route => {
    const response = await route.fetch();
    const source = await response.text();
    const fixture = `new GameSession({...createInitialState(), inventory: ingredients.filter(i => ${JSON.stringify(fixtureIds)}.includes(i.id)).map(i => ({ingredientId:i.id, quantity:3}))}, ingredients, cookingRules)`;
    const modified = source.replace(/new GameSession\(\s*createInitialState\(\),\s*ingredients,\s*cookingRules\s*\)/, fixture);
    assert(modified !== source, 'Fixture injection did not match compiled main');
    console.log('Injected isolated recipe test stock');
    await route.fulfill({ response, body: modified });
  });
  await page.reload();
  await page.getByRole('button', { name: 'Use stove', exact: true }).click();
  await page.getByRole('button', { name: 'Add Fresh Milk', exact: true }).waitFor();
  for (const name of ['Fresh Milk', 'Rock Salt', 'Hylian Shroom', 'Hyrule Herb']) {
    await page.getByRole('button', { name: `Add ${name}`, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Cook', exact: true }).click();
  assert(await page.locator('.result-modal .result-dish-name').innerText() === 'Cream of Mushroom Soup', 'Missing result name');
  assert(await page.locator('.result-modal svg[role=img]').count() === 1, 'Missing result image');
  await page.screenshot({ path: 'preview-cooking-success.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  const resultBounds = await page.locator('.result-modal').boundingBox();
  assert(resultBounds.width <= 390 && resultBounds.height <= 844, 'Result modal exceeds mobile viewport');
  await page.screenshot({ path: 'preview-cooking-success-mobile.png' });
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.locator('.result-modal').getByRole('button', { name: 'Add to menu', exact: true }).click();
  await page.getByRole('button', { name: 'Continue cooking', exact: true }).click();
  assert(await page.locator('.dish-card h3').innerText() === 'Cream of Mushroom Soup', 'Incorrect soup result');
  assert((await page.locator('.dish-stats').innerText()).includes('Recovery'), 'Missing recovery attributes');
  await page.locator('#workbench nav').getByRole('button', { name: /Menu & recipes/ }).click();
  await page.locator('.menu-card select').selectOption('yes');
  await page.getByLabel('Price (coins)', { exact: true }).fill('25');
  await page.getByRole('button', { name: 'Save settings' }).click();
  await page.getByRole('button', { name: 'Simulate customer purchase' }).click();
  assert((await page.getByRole('status').innerText()).includes('+25 Coins'), 'Incorrect settlement');
  assert(await page.getByRole('button', { name: 'Simulate customer purchase' }).isDisabled(), 'Sold-out sale allowed');
  await page.getByRole('button', { name: 'Close window', exact: true }).click();
  await page.getByRole('combobox').first().selectOption('zh-CN');
  await page.getByRole('button', { name: /菜单与食谱/ }).click();
  const chineseName = await page.locator('.menu-card h3').innerText();
  assert(chineseName !== 'Cream of Mushroom Soup' && !chineseName.includes('Item_'), 'Missing localized recipe name');
  console.log('Full recipe → menu → 25 coin sale → sold out → Chinese:', chineseName);
  await page.screenshot({ path: 'preview-botw-cooking.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'Mobile layout overflow');
  await page.getByRole('button', { name: '关闭窗口', exact: true }).click();
  await page.getByRole('button', { name: /出门/ }).click();
  await page.getByRole('button', { name: /进入食堂/ }).click();
  await page.getByRole('button', { name: /菜单与食谱/ }).click();
  assert(await page.locator('.menu-card').count() === 1, 'Menu lost after scene switch');
  assert(errors.length === 0, errors.join('\n'));
  console.log('Mobile, scene roundtrip and runtime error checks passed');
} finally {
  await browser.close();
}
