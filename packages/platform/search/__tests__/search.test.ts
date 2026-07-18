import { describe, it, expect, vi } from 'vitest';
import { SearchEngine } from '../src';
import type { ISearchProvider, SearchResult, SearchFilter } from '../src/types';

class MockSearchProvider implements ISearchProvider {
  constructor(public id: string, public name: string, public category: any) {}

  async search(query: string, filters: SearchFilter[]): Promise<SearchResult[]> {
    if (query === 'error') throw new Error('Provider failed');
    return [
      {
        id: `${this.id}-res`,
        title: `Match for ${query} in ${this.name}`,
        category: this.category,
        score: 0.9,
        action: () => {}
      }
    ];
  }
}

describe('SearchEngine', () => {
  it('should collect and sort search query results from providers', async () => {
    const engine = new SearchEngine();
    const p1 = new MockSearchProvider('cmd-prov', 'Command Search', 'command');
    const p2 = new MockSearchProvider('file-prov', 'File Search', 'file');

    engine.registerProvider(p1);
    engine.registerProvider(p2);

    const results = await engine.search({ text: 'open' });
    expect(results.total).toBe(2);
    expect(results.items.length).toBe(2);
    expect(results.items[0]!.score).toBe(0.9);
  });

  it('should filter search results by category', async () => {
    const engine = new SearchEngine();
    const p1 = new MockSearchProvider('cmd-prov', 'Command Search', 'command');
    const p2 = new MockSearchProvider('file-prov', 'File Search', 'file');

    engine.registerProvider(p1);
    engine.registerProvider(p2);

    const results = await engine.search({ text: 'open', filters: [{ category: 'command' }] });
    expect(results.total).toBe(1);
    expect(results.items[0]!.category).toBe('command');
  });
});
