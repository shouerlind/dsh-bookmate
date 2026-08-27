# dsh-bookmate

对 DeepSeek Harness 的一个最小书籍推荐插件：AI 在对话「**收尾**」时，主动确认"问题解决了吗？"，然后**结合本次对话主题 + 用户画像**推荐一本相关的书。

设计理念是**收尾式推荐**：不打断你做事，而是在你刚解决完一个问题时，顺带送你一本正好能帮你深入这块的书。书单没有上限——候选来自线上书源（OpenLibrary），模型负责语义判断（打标签），引擎负责确定性排序。

## 装

```sh
# 从本仓库（本地 git）安装
dsh plugin --profile web add github:你的用户名/dsh-bookmate

# 或本地路径
dsh plugin --profile web add D:\deepseek harness\dsh-bookmate
```

装完重启 `dsh web` 生效。

## 用

插件注册了 `book-recommend` 技能和两个模型工具。当您在一段对话里完成了一个问题/任务，模型会自然地在收尾时触发它：

- 先确认"问题解决了吗？"，用户确认后再推荐；
- 从当前对话提炼主题标签（无固定词表），读取 `~/.dsh/book-profile.md` 的画像与已推荐记录；
- 调 `book_search` 从 OpenLibrary 找中文候选书；失败或为空时降级为模型自选，并注明"未经线上核验"；
- 给候选打上主题标签，交给 `book_rank` 按"画像 60% + 主题 40%"排序（已推荐过的书自动滤掉），输出书名 + 作者 + 一句话理由；
- 顺带把本次新透露出的兴趣标签（经您确认）与本次推荐记追加进 `~/.dsh/book-profile.md`。

您也可以直接要求：`给我推荐一本书`。

## 结构

```
lib/index.js                  插件入口：注册 skill + book_search / book_rank 两个模型工具
skills/book-recommend/SKILL.md  触发 + 流程（找候选 → 打标签 → 排序 → 守门确认 → 画像更新）
src/book-search.js            book_search 工具：OpenLibrary HTTP adapter + 错误规范化
src/openlibrary.js            响应规范化 + 可推荐校验（纯函数）
src/book-rank.js              book_rank 工具：候选+标签 → 引擎排序，已推荐去重
src/recommend.js / src/score.js  排序引擎（纯函数）
src/profile.js                画像读写：兴趣标签 + 已推荐（书名+作者键）
test/                         全部模块的测试（node:test）
CONTEXT.md                    领域术语表 | docs/adr/ 关键决策
```

## 规则

- 引擎是**纯函数、零运行时依赖、可独立测试**；模型只做语义判断（打标签），排序锁在引擎后面。
- 推荐算法 = 画像偏好分 + 对话主题相关分加权（`scoreBook`），取 top-k（`recommend`）。
- 线上失败是**设计内的常态降级路径**（本机两 API 均需代理，见 ADR-0003）：模型从自身知识推荐并注明"未经线上核验"，不要当成 bug 修。
- 只想复用引擎可直接调 `src/recommend.js`。

详见 [AGENTS.md](AGENTS.md)（给 agent 的使用说明）。
