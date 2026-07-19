import type { IWorkspaceKernel } from '@unify/kernel';
import { RepositoryScannerToken, RepositoryIndexerToken } from './types';
import { RepositoryScanner } from './Scanner';
import { RepositoryIndexer } from './RepositoryIndexer';
import { SymbolExtractor } from './SymbolExtractor';

export function registerIndexingServices(kernel: IWorkspaceKernel): void {
  kernel.register(RepositoryScannerToken, () => new RepositoryScanner(), 'singleton');
  
  kernel.register(RepositoryIndexerToken, () => {
    const scanner = kernel.get(RepositoryScannerToken);
    const extractor = new SymbolExtractor();
    return new RepositoryIndexer(scanner, extractor);
  }, 'singleton');
}
