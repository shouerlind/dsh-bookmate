# Book Recommendation

一个装进 DeepSeek Harness（DSH）的最小插件：AI 在对话"收尾时刻"主动确认"问题是否已解决"，并基于用户画像与当前对话主题推荐一本相关的书。本上下文界定书籍推荐领域的概念边界，消除"用户 / 会话 / 画像 / 主题 / 书源"等词的歧义。

> 术语词保留英文（与代码标识符一致）；定义用中文。本表只收录本领域特有概念，排序/权重/打分等纯算法细节不在此列。

## Language

## 核心实体（Core Entities）

**Book**：
一条推荐候选：书名、作者、来源侧 id（可选——模型知识来源的书没有 id）、语言、主题标签。标签由模型打，不是来源字段。
_Avoid_: 书目、卷

**Book Source（书源）**：
候选书的来源。首个 adapter 是 `book_search` 工具背后的 OpenLibrary HTTP 查询；第二个来源是模型自身知识（API 失败时的降级路径，其产出必须注明"未经线上核验"）。
_Avoid_: 书单、目录

**Catalog**：
交给引擎排序的候选书集合（带标签的 Book 列表）。由 Book Source 产出、经模型打标签后成形。内置精选库已退役（见 ADR-0003）。
_Avoid_: 数据库、内置书单

**User**：
使用本插件的真人操作者，携带有演化的画像。
_Avoid_: 读者、会员

**User Profile**：
对一名 User 跨会话累积的描述，持久化于 `~/.dsh/book-profile.md`：`## 兴趣标签`（排序的稳定信号）+ `## 已推荐`（Recommended Log）。
_Avoid_: 档案、persona

**Session**：
一次从开始到收尾的 dsh 对话；是抽取"当前对话主题"的来源。

## 推荐机制（Recommendation Mechanics）

**Topic**：
模型从 Session 对话文本抽取的主题词标签（kebab-case），反映本次要解决的问题领域。无固定词表——词汇表就是画像本身；新标签写入 User Profile 前需向用户确认（守门）。
_Avoid_: 关键词、意图、封闭词表

**Wrap-up**：
AI 判定本次问题已解决时主动触发的行为——确认"解决了吗"并给出推荐；由 skill 驱动，非硬状态机事件。
_Avoid_: 结束、完成回调

**Resolved**：
AI 对"本次任务是否已解决"的主观判定，是 Wrap-up 的触发条件。
_Avoid_: 完成、finished

**Recommendation**：
一次 Wrap-up 产出的结果：按"画像 60% + 主题 40%"排序的书列表 + 推荐理由，由 `book_rank` 工具（引擎）产出。

**Recommended Log（已推荐）**：
画像 `## 已推荐` 段记录的实际推荐条目（`书名 — 作者 — 日期`），以"书名+作者"为去重键（大小写与空白不敏感）；排序时据此排除重复推荐。
_Avoid_: 历史记录
