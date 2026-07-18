/**
 * SearchEngine — coordinates global unified search.
 *
 * Registers search providers (commands, files, database, settings).
 */

import type { Disposable } from '@unify/kernel';
import type { ISearchEngine, ISearchProvider, SearchQuery, SearchResults, SearchResult } from './types';

export class SearchEngine implements ISearchEngine {
  private readonly _providers = new Map<string, ISearchProvider>();

  async search(query: SearchQuery): Promise<SearchResults> {
    const startTime = Date.now();
    const allResults: SearchResult[] = [];

    const searchPromises = Array.from(this._providers.values()).map(async (provider) => {
      // Filter by category if specified
      if (query.filters) {
        const catFilter = query.filters.find((f) => f.category);
        if (catFilter && catFilter.category !== provider.category) {
          return;
        }
      }

      try {
        const results = await provider.search(query.text, query.filters || []);
        allResults.push(...results);
      } catch (err) {
        console.error(`[SearchEngine] Error searching provider "${provider.id}":`, err);
      }
    });

    await Promise.all(searchPromises);

    // Sort by match score descending
    const sorted = allResults.sort((a, b) => b.score - a.score);
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    const items = sorted.slice(offset, offset + limit);

    return {
      items,
      total: sorted.length,
      queryTimeMs: Date.now() - startTime,
    };
  }

  registerProvider(provider: ISearchProvider): Disposable {
    if (this._providers.has(provider.id)) {
      throw new Error(`[SearchEngine] Search provider already registered: "${provider.id}"`);
    }

    this._providers.set(provider.id, provider);
    return {
      dispose: () => {
        this._providers.delete(provider.id);
      },
    };
  }

  getProviders(): ISearchProvider[] {
    return Array.from(this._providers.values());
  }

  async reindex(): Promise<void> {
    for (const provider of this._providers.values()) {
      if (provider.index) {
        try {
          await provider.index();
        } catch (err) {
          console.error(`[SearchEngine] Reindex failed for provider "${provider.id}":`, err);
        }
      }
    }
  }
}
