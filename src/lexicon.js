// Domain lexicon: maps a canonical topic label to the trigger phrases (zh + en)
// that should surface it from a conversation. `extractTopics` scans the text
// for these triggers and returns the canonical labels — which is exactly what
// the recommender matches books on.
export const LEXICON = {
  // --- engineering ---
  typescript: { triggers: ['typescript', 'ts'] },
  testing: { triggers: ['tdd', 'test driven', 'testing', '测试'] },
  refactoring: { triggers: ['refactor', '重构', 'clean code'] },
  architecture: { triggers: ['architecture', '设计模式', 'deep module', '模块化'] },
  react: { triggers: ['react', 'reactjs', '前端'] },
  node: { triggers: ['node', 'nodejs'] },
  python: { triggers: ['python'] },
  ai: { triggers: ['ai', 'llm', '大模型', '人工智能', '机器学习'] },
  performance: { triggers: ['performance', '性能'] },
  database: { triggers: ['database', 'sql', '数据库'] },
  devops: { triggers: ['devops', 'docker', '部署'] },
  security: { triggers: ['security', '安全'] },
  systems: { triggers: ['system design', '系统设计'] },

  // --- general ---
  productivity: { triggers: ['productivity', '效率', '生产力'] },
  writing: { triggers: ['writing', '写作'] },
  learning: { triggers: ['learning', '学习'] },
  design: { triggers: ['design', '设计'] },
  career: { triggers: ['career', '职业', '成长'] },
  psychology: { triggers: ['psychology', '心理', '认知'] }
}

// Whether a trigger should be matched as a Latin token (word boundary) or a
// Chinese substring. Latin triggers risk matching inside longer words, so we
// match them as whole tokens; Chinese has no spaces so we use substring.
export function isLatinTrigger(trigger) {
  return /^[\x00-\x7F]+$/.test(trigger)
}
