import { Skill, SkillCategory } from './Skill.js';

export class SkillRegistryClass {
  private skills = new Map<string, Skill>();

  register(skill: Skill): void {
    if (this.skills.has(skill.id)) {
      console.warn(`Skill "${skill.id}" already registered. Overwriting.`);
    }
    this.skills.set(skill.id, skill);
  }

  unregister(id: string): void {
    this.skills.delete(id);
  }

  get(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  getAll(): Skill[] {
    return Array.from(this.skills.values());
  }

  getByCategory(category: SkillCategory): Skill[] {
    return this.getAll().filter(s => s.category === category);
  }

  has(id: string): boolean {
    return this.skills.has(id);
  }

  importFromJSON(jsonStr: string): number {
    const data = JSON.parse(jsonStr);
    let count = 0;
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.id && item.name) {
          this.register(item as Skill);
          count++;
        }
      }
    }
    return count;
  }

  exportToJSON(): string {
    return JSON.stringify(this.getAll(), null, 2);
  }
}

export const SkillRegistry = new SkillRegistryClass();