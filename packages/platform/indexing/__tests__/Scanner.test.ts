import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RepositoryScanner } from '../src/Scanner';

vi.mock('fs');
vi.mock('path');

describe('RepositoryScanner', () => {
  let scanner: RepositoryScanner;

  beforeEach(() => {
    scanner = new RepositoryScanner();
    vi.resetAllMocks();
    
    // Default mocks
    (path.join as any).mockImplementation((...args: string[]) => args.join('/'));
  });

  it('detects NPM frameworks correctly from package.json', async () => {
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockReturnValue(JSON.stringify({
      dependencies: {
        react: '^18.0.0',
      },
      devDependencies: {
        tailwindcss: '^3.0.0'
      }
    }));

    const result = await scanner.scan('/mock/path');

    expect(result.frameworks).toHaveLength(2);
    expect(result.frameworks.find(f => f.name === 'React')).toBeDefined();
    expect(result.frameworks.find(f => f.name === 'Tailwind CSS')).toBeDefined();
    
    expect(result.dependencies.nodes).toHaveLength(2);
    expect(result.dependencies.nodes.find(n => n.name === 'react')).toBeDefined();
  });

  it('handles missing package.json gracefully', async () => {
    (fs.existsSync as any).mockReturnValue(false);

    const result = await scanner.scan('/mock/path');
    
    expect(result.frameworks).toHaveLength(0);
    expect(result.dependencies.nodes).toHaveLength(0);
  });
});
