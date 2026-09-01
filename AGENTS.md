# dsh-bookmate

在对话「**收尾**」时，根据**用户画像**与**当前对话主题**推荐一本书的最小 DeepSeek Harness 插件。领域词汇见 [CONTEXT.md](CONTEXT.md)，关键决策见 [docs/adr/](docs/adr/)。

## 这是给谁看的

给想要复用推荐引擎、或将来把这个库扩成一个真插件的 agent / human。**只读这部份你就能上手**，别把 CONTEXT.md 当操作手册（那是术语表）。

## 怎么跑

- 测试：`npm test`（内置 `node:test`，无其它依赖；本机 npm spawn 失败时直接 `node --test`）
- 插件注册两个模型工具（`lib/index.js`）：
  - `book_search` —— OpenLibrary HTTP adapter（`src/book-search.js`），超时/HTTP/网络错误统一抛带信息的 Error，模型据此降级
  - `book_rank` —— 排序入口：模型打好标签的候选 → `recommend()` 引擎，画像标签做稳定信号、已推荐做去重（`src/book-rank.js`）
- 引擎是 `src/` 下的**纯函数**：
  - `scoreBook(book, profile, topics, weights?) → number` —— 画像分 + 主题分加权的书得分
  - `recommend({ profile, topics, catalog, weights?, topK? }) → [{ book, score, reason }]`
  - `normalizeOpenLibraryDocs` / `isRecommendable` —— OpenLibrary 响应规范化与可推荐校验（`src/openlibrary.js`）

## 领域词汇（详见 CONTEXT.md）

- **Topic** = 模型从对话抽取的主题词标签，kebab-case，**无固定词表**——词汇表就是画像本身（ADR-0003）。
- **Book Source** = 候选书来源：OpenLibrary adapter 先行，模型知识兜底（注明"未经线上核验"）。
- **Resolved / Wrap-up** = 收尾判定与触发行为。
- **User Profile** = 用户画像（兴趣标签 + 已推荐），存 `~/.dsh/book-profile.md`，**≠** DSH 运行时投影的 `USER.md`。

## 约定

- **测试优先、最小实现、一次一个切片**——测试务必用语义断言（比较行为/排序），不要用与实现同式的公式复算（tautological，见 `test/` 风格）。
- 术语词保留英文（与代码标识符一致）；`package.json` 的 scripts 是即查即得的环境，这里不重复抄。
- 新增概念时，先跟 CONTEXT.md 的既有术语对齐，别为同一事物造第二个词。

## 已知坑

- **线上书源依赖网络**：本机直连 OpenLibrary 需代理（127.0.0.1:7890，常不开），代理没开时 `book_search` 必然失败——失败后模型知识兜底是设计内行为（ADR-0003），别当 bug 修。
- **中文把守在工具层**：`isRecommendable`（zh/chi）+ 结构化校验只锁在 `book_search` 工具内，引擎不做语言或质量过滤；模型知识兜底的候选没有 language 字段，中文性由模型自守。
- **画像三段结构有约定**：`## 兴趣标签` / `## 已推荐` 是解析锚点（`src/profile.js`），`## 已推荐` 行格式为 `- 书名 — 作者 — 日期`（长破折号），改格式需同步解析器与测试。

## Agent skills

### Issue tracker

问题与规格存放在 GitHub Issues，统一用 `gh` CLI 操作。See `docs/agents/issue-tracker.md`。

### Triage labels

triage 五角色标签保留默认词汇：`needs-triage` / `needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix`。See `docs/agents/triage-labels.md`。

### Domain docs

单上下文：仓库根 `CONTEXT.md` + `docs/adr/`。See `docs/agents/domain.md`。
