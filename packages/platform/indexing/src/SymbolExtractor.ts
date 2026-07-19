import * as fs from 'fs';
import * as path from 'path';
import { ArchitectureNode } from './types';

export class SymbolExtractor {
  public extractSymbols(filePath: string): ArchitectureNode[] {
    const symbols: ArchitectureNode[] = [];
    
    // Naive implementation for Phase 1: Regex based extraction
    // In Phase 2, this should be replaced with Tree-sitter or similar AST parser
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Look for classes
      const classRegex = /class\s+([A-Za-z0-9_]+)/g;
      let match;
      while ((match = classRegex.exec(content)) !== null) {
        symbols.push({
          id: `class:${match[1]}`,
          name: match[1],
          type: 'class',
          children: [],
          filePath
        });
      }

      // Look for interfaces
      const interfaceRegex = /interface\s+([A-Za-z0-9_]+)/g;
      while ((match = interfaceRegex.exec(content)) !== null) {
        symbols.push({
          id: `interface:${match[1]}`,
          name: match[1],
          type: 'interface',
          children: [],
          filePath
        });
      }
    } catch (err) {
      console.error(`Error extracting symbols from ${filePath}`, err);
    }
    
    return symbols;
  }
}
