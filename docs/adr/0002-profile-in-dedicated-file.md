# ADR-0002: 用户画像存专用 book-profile.md，而非写入 dsh-mnemon 记忆空间

用户画像是本插件自己的输入数据，而 dsh 的 USER.md/MEMORY.md 是每个会话的运行时投影、并不落盘为可读文件，无法直接作为画像来源。为保持职责清晰、避免与记忆插件耦合，画像由本插件独立持久化到单个 markdown 文件（`~/.dsh/book-profile.md`）。若日后需要长期记忆检索，可再迁移，届时另行出 ADR。
