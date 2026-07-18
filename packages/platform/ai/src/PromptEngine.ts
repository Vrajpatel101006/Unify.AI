/**
 * PromptEngine — Core engine managing prompt templates.
 *
 * All modules (SQL, API, Code analysis) resolve templates here.
 */

import type { IPromptEngine, PromptTemplate } from './types';

export class PromptEngine implements IPromptEngine {
  private readonly _templates = new Map<string, PromptTemplate>();

  registerTemplate(template: PromptTemplate): void {
    this._templates.set(template.id, template);
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this._templates.get(id);
  }

  buildPrompt(templateId: string, variables: Record<string, unknown>): string {
    const template = this._templates.get(templateId);
    if (!template) {
      throw new Error(`[PromptEngine] Prompt template not found: "${templateId}"`);
    }

    let compiled = template.userPromptTemplate;

    // Validate variables
    for (const variable of template.variables) {
      const val = variables[variable.name] ?? variable.defaultValue;
      if (variable.required && val === undefined) {
        throw new Error(
          `[PromptEngine] Missing required prompt template variable: "${variable.name}" for template "${templateId}"`
        );
      }

      const stringVal = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val ?? '');
      compiled = compiled.replace(new RegExp(`{{${variable.name}}}`, 'g'), stringVal);
    }

    return compiled;
  }

  getTemplates(category?: string): PromptTemplate[] {
    const all = Array.from(this._templates.values());
    if (!category) return all;
    return all.filter((t) => t.category === category);
  }

  removeTemplate(id: string): void {
    this._templates.delete(id);
  }
}
