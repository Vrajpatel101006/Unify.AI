/**
 * @unify/platform-indexing — Repository indexing, dependency graph, architecture graph.
 */

import type { Disposable } from '@unify/kernel';

export interface FileEntry {
  path: string;
  name: string;
  language: string;
  size: number;
  lastModified: number;
}

export interface DependencyNode {
  id: string;
  name: string;
  version?: string;
  type: 'package' | 'module' | 'file';
  dependencies: string[];
}

export interface DependencyGraph {
  nodes: DependencyNode[];
}

export interface ArchitectureNode {
  id: string;
  name: string;
  type: 'directory' | 'module' | 'class' | 'function' | 'interface';
  children: string[];
  filePath: string;
}

export interface ArchitectureGraph {
  nodes: ArchitectureNode[];
}

export interface LanguageStats {
  [language: string]: {
    files: number;
    lines: number;
    percentage: number;
  };
}

export interface RepositoryIndex {
  rootPath: string;
  files: FileEntry[];
  dependencies: DependencyGraph;
  architecture: ArchitectureGraph;
  languages: LanguageStats;
  lastIndexed: number;
}

export interface IRepositoryIndexer {
  indexRepository(path: string): Promise<RepositoryIndex>;
  getIndex(path: string): RepositoryIndex | undefined;
  invalidate(path: string): void;
  onIndexChange(handler: (index: RepositoryIndex) => void): Disposable;
}
