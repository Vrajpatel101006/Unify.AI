import { describe, it, expect, vi } from 'vitest';
import { ContextEngine } from '../src';
import type { FileInfo } from '../src/types';

describe('ContextEngine', () => {
  it('should get, set and trigger change listeners', () => {
    const engine = new ContextEngine();
    const mockListener = vi.fn();

    engine.onChange('currentFolder', mockListener);
    
    expect(engine.get('currentFolder')).toBeNull();
    
    engine.set('currentFolder', '/workspace/unify');
    expect(engine.get('currentFolder')).toBe('/workspace/unify');
    expect(mockListener).toHaveBeenCalledWith('/workspace/unify');
  });

  it('should evaluate when expression clauses correctly', () => {
    const engine = new ContextEngine();
    engine.set('language', 'typescript');
    engine.set('currentFolder', null);

    expect(engine.evaluate('language == typescript')).toBe(true);
    expect(engine.evaluate('language != javascript')).toBe(true);
    expect(engine.evaluate('!currentFolder')).toBe(true);
    expect(engine.evaluate('language')).toBe(true);
  });
});
