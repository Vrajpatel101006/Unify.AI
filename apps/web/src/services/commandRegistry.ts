import { CommandRegistry, CommandCategory, type Command } from '@unify/platform-commands';
import { useProjectStore } from '../stores/projectStore';
import { useFeatureStore } from '../stores/featureStores';

export const commandRegistry = new CommandRegistry();

// Initialize commands
export function registerCoreCommands() {
  const commands: Command[] = [
    {
      id: 'git.clone',
      title: 'Clone Repository',
      description: 'Clone a remote repository into the current workspace',
      category: CommandCategory.Git,
      keywords: ['download', 'repository', 'github', 'clone'],
      icon: 'download',
      execute: async () => {
        const url = window.prompt('Enter repository URL to clone:');
        if (!url) return;
        const dest = window.prompt('Enter local destination path:');
        if (!dest) return;
        await useProjectStore.getState().cloneProject(url, dest);
      }
    },
    {
      id: 'git.commit',
      title: 'Commit Changes',
      description: 'Commit staged and unstaged files to the local repository',
      category: CommandCategory.Git,
      keywords: ['save', 'commit'],
      icon: 'git-commit',
      requiredCapabilities: ['RepositoryOpen'],
      isEnabled: () => {
        const proj = useProjectStore.getState().currentProject;
        return proj !== null && proj.gitStatus.isDirty;
      },
      execute: async () => {
        const msg = window.prompt('Enter commit message:');
        if (msg) {
          await useProjectStore.getState().commitChanges(msg, []);
        }
      }
    },
    {
      id: 'git.push',
      title: 'Push Changes',
      description: 'Push local commits to the remote repository',
      category: CommandCategory.Git,
      keywords: ['upload', 'publish', 'push'],
      icon: 'upload',
      requiredCapabilities: ['RepositoryOpen'],
      isEnabled: () => useProjectStore.getState().currentProject !== null,
      execute: async () => {
        await useProjectStore.getState().pushProject();
        alert('Push completed successfully.');
      }
    },
    {
      id: 'git.pull',
      title: 'Pull Changes',
      description: 'Fetch and merge changes from the remote repository',
      category: CommandCategory.Git,
      keywords: ['fetch', 'sync', 'pull'],
      icon: 'download',
      requiredCapabilities: ['RepositoryOpen'],
      isEnabled: () => useProjectStore.getState().currentProject !== null,
      execute: async () => {
        await useProjectStore.getState().pullProject();
        alert('Pull completed successfully.');
      }
    },
    {
      id: 'github.createRepo',
      title: 'Create GitHub Repository',
      description: 'Create a new remote repository on GitHub',
      category: CommandCategory.Repository,
      keywords: ['new', 'repository', 'github', 'create'],
      icon: 'plus',
      requiredCapabilities: ['GitHubConnected'],
      isEnabled: () => useProjectStore.getState().githubToken !== null,
      execute: async () => {
        const name = window.prompt('Enter new repository name:');
        if (!name) return;
        const dest = window.prompt('Enter local destination path:');
        if (!dest) return;
        await useProjectStore.getState().createGithubRepo(name, dest);
      }
    },
    {
      id: 'github.disconnect',
      title: 'Disconnect GitHub Account',
      description: 'Remove your GitHub Personal Access Token from the workspace',
      category: CommandCategory.Settings,
      keywords: ['logout', 'signout', 'disconnect', 'github'],
      icon: 'log-out',
      requiredCapabilities: ['GitHubConnected'],
      requiresConfirmation: true,
      isEnabled: () => useProjectStore.getState().githubToken !== null,
      execute: async () => {
        if (window.confirm('Are you sure you want to disconnect your GitHub account?')) {
          useProjectStore.getState().setGithubToken(null);
        }
      }
    },
    {
      id: 'repo.scanArchitecture',
      title: 'Scan Architecture',
      description: 'Run a deep scan on the current repository architecture',
      category: CommandCategory.Repository,
      keywords: ['scan', 'analyze', 'architecture', 'intel'],
      icon: 'search',
      requiredCapabilities: ['RepositoryOpen'],
      isEnabled: () => useProjectStore.getState().currentProject !== null,
      execute: async () => {
        const store = useFeatureStore.getState();
        await store.repoIntel.triggerScan();
        alert('Repository scan completed.');
      }
    },
    
    // --- AI Placeholder Commands ---
    {
      id: 'ai.explainFile',
      title: 'Explain File',
      description: 'Use AI to generate a detailed explanation of the current file',
      category: CommandCategory.AI,
      keywords: ['explain', 'ai', 'file', 'understand'],
      icon: 'bot',
      requiredCapabilities: ['AIProviderConfigured'],
      isEnabled: () => false, // Placeholder
      execute: async () => {}
    },
    {
      id: 'ai.generateTests',
      title: 'Generate Tests',
      description: 'Automatically generate unit tests for the selected code',
      category: CommandCategory.AI,
      keywords: ['test', 'generate', 'ai', 'unit'],
      icon: 'beaker',
      requiredCapabilities: ['AIProviderConfigured'],
      isEnabled: () => false, // Placeholder
      execute: async () => {}
    },
    {
      id: 'ai.reviewChanges',
      title: 'Review Changes',
      description: 'AI code review of your uncommitted changes',
      category: CommandCategory.AI,
      keywords: ['review', 'code', 'ai', 'changes'],
      icon: 'eye',
      requiredCapabilities: ['AIProviderConfigured'],
      isEnabled: () => false, // Placeholder
      execute: async () => {}
    },
    {
      id: 'ai.generateCommitMessage',
      title: 'Generate Commit Message',
      description: 'AI generates a conventional commit message based on your diff',
      category: CommandCategory.AI,
      keywords: ['commit', 'message', 'ai', 'generate'],
      icon: 'edit',
      requiredCapabilities: ['RepositoryOpen'],
      isEnabled: () => {
        const proj = useProjectStore.getState().currentProject;
        return proj !== null && proj.gitStatus.isDirty;
      },
      execute: async () => {
        const store = useProjectStore.getState();
        const diff = await store.getGitDiff();
        
        if (!diff) {
          alert('No changes found to generate a commit message.');
          return;
        }

        let token = store.hfToken;
        if (!token) {
          token = window.prompt('Please enter your Hugging Face Access Token to use Qwen Coder:');
          if (!token) return;
          store.setHfToken(token);
        }

        try {
          const { HuggingFaceProvider } = await import('@unify/platform-ai/src/HuggingFaceProvider');
          const provider = new HuggingFaceProvider(token);
          
          store.setPendingCommitMessage('Generating commit message...');
          
          const response = await provider.sendMessage({
            messages: [
              { role: 'system', content: 'You are an expert developer. Generate a concise, conventional commit message based on the provided git diff. Do not include any explanations, only the commit message itself. Follow the format: type(scope): description.' },
              { role: 'user', content: `Here is the diff:\n${diff}` }
            ]
          });
          
          store.setPendingCommitMessage(response.content);
        } catch (err: any) {
          alert('Failed to generate commit message: ' + err.message);
          store.setPendingCommitMessage('');
        }
      }
    }
  ];

  commands.forEach(cmd => commandRegistry.register(cmd));
}
