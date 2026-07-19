import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RepositoryIndexer } from '../src/RepositoryIndexer';
import { SymbolExtractor } from '../src/SymbolExtractor';
import { IRepositoryScanner } from '../src/types';

vi.mock('fs');
vi.mock('path');

describe('RepositoryIndexer', () => {
  let indexer: RepositoryIndexer;
  let mockScanner: IRepositoryScanner;
  let extractor: SymbolExtractor;

  beforeEach(() => {
    vi.resetAllMocks();
    mockScanner = {
      scan: vi.fn().mockResolvedValue({
        frameworks: [],
        languages: {},
        dependencies: { nodes: [] }
      })
    };
    extractor = new SymbolExtractor();
    indexer = new RepositoryIndexer(mockScanner, extractor);
    
    (path.join as any).mockImplementation((...args: string[]) => args.join('/'));
    (path.extname as any).mockImplementation((f: string) => {
      const idx = f.lastIndexOf('.');
      return idx !== -1 ? f.substring(idx) : '';
    });
  });

  it('indexes src directory if it exists', async () => {
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readdirSync as any).mockReturnValue(['testFile.ts']);
    (fs.statSync as any).mockReturnValue({
      isDirectory: () => false,
      size: 100,
      mtimeMs: 12345
    });
    
    // Mock symbol extractor
    vi.spyOn(extractor, 'extractSymbols').mockReturnValue([
      { id: 'class:MyClass', name: 'MyClass', type: 'class', children: [], filePath: '/mock/src/testFile.ts' }
    ]);

    const result = await indexer.indexRepository('/mock');

    expect(result.files).toHaveLength(1);
    expect(result.files[0].name).toBe('testFile.ts');
    expect(result.architecture.nodes).toHaveLength(1);
    expect(result.architecture.nodes[0].name).toBe('MyClass');
  });
});
