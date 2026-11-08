import fs from 'node:fs';

const source = fs.readFileSync(process.argv[2], 'utf8');
const blocks = [...source.matchAll(/```json\r?\n([\s\S]*?)```/g)].map(match => JSON.parse(match[1]));
if (blocks.length !== 2 || blocks[0].Recipes.length !== 125 || blocks[0].SingleRecipes.length !== 13) throw new Error('Unexpected specification structure');
const [rules, reference] = blocks;
const write = (path, data) => {
  fs.mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true });
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
};
const zh = { ingredients: {}, dishes: {} };
const enDishes = {};
for (const rule of [...rules.Recipes, ...rules.SingleRecipes]) {
  zh.dishes[rule.result_id] = rule.zh;
  enDishes[rule.result_id] = rule.en;
  delete rule.zh;
  delete rule.en;
}
const items = {};
for (const [id, item] of Object.entries(reference.items)) {
  zh.ingredients[id] = item.zh;
  const { zh: omitted, ...metadata } = item;
  items[id] = metadata;
}
write('packages/game-data/src/botw/rules.json', rules);
write('packages/game-data/src/botw/materials.json', { source: reference.source, status: reference.status, items });
write('packages/game-data/src/botw/dish-names.en.json', enDishes);
write('packages/game-data/src/locales/zh-CN.json', zh);
console.log(JSON.stringify({ regular: rules.Recipes.length, single: rules.SingleRecipes.length, dishes: Object.keys(enDishes).length, materials: Object.keys(items).length }));
const missing = [...new Set([...rules.Recipes.flatMap(rule => rule.actors.flat()), ...rules.SingleRecipes.flatMap(rule => rule.actors)])].filter(id => !items[id]);
if (missing.length) throw new Error(`Missing explicit actors: ${missing.join(', ')}`);
