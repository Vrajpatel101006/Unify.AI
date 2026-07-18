import { describe, it, expect } from 'vitest';
import { WorkspaceDatabase } from '../src';

describe('WorkspaceDatabase', () => {
  it('should execute get, put, query, and delete operations', async () => {
    const db = new WorkspaceDatabase();

    await db.put('projects', 'proj-1', { name: 'Unify.AI', path: '/var/unify' });
    const proj = await db.get<any>('projects', 'proj-1');
    expect(proj).toBeDefined();
    expect(proj.name).toBe('Unify.AI');

    const matches = await db.query<any>('projects', (item) => item.name.includes('Unify'));
    expect(matches.length).toBe(1);

    await db.delete('projects', 'proj-1');
    expect(await db.get('projects', 'proj-1')).toBeUndefined();
  });
});
