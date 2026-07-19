import type { WorkspaceContextModel } from '@unify/platform-context';

export interface PromptBuilderOptions {
  maxTokens?: number;
}

export class PromptBuilder {
  /**
   * Translates a structured WorkspaceContextModel into an optimized markdown prompt prefix.
   * Enforces a max token limit by trimming lower priority sections first.
   */
  public static buildWorkspaceContextPrompt(context: WorkspaceContextModel, options: PromptBuilderOptions = {}): string {
    const maxTokens = options.maxTokens ?? 4000;
    // Rough estimation: 1 token ≈ 4 characters
    const maxChars = maxTokens * 4;

    // We build from highest priority to lowest priority.
    // Priority order: 
    // 1. Active file / selection
    // 2. Git State
    // 3. Repository Context
    // 4. Memory Context
    
    let selectionSection = '';
    let gitSection = '';
    let repoSection = '';
    let memorySection = '';

    // Priority 1: Active file / selection
    if (context.currentFile) {
      selectionSection += `## Active File\n- Path: ${context.currentFile.path}\n- Language: ${context.currentFile.language}\n`;
      if (context.selection && context.selection.text) {
        selectionSection += `- Selected Text:\n\`\`\`${context.currentFile.language}\n${context.selection.text}\n\`\`\`\n`;
      }
      selectionSection += `\n`;
    }

    // Priority 2: Git State
    if (context.git && context.git.branch) {
      gitSection += `## Git State\n- Branch: ${context.git.branch}\n`;
      if (context.git.status) {
        gitSection += `- Clean: ${context.git.status.isClean}\n`;
        if (context.git.status.modifiedFiles.length > 0) {
           gitSection += `- Modified: ${context.git.status.modifiedFiles.join(', ')}\n`;
        }
      }
      gitSection += `\n`;
    }

    // Priority 3: Repository Context
    if (context.repository) {
      repoSection += `## Repository Architecture\n`;
      if (context.repository.frameworks && context.repository.frameworks.length > 0) {
        repoSection += `Frameworks detected: ${context.repository.frameworks.map((f: any) => f.name).join(', ')}\n`;
      }
      if (context.repository.architecture && context.repository.architecture.nodes.length > 0) {
        repoSection += `Key Symbols:\n`;
        for (const node of context.repository.architecture.nodes.slice(0, 50)) { // limit to 50 symbols max
          repoSection += `- ${node.type}: ${node.name}\n`;
        }
      }
      repoSection += `\n`;
    }

    // Priority 4: Memory Context
    if (context.recentActivity) {
      const recent = context.recentActivity as any;
      if (recent.recentFiles && recent.recentFiles.length > 0) {
        memorySection += `## Recent Activity\n- Recently opened files: ${recent.recentFiles.join(', ')}\n\n`;
      }
    }

    let prompt = `# AI Workspace Context\n\n`;
    const sections = [selectionSection, gitSection, repoSection, memorySection];
    
    for (const section of sections) {
      if (!section) continue;
      
      // If adding this section exceeds budget, we stop adding more sections.
      if (prompt.length + section.length > maxChars) {
        // If it's the very first section (selection) and it's too big, we still add it but warn or truncate it.
        // For simplicity, if we hit the limit, we just truncate the string.
        const remainingChars = maxChars - prompt.length;
        if (remainingChars > 0) {
          prompt += section.substring(0, remainingChars) + '\n... [Context truncated due to budget limit]\n';
        }
        break;
      } else {
        prompt += section;
      }
    }

    return prompt;
  }
}
