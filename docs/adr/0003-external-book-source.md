# ADR-0003: 书源改为外部 API（OpenLibrary 先行），内置书单退役

原设计把 24 本精选书写死在 BOOKS.md 与 catalog.js 两处，主题词表（lexicon.js）又是第三份平行词汇，书单既封闭又开始漂移。伪无限书单改为外部 API 供书：`book_search` 工具（插件内 HTTP adapter）查询 OpenLibrary（免 key，`language` 字段可把守中文），返回规范化候选；模型给候选打主题标签（语义判断），`book_rank` 工具把打好标签的候选连同画像交给 `recommend()` 引擎排序（确定性逻辑，引擎 interface 零改动）。质量门槛锁在工具内：结构化校验（非空书名+作者）+ 语言过滤（zh/chi）。

本机直连 OpenLibrary / Google Books 均需代理，因此「API 失败 → 模型从自身知识推荐并注明『未经线上核验』」是设计内的常态降级路径，不是异常。豆瓣官方 API 已确认关闭（apikey_required）；Google Books 留作第二 adapter（key 走 ctx.credentials）。BOOKS.md、catalog.js、lexicon.js、topic.js 随之退役；主题词汇表即画像本身——Topic 无固定词表，新标签写入画像前需用户确认。
