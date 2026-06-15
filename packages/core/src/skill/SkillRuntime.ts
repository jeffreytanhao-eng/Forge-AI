import { Skill, SkillContext, SkillChunk, SkillResult } from './Skill.js';

export class SkillRuntime {
  async execute(skill: Skill, context: SkillContext = {}): Promise<SkillResult> {
    const startTime = Date.now();
    const chunks: SkillChunk[] = [];

    try {
      for await (const chunk of skill.execute(context)) {
        chunks.push(chunk);
        if (chunk.type === 'error') {
          return {
            success: false,
            output: chunk.error || 'Unknown error',
            duration: Date.now() - startTime,
          };
        }
        if (chunk.type === 'done') {
          return {
            success: true,
            output: chunk.text || '',
            data: chunk.data,
            duration: Date.now() - startTime,
          };
        }
      }
    } catch (err) {
      return {
        success: false,
        output: err instanceof Error ? err.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }

    return {
      success: true,
      output: chunks.map(c => c.text || '').join(''),
      duration: Date.now() - startTime,
    };
  }

  async *executeStream(skill: Skill, context: SkillContext = {}) {
    yield* skill.execute(context);
  }
}

export const defaultSkillRuntime = new SkillRuntime();