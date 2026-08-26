# dsh-bookmate

在对话「**收尾**」时，根据**用户画像**与**当前对话主题**推荐一本书的最小 DeepSeek Harness 插件。领域词汇见 [CONTEXT.md](CONTEXT.md)，关键决策见 [docs/adr/](docs/adr/)。

## 这是给谁看的

给想要复用推荐引擎、或将来把这个库扩成一个真插件的 agent / human。**只读这部份你就能上手**，别把 CONTEXT.md 当操作手册（那是术语表）。

## 怎么跑

- 测试：`npm test`（内置 `node:test`，无需其它依赖）
- 引擎是 `src/` 下的**纯函数**：
  - `extractTopics(conversationText) → Topic[]` —— 从对话文本抽主题词
  - `scoreBook(book, profile, topics, weights?) → number` —— 画像分 + 主题分加权的书名得分

## 领域词汇（详见 CONTEXT.md）

- **Topic** = 从对话抽出的主题词标签。本仓库暂用裸 `string[]`（见 ADR 之外的简化），预计会成类型。
- **Resolved / Wrap-up** = 收尾判定与触发行为。
- **User Profile** = 用户画像，存 `~/.dsh/book-profile.md`，**≠** DSH 运行时投影的 `USER.md`。

## 约定

- **测试优先、最小实现、一次一个切片**——测试务必用语义断言（比较行为/排序），不要用与实现同式的公式复算（tautological，见 `test/` 风格）。
- 术语词保留英文（与代码标识符一致）；`package.json` 的 scripts 是即查即得的环境，这里不重复抄。
- 新增概念时，先跟 CONTEXT.md 的既有术语对齐，别为同一事物造第二个词。

## 已知坑

- **`extractTopics` 目前对中文不可靠**：`src/topic.js` 按非汉字边界切分，中文无空格会把整段连续汉字切成一个 token，停用词削不掉、词频失效。真实会话是中文，所以这是实质缺口（来自 code-review 的 Spec 轴结论），加中文分词再回来。
