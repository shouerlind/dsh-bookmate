# Book Recommendation

一个装进 DeepSeek Harness（DSH）的最小插件：AI 在对话"收尾时刻"主动确认"问题是否已解决"，并基于用户画像与当前对话主题推荐一本相关的书。本上下文界定书籍推荐领域的概念边界，消除"用户 / 会话 / 画像 / 主题"等词的歧义。

> 术语词保留英文（与代码标识符一致）；定义用中文。本表只收录本领域特有概念，排序/权重/打分等纯算法细节不在此列。

## Language

## 核心实体（Core Entities）

**Book**：
Catalog 中的一条推荐候选，携带 id、书名、作者、主题标签与简介。
_Avoid_: 书目、卷

**Catalog**：
可替换的书籍集合接口，提供按主题标签查询候选的能力；首个实现为内置精选库。
_Avoid_: 数据库、书单

**User**：
使用本插件的真人操作者，携带有演化的画像。
_Avoid_: 读者、会员

**User Profile**：
对一名 User 跨会话累积的描述（技术栈、兴趣标签、阅读倾向），持久化于 `~/.dsh/book-profile.md`。
_Avoid_: 档案、persona

**Session**：
一次从开始到收尾的 dsh 对话；是抽取"当前对话主题"的来源。

## 推荐机制（Recommendation Mechanics）

**Topic**：
从 Session 对话文本抽取的主题词标签，反映本次要解决的问题领域。
_Avoid_: 关键词、意图

**Wrap-up**：
AI 判定本次问题已解决时主动触发的行为——确认"解决了吗"并给出推荐；由 skill 驱动，非硬状态机事件。
_Avoid_: 结束、完成回调

**Resolved**：
AI 对"本次任务是否已解决"的主观判定，是 Wrap-up 的触发条件。
_Avoid_: 完成、finished

**Recommendation**：
一次 Wrap-up 产出的结果：按分数排序的书列表 + 推荐理由。
