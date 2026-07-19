import * as fs from 'fs';
import * as path from 'path';
import { IRepositoryIndexer, RepositoryIndex, IRepositoryScanner, FileEntry } from './types';
import { SymbolExtractor } from './SymbolExtractor';
import { Disposable } from '@unify/kernel';

export class RepositoryIndexer implements IRepositoryIndexer {
  private indexCache = new Map<string, RepositoryIndex>();
  private handlers: Array<(index: RepositoryIndex) => void> = [];
  
  constructor(
    private scanner: IRepositoryScanner,
    private extractor: SymbolExtractor
  ) {}

  public async indexRepository(rootPath: string): Promise<RepositoryIndex> {
    const scanResult = await this.scanner.scan(rootPath);
    const files: FileEntry[] = [];
    const architectureNodes = [];

    // Simple recursive traversal for Phase 1
    // We only scan .ts and .js files in 'src' directory as a starting point
    const srcPath = path.join(rootPath, 'src');
    if (fs.existsSync(srcPath)) {
      this.traverseDirectory(srcPath, files, architectureNodes);
    }

    const index: RepositoryIndex = {
      rootPath,
      files,
      dependencies: scanResult.dependencies,
      languages: scanResult.languages,
      frameworks: scanResult.frameworks,
      architecture: { nodes: architectureNodes },
      lastIndexed: Date.now()
    };

    this.indexCache.set(rootPath, index);
    this.notifyHandlers(index);
    
    return index;
  }

  private traverseDirectory(dir: string, files: FileEntry[], architectureNodes: any[]) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.traverseDirectory(fullPath, files, architectureNodes);
      } else {
        const ext = path.extname(entry);
        if (['.ts', '.js', '.tsx', '.jsx'].includes(ext)) {
          files.push({
            path: fullPath,
            name: entry,
            language: ext.slice(1),
            size: stat.size,
            lastModified: stat.mtimeMs
          });
          
          const symbols = this.extractor.extractSymbols(fullPath);
          architectureNodes.push(...symbols);
        }
      }
    }
  }

  public getIndex(path: string): RepositoryIndex | undefined {
    return this.indexCache.get(path);
  }

  public invalidate(path: string): void {
    this.indexCache.delete(path);
  }

  public onIndexChange(handler: (index: RepositoryIndex) => void): Disposable {
    this.handlers.push(handler);
    return {
      dispose: () => {
        const idx = this.handlers.indexOf(handler);
        if (idx !== -1) {
          this.handlers.splice(idx, 1);
        }
      }
    };
  }

  private notifyHandlers(index: RepositoryIndex) {
    for (const handler of this.handlers) {
      handler(index);
    }
  }
}
