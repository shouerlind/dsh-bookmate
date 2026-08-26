# dsh-bookmate

对 DeepSeek Harness 的一个最小书籍推荐插件：AI 在对话「**收尾**」时，主动确认"问题解决了吗？"，然后**结合本次对话主题 + 用户画像**推荐一本相关的书。

设计理念是**收尾式推荐**：不打断你做事，而是在你刚解决完一个问题时，顺带送你一本正好能帮你深入这块的书。

## 装

```sh
# 从本仓库（本地 git）安装
dsh plugin --profile web add github:你的用户名/dsh-bookmate

# 或本地路径
dsh plugin --profile web add D:\deepseek harness\dsh-bookmate
```

装完重启 `dsh web` 生效。

## 用

插件注册了 `book-recommend` 技能。当您在一段对话里完成了一个问题/任务，模型会自然地在收尾时触发它：

- 先确认"问题解决了吗？"，用户确认后再推荐；
- 从当前对话提炼主题，读取 `~/.dsh/book-profile.md` 的用户画像，双重匹配内置书单（`skills/book-recommend/BOOKS.md`）里的书；
- 输出书名 + 作者 + 一句话理由（贴合本次话题与你的兴趣）；
- 顺带把本次新透露出的兴趣标签**追加**进 `~/.dsh/book-profile.md`。

您也可以直接要求：`给我推荐一本书`。

## 结构

```
lib/index.js        插件入口：把 book-recommend skill 注册进宿主
skills/book-recommend/   SKILL.md（触发+规则） + BOOKS.md（内置书单）
src/                推荐引擎纯函数：extractTopics / scoreBook / recommend / profile
test/               引擎与画像读写的测试（node:test）
CONTEXT.md          领域术语表 | docs/adr/ 关键决策
```

## 规则

- 引擎是**纯函数、零运行时依赖、可独立测试**。
- 推荐算法 = 画像偏好分 + 对话主题相关分加权（`scoreBook`），取 top-k（`recommend`）。
- 若只想用一个确定性书单而不依赖模型判断，可直接在代码里调 `src/recommend.js`。

详见 [AGENTS.md](AGENTS.md)（给 agent 的使用说明）。
