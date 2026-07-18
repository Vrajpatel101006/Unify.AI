/**
 * @unify/platform-search — Universal search with indexing, ranking, and filters.
 */

import type { Disposable } from '@unify/kernel';

export type SearchCategory = 'command' | 'file' | 'prompt' | 'sql' | 'api' | 'documentation' | 'setting' | 'history' | 'plugin';

export interface SearchFilter {
  category?: SearchCategory;
  dateRange?: { from: number; to: number };
  tags?: string[];
}

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: SearchCategory;
  icon?: string;
  score: number;
  action: () => void;
  metadata?: Record<string, unknown>;
}

export interface SearchQuery {
  text: string;
  filters?: SearchFilter[];
  limit?: number;
  offset?: number;
}

export interface SearchResults {
  items: SearchResult[];
  total: number;
  queryTimeMs: number;
}

export interface ISearchProvider {
  id: string;
  name: string;
  category: SearchCategory;
  search(query: string, filters: SearchFilter[]): Promise<SearchResult[]>;
  index?(): Promise<void>;
}

export interface ISearchEngine {
  search(query: SearchQuery): Promise<SearchResults>;
  registerProvider(provider: ISearchProvider): Disposable;
  getProviders(): ISearchProvider[];
  reindex(): Promise<void>;
}

export interface IIndexer {
  addDocument(doc: IndexDocument): void;
  removeDocument(id: string): void;
  search(query: string, options?: IndexSearchOptions): IndexSearchResult[];
  rebuild(): Promise<void>;
  getStats(): IndexStats;
}

export interface IndexDocument {
  id: string;
  content: string;
  category: SearchCategory;
  metadata?: Record<string, unknown>;
}

export interface IndexSearchOptions {
  limit?: number;
  category?: SearchCategory;
  fuzzy?: boolean;
}

export interface IndexSearchResult {
  documentId: string;
  score: number;
  highlights: string[];
}

export interface IndexStats {
  documentCount: number;
  lastRebuilt: number;
}

export interface IRanker {
  rank(results: SearchResult[], query: string): SearchResult[];
}
