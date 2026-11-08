# 锅内料理规则

本轮以用户提供的 `BOTW-Cooking-Complete-Spec.md` 为规格，实现其锅内计算流程。`scripts/import-cooking-spec.mjs` 只提取机器数据，不执行文档中的代码或指令。

## 数据

- 完整保留 125 条 Recipes、13 条 SingleRecipes、118 个结果 ID，以及候选原始顺序。
- 原始材料参考 292 条包含关键道具、环境成品和地图对象；当前筛选出 151 条可烹饪材料，加上原有 9 条配置，共 160 条。该资格筛选是项目适配，不宣称替代原版完整可手持数据。
- 关键道具、烤制/冻结成品及已识别的地图植物、活鱼模型不进入投料目录。
- 原有 mushroom、carrot、fish、milk、radish、pumpkin 是明确的项目别名；原始参考中的不同 actor ID 不按名称合并。potato、tomato、cabbage 保留为 CookPlant 中性扩展，不冒充原版食材。
- 当前测试开局全部 160 条食材各 1 份，背包按 5 × 4 分页（每页 20 格）。背包与投料列表仍只显示拥有的材料；本轮没有增加采集或购买入口。

```text
packages/game-data/src/botw/rules.json          原序配方、HB/TB、效果和系统参数
packages/game-data/src/botw/materials.json      原始材料参数与来源说明
packages/game-data/src/botw/dish-names.en.json  英文基础菜名
packages/game-data/src/locales/zh-CN.json      中文食材/料理名
packages/game-data/src/cookingData.ts          材料资格、项目别名和参数适配
```

部分原文 Animal actor 的中文字段仅为 ID，显示层会按同名英文材料查找已有中文翻译；仅影响显示，不合并 actor 身份或匹配标签。

## 执行顺序

先校验 1～5 份、资格与库存，再按 actor 合并重复份数、保留首次顺序。多种材料逐条扫描常规表，先 Actors 后 Tags，贪心占用不同种类，不做回溯；余料可存在。无命中后尝试单一主料，再回落失败料理。

随后计算基础恢复、效果冲突与药失败；怪物精华替代普通暴击分支；追加调味材料和配方奖励，最后限幅及计算售价。怪物材料时间按份数，普通调味奖励按种类。效果使用明确的等级阈值，精力单位使用原文单独参考表。售价使用 Math.fround、截断和向上取十，CookLowPrice 按 1 计算；失败与精灵回力水固定价值为 2。

核心模块为 recipeMatcher.ts、cookingEffects.ts、dishNaming.ts、dishValue.ts，由 createDish() 组合调用。Game Core 不依赖 React、Phaser 或数据包，参数由应用注入。

料理保存结果 ID、效果、强度、原始点数、恢复 HP、时长、黄心/精力、暴击信息、sellPrice 和原料。界面按 ID 翻译，并展示恢复和增益；隐藏价值不显示，也不替玩家设置菜单售价。不同数值的料理批次分开库存，避免普通与暴击成品错误叠加。

## 随机性

`createDish(ids, ingredients, cookingRules, { seed, random, alwaysBoost })` 支持注入种子或返回 [0,1) 的随机函数。相同输入、顺序、参数和种子可复现。GameSession 的 cookingSeed 随成功烹饪推进，失败不推进。同一配方不同批次因此可能有不同暴击结果。alwaysBoost 由调用方提供血月上下文，不把每晚当成血月。

原来的“牛奶加任意材料必得牛奶汤”简化规则已替换。例如蘑菇牛奶汤还要求岩盐和植物材料。

## 边界

实现覆盖原文给出的锅内规则和数值参考，不宣称跨版本或二进制完全一致。原文材料标签是简化参考；保留 CookVegetable 支持，不擅自与 CookPlant 合并。精力参考表不与原始 MR 混作同一单位。

明火、冰冻、温泉在文档中只有名称附录，缺少完整转化条件，因此没有猜测实现。食用后的当前生命/精力变化、总心数上限与增益替换属于消费系统，本轮不实现。fullRecovery 保留“食用时全恢复”语义。采集、世界血月、自动顾客和持久存档也尚未加入。

## 验证与来源

`npm run test` 覆盖全表数量和每行匹配、30 个明确组合、优先级/贪心反例、分类、恢复、效果冲突、阈值、时长、暴击、怪物精华、售价、库存及交易。

开发服务器运行后，当前开发环境可执行 `node scripts/browser-cooking-smoke.mjs`，使用本机 Edge 与内置 Playwright。测试先检查全部食材的 8 页背包与翻页边界，再仅向隔离浏览器注入库存，验证蘑菇牛奶汤、菜单出售、中英文和窄屏，不修改正常初始库存。

来源信息保留在 JSON：CookData 参数来自 leoetlino/botw，材料参考来自 savage13/cooking。原文引擎参考目标为 Switch 1.5.0，文本标注为 1.6.0。本项目未下载或使用原版贴图、声音或模型。

