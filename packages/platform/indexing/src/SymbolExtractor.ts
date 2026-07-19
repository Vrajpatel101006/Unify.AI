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
      
      // Helper to add symbols
      const addSymbol = (name: string, type: string) => {
        // Basic detection for Controllers, Services, Repositories, etc.
        let subType = type;
        if (type === 'class' || type === 'interface') {
          if (name.endsWith('Controller')) subType = 'controller';
          else if (name.endsWith('Service')) subType = 'service';
          else if (name.endsWith('Repository')) subType = 'repository';
          else if (name.endsWith('Dto') || name.endsWith('DTO')) subType = 'dto';
          else if (name.endsWith('Entity')) subType = 'entity';
        }

        symbols.push({
          id: `${subType}:${name}`,
          name,
          type: subType,
          children: [],
          filePath
        });
      };

      // Look for classes
      const classRegex = /class\s+([A-Za-z0-9_]+)/g;
      let match;
      while ((match = classRegex.exec(content)) !== null) {
        addSymbol(match[1], 'class');
      }

      // Look for interfaces
      const interfaceRegex = /interface\s+([A-Za-z0-9_]+)/g;
      while ((match = interfaceRegex.exec(content)) !== null) {
        addSymbol(match[1], 'interface');
      }

      // Look for enums
      const enumRegex = /enum\s+([A-Za-z0-9_]+)/g;
      while ((match = enumRegex.exec(content)) !== null) {
        addSymbol(match[1], 'enum');
      }

      // Look for types
      const typeRegex = /type\s+([A-Za-z0-9_]+)\s*=/g;
      while ((match = typeRegex.exec(content)) !== null) {
        addSymbol(match[1], 'type');
      }

      // Look for namespaces
      const namespaceRegex = /namespace\s+([A-Za-z0-9_]+)/g;
      while ((match = namespaceRegex.exec(content)) !== null) {
        addSymbol(match[1], 'namespace');
      }

      // Look for standard functions
      const functionRegex = /function\s+([A-Za-z0-9_]+)/g;
      while ((match = functionRegex.exec(content)) !== null) {
        addSymbol(match[1], 'function');
      }

      // Look for arrow functions (export const Name = ...)
      const arrowRegex = /export\s+const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_]+)\s*=>/g;
      while ((match = arrowRegex.exec(content)) !== null) {
        addSymbol(match[1], 'function');
      }
    } catch (err) {
      console.error(`Error extracting symbols from ${filePath}`, err);
    }
    
    return symbols;
  }
}
