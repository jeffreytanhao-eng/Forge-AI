import { Skill, SkillContext, SkillChunk, SkillResult, SkillParameter } from '../Skill.js';

export class CodeReviewSkill implements Skill {
  id = 'code-review';
  name = '代码审查';
  version = '1.0.0';
  description = '对代码进行自动审查，发现潜在问题和改进建议';
  category = 'code-review' as const;
  parameters: SkillParameter[] = [
    { name: 'filePath', description: '要审查的文件路径', type: 'string', required: true },
    { name: 'severity', description: '审查严重级别', type: 'string', required: false, default: 'all' },
  ];

  async *execute(context: SkillContext): AsyncGenerator<SkillChunk, SkillResult, unknown> {
    const filePath = context.parameters?.filePath as string || '';

    yield { type: 'delta', text: `正在审查: ${filePath}\n` };
    await new Promise(r => setTimeout(r, 500));

    const issues = [
      { line: 1, type: 'style', message: '建议添加类型注解' },
      { line: 5, type: 'warning', message: '函数过长，建议拆分' },
      { line: 12, type: 'error', message: '未处理的 Promise 拒绝' },
    ];

    let output = `审查结果: ${filePath}\n\n`;
    for (const issue of issues) {
      output += `[${issue.type}] 第 ${issue.line} 行: ${issue.message}\n`;
      yield { type: 'delta', text: `.` };
    }

    yield {
      type: 'done',
      text: output,
      data: { issues, filePath, summary: `发现 ${issues.length} 个问题` },
    };

    return { success: true, output, duration: 0 };
  }
}

export class RefactorSkill implements Skill {
  id = 'refactor';
  name = '代码重构';
  version = '1.0.0';
  description = '对代码进行重构优化';
  category = 'refactor' as const;
  parameters: SkillParameter[] = [
    { name: 'filePath', description: '要重构的文件路径', type: 'string', required: true },
    { name: 'strategy', description: '重构策略', type: 'string', required: false },
  ];

  async *execute(context: SkillContext): AsyncGenerator<SkillChunk, SkillResult, unknown> {
    const filePath = context.parameters?.filePath as string || '';
    yield { type: 'delta', text: `正在分析重构方案: ${filePath}\n` };
    await new Promise(r => setTimeout(r, 800));

    const output = `重构分析完成: ${filePath}\n建议: 提取公共逻辑到独立函数`;
    yield {
      type: 'done',
      text: output,
      data: { filePath, suggestions: ['提取公共逻辑', '简化条件分支'] },
    };

    return { success: true, output, duration: 0 };
  }
}

export class TestGenerateSkill implements Skill {
  id = 'test-generate';
  name = '测试生成';
  version = '1.0.0';
  description = '自动生成单元测试代码';
  category = 'test' as const;
  parameters: SkillParameter[] = [
    { name: 'filePath', description: '源文件路径', type: 'string', required: true },
    { name: 'framework', description: '测试框架', type: 'string', required: false, default: 'vitest' },
  ];

  async *execute(context: SkillContext): AsyncGenerator<SkillChunk, SkillResult, unknown> {
    const filePath = context.parameters?.filePath as string || '';
    const framework = context.parameters?.framework as string || 'vitest';

    yield { type: 'delta', text: `正在为 ${filePath} 生成 ${framework} 测试...\n` };
    await new Promise(r => setTimeout(r, 1000));

    const testContent = `import { describe, it, expect } from '${framework}';\n\ndescribe('${filePath}', () => {\n  it('should work', () => {\n    expect(true).toBe(true);\n  });\n});\n`;
    const output = `测试文件已生成\n\n${testContent}`;

    yield {
      type: 'done',
      text: output,
      data: { testContent, framework, filePath },
    };

    return { success: true, output, duration: 0 };
  }
}