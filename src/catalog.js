// Built-in catalog: the first (and only) implementation of the Catalog seam.
// Every book's `tags` must come from the domain lexicon labels so the
// recommender can match them. `blurb` is a one-line reason used to justify a
// recommendation (kept in Chinese, the plugin's working language).
export const BOOKS = [
  // --- engineering ---
  { id: 'effective-typescript', title: 'Effective TypeScript', author: 'Dan Vanderkam', tags: ['typescript'], blurb: '用具体例子讲透 TS 的类型系统与最佳实践，适合刚上手到进阶的 TS 开发者。' },
  { id: 'tdd-by-example', title: 'Test-Driven Development: By Example', author: 'Kent Beck', tags: ['testing'], blurb: 'TDD 开山之作，用购物车例子走完红-绿-重构，想建立测试习惯就看这本。' },
  { id: 'legacy-code', title: 'Working Effectively with Legacy Code', author: 'Michael Feathers', tags: ['testing', 'refactoring'], blurb: '教你在没有测试的老代码上安全地引入测试、做小步重构，改遗留系统的必读。' },
  { id: 'refactoring', title: 'Refactoring: Improving the Design of Existing Code', author: 'Martin Fowler', tags: ['refactoring', 'architecture'], blurb: '重构手册，给出大量安全小步改法，配合坏味道清单使用。' },
  { id: 'philosophy-software-design', title: 'A Philosophy of Software Design', author: 'John Ousterhout', tags: ['architecture', 'design'], blurb: '讲“深模块”与“把复杂度往下压”，反对过度抽象，设计品味提升明显。' },
  { id: 'clean-architecture', title: 'Clean Architecture', author: 'Robert C. Martin', tags: ['architecture'], blurb: '论依赖方向与边界，帮你把系统分层到能长期演化的形状。' },
  { id: 'design-patterns', title: 'Design Patterns', author: 'Erich Gamma et al.', tags: ['architecture'], blurb: '经典四人组模式书，是很多设计词汇的来源（但别当教条）。' },
  { id: 'road-to-react', title: 'The Road to React', author: 'Robin Wieruch', tags: ['react', 'learning'], blurb: '用现代 hooks 从零搭一个 React 应用，边写边理解，适合入门与复习。' },
  { id: 'nodejs-in-action', title: 'Node.js in Action', author: 'Mike Cantelon et al.', tags: ['node'], blurb: '覆盖 Node 的异步模型、模块与事件循环，写后端工具的实用参考。' },
  { id: 'fluent-python', title: 'Fluent Python', author: 'Luciano Ramalho', tags: ['python'], blurb: '深入 Python 的惯用法与数据模型，从“能写”到“写得地道”。' },
  { id: 'hands-on-ml', title: 'Hands-On Machine Learning with Scikit-Learn & TensorFlow', author: 'Aurélien Géron', tags: ['ai', 'python'], blurb: '从项目切入机器学习，代码齐全，入门 AI 看这本很顺。' },
  { id: 'ddia', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', tags: ['database', 'architecture', 'systems'], blurb: '分布式系统与数据存储的“圣经”，讲清一致性、复制、分区这些核心权衡。' },
  { id: 'system-design-interview', title: 'System Design Interview', author: 'Alex Xu', tags: ['systems', 'performance'], blurb: '以面试题形式拆解大型系统设计，帮你建立容量与权衡的直觉。' },
  { id: 'hpn-browser-networking', title: 'High Performance Browser Networking', author: 'Ilya Grigorik', tags: ['performance', 'node'], blurb: '从 HTTP/2 到 WebSocket 讲透网络性能，前端与 Node 都值得读。' },
  { id: 'phoenix-project', title: 'The Phoenix Project', author: 'Gene Kim et al.', tags: ['devops', 'career'], blurb: '小说体讲 DevOps 转型与组织瓶颈，读起来轻松但很能启发落地。' },
  { id: 'accelerate', title: 'Accelerate', author: 'Nicole Forsgren et al.', tags: ['devops'], blurb: '用数据证明哪些工程实践真正提升交付效率，适合想系统做改进的团队。' },
  { id: 'serious-cryptography', title: 'Serious Cryptography', author: 'Jean-Philippe Aumasson', tags: ['security'], blurb: '讲清现代密码算法与原理，理解安全机制的一本扎实入门。' },

  // --- general ---
  { id: 'atomic-habits', title: 'Atomic Habits', author: 'James Clear', tags: ['productivity', 'psychology'], blurb: '讲小习惯如何复利成巨大改变，落在“身份认同”上，执行力会不一样。' },
  { id: 'deep-work', title: 'Deep Work', author: 'Cal Newport', tags: ['productivity', 'learning'], blurb: '论证深度专注是最稀缺的能力，并给出可操作的专注训练方法。' },
  { id: 'on-writing-well', title: 'On Writing Well', author: 'William Zinsser', tags: ['writing'], blurb: '非虚构写作的经典，教你写得清楚、简洁、有温度，写文档和教程都用得上。' },
  { id: 'design-of-everyday-things', title: 'The Design of Everyday Things', author: 'Don Norman', tags: ['design', 'psychology'], blurb: '讲设计如何传达“可操作”的暗示，UI 与产品设计都应读。' },
  { id: 'make-it-stick', title: 'Make It Stick', author: 'Peter Brown et al.', tags: ['learning'], blurb: '基于认知科学的有效学习法，反对重复阅读，强调检索练习与间隔。' },
  { id: 'so-good-cant-ignore', title: "So Good They Can't Ignore You", author: 'Cal Newport', tags: ['career'], blurb: '反对“追随热情”，主张用“匠人精神”打磨稀缺技能来经营职业生涯。' },
  { id: 'thinking-fast-slow', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', tags: ['psychology'], blurb: '系统1/系统2 双系统思维，帮你识别判断偏差与直觉陷阱。' }
]

export function allBooks() {
  return BOOKS
}

// Return books that carry any of the given canonical labels.
export function booksMatching(tags) {
  const wanted = new Set(tags)
  return BOOKS.filter((book) => book.tags.some((tag) => wanted.has(tag)))
}
