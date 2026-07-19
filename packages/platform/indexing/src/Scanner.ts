import * as fs from 'fs';
import * as path from 'path';
import { IRepositoryScanner, FrameworkMetadata, LanguageStats, DependencyGraph } from './types';

export class RepositoryScanner implements IRepositoryScanner {
  public async scan(rootPath: string): Promise<{
    frameworks: FrameworkMetadata[];
    languages: LanguageStats;
    dependencies: DependencyGraph;
  }> {
    const frameworks: FrameworkMetadata[] = [];
    const dependencies: DependencyGraph = { nodes: [] };
    const languages: LanguageStats = {};

    // Very naive implementation for Phase 1
    // We check for package.json to detect Node.js / NPM frameworks
    const packageJsonPath = path.join(rootPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const content = fs.readFileSync(packageJsonPath, 'utf-8');
        const pkg = JSON.parse(content);
        
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        // Detect React
        if (allDeps['react']) {
          frameworks.push({ name: 'React', version: allDeps['react'], ecosystem: 'npm' });
        }
        // Detect Vite
        if (allDeps['vite']) {
          frameworks.push({ name: 'Vite', version: allDeps['vite'], ecosystem: 'npm' });
        }
        // Detect Tailwind
        if (allDeps['tailwindcss']) {
          frameworks.push({ name: 'Tailwind CSS', version: allDeps['tailwindcss'], ecosystem: 'npm' });
        }
        // Detect Electron
        if (allDeps['electron']) {
          frameworks.push({ name: 'Electron', version: allDeps['electron'], ecosystem: 'npm' });
        }
        
        // Push dependencies to dependency graph
        for (const [dep, version] of Object.entries(allDeps)) {
          dependencies.nodes.push({
            id: `npm:${dep}`,
            name: dep,
            version: version as string,
            type: 'package',
            dependencies: []
          });
        }
      } catch (err) {
        console.error('Error parsing package.json', err);
      }
    }

    return {
      frameworks,
      languages,
      dependencies
    };
  }
}
