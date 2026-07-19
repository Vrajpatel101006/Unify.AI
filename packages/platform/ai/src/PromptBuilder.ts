import type { WorkspaceContextModel } from '@unify/platform-context';

export interface PromptBuilderOptions {
  maxTokens?: number;
}

export class PromptBuilder {
  /**
   * Translates a structured WorkspaceContextModel into an optimized markdown prompt prefix.
   */
  public static buildWorkspaceContextPrompt(context: WorkspaceContextModel, options: PromptBuilderOptions = {}): string {
    let prompt = `# AI Workspace Context\n\n`;

    // Active file / selection
    if (context.currentFile) {
      prompt += `## Active File\n- Path: ${context.currentFile.path}\n- Language: ${context.currentFile.language}\n`;
      if (context.selection && context.selection.text) {
        prompt += `- Selected Text:\n\`\`\`${context.currentFile.language}\n${context.selection.text}\n\`\`\`\n`;
      }
      prompt += `\n`;
    }

    // Git State
    if (context.git) {
      if (context.git.branch) {
        prompt += `## Git State\n- Branch: ${context.git.branch}\n`;
        if (context.git.status) {
          prompt += `- Clean: ${context.git.status.isClean}\n`;
          if (context.git.status.modifiedFiles.length > 0) {
             prompt += `- Modified: ${context.git.status.modifiedFiles.join(', ')}\n`;
          }
        }
        prompt += `\n`;
      }
    }

    // Repository Context
    if (context.repository) {
      prompt += `## Repository Architecture\n`;
      if (context.repository.frameworks && context.repository.frameworks.length > 0) {
        prompt += `Frameworks detected: ${context.repository.frameworks.map((f: any) => f.name).join(', ')}\n`;
      }
      if (context.repository.architecture && context.repository.architecture.nodes.length > 0) {
        prompt += `Key Symbols:\n`;
        // Basic budget trim: only show up to 10 symbols
        for (const node of context.repository.architecture.nodes.slice(0, 10)) {
          prompt += `- ${node.type}: ${node.name}\n`;
        }
      }
      prompt += `\n`;
    }

    // Memory Context
    if (context.recentActivity) {
      const recent = context.recentActivity as any;
      if (recent.recentFiles && recent.recentFiles.length > 0) {
        prompt += `## Recent Activity\n- Recently opened files: ${recent.recentFiles.join(', ')}\n\n`;
      }
    }

    return prompt;
  }
}
