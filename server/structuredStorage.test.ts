import { describe, it, expect } from 'vitest';
import {
  buildStructuredPath,
  parseStructuredPath,
  isTestPath,
  isProductionPath,
  buildListPrefix,
} from './structuredStorage';

describe('structuredStorage', () => {
  describe('buildStructuredPath', () => {
    it('sollte einen Produktions-Pfad erstellen', () => {
      const path = buildStructuredPath({
        organizationId: 'org123',
        userId: 'user456',
        type: 'documents',
        filename: 'test.pdf',
        isTestMode: false,
      });
      
      expect(path).toMatch(/^production\/org-org123\/user-user456\/documents\/test_\d+_[a-z0-9]+\.pdf$/);
    });
    
    it('sollte einen Test-Pfad erstellen', () => {
      const path = buildStructuredPath({
        organizationId: 'org123',
        userId: 'user456',
        type: 'documents',
        filename: 'test.pdf',
        isTestMode: true,
      });
      
      expect(path).toMatch(/^testing\/org-test\/user-user456\/documents\/test_\d+_[a-z0-9]+\.pdf$/);
    });
    
    it('sollte ungültige Zeichen im Dateinamen ersetzen', () => {
      const path = buildStructuredPath({
        organizationId: 'org123',
        userId: 'user456',
        type: 'documents',
        filename: 'test file (1).pdf',
        isTestMode: false,
      });
      
      // Leerzeichen und Klammern werden zu Unterstrichen
      // Es kann noch ein doppelter Unterstrich zwischen 1 und timestamp bleiben
      expect(path).toMatch(/^production\/org-org123\/user-user456\/documents\/test_file_1__?\d+_[a-z0-9]+\.pdf$/);
    });
    
    it('sollte verschiedene Typen unterstützen', () => {
      const types = ['documents', 'results', 'generated', 'exports', 'temp'] as const;
      
      types.forEach(type => {
        const path = buildStructuredPath({
          organizationId: 'org123',
          userId: 'user456',
          type,
          filename: 'file.txt',
          isTestMode: false,
        });
        
        expect(path).toContain(`/${type}/`);
      });
    });
    
    it('sollte Dateien ohne Extension verarbeiten', () => {
      const path = buildStructuredPath({
        organizationId: 'org123',
        userId: 'user456',
        type: 'documents',
        filename: 'README',
        isTestMode: false,
      });
      
      expect(path).toMatch(/^production\/org-org123\/user-user456\/documents\/README_\d+_[a-z0-9]+$/);
    });
    
    it('sollte Umlaute im Dateinamen erlauben', () => {
      const path = buildStructuredPath({
        organizationId: 'org123',
        userId: 'user456',
        type: 'documents',
        filename: 'Übersicht.pdf',
        isTestMode: false,
      });
      
      expect(path).toContain('Übersicht');
    });
  });
  
  describe('parseStructuredPath', () => {
    it('sollte einen Produktions-Pfad parsen', () => {
      const result = parseStructuredPath('production/org-org123/user-user456/documents/test_123_abc.pdf');
      
      expect(result.environment).toBe('production');
      expect(result.organizationId).toBe('org123');
      expect(result.userId).toBe('user456');
      expect(result.type).toBe('documents');
      expect(result.filename).toBe('test_123_abc.pdf');
    });
    
    it('sollte einen Test-Pfad parsen', () => {
      const result = parseStructuredPath('testing/org-test/user-owner/results/report.pdf');
      
      expect(result.environment).toBe('testing');
      expect(result.organizationId).toBe('test');
      expect(result.userId).toBe('owner');
      expect(result.type).toBe('results');
      expect(result.filename).toBe('report.pdf');
    });
    
    it('sollte ungültige Pfade erkennen', () => {
      const result = parseStructuredPath('invalid/path');
      
      expect(result.environment).toBe('unknown');
      expect(result.organizationId).toBeNull();
      expect(result.userId).toBeNull();
      expect(result.type).toBeNull();
    });
  });
  
  describe('isTestPath / isProductionPath', () => {
    it('sollte Test-Pfade erkennen', () => {
      expect(isTestPath('testing/org-test/user-123/documents/file.pdf')).toBe(true);
      expect(isTestPath('production/org-123/user-456/documents/file.pdf')).toBe(false);
    });
    
    it('sollte Produktions-Pfade erkennen', () => {
      expect(isProductionPath('production/org-123/user-456/documents/file.pdf')).toBe(true);
      expect(isProductionPath('testing/org-test/user-123/documents/file.pdf')).toBe(false);
    });
  });
  
  describe('buildListPrefix', () => {
    it('sollte Präfix für Organisation erstellen', () => {
      const prefix = buildListPrefix('org123');
      expect(prefix).toBe('production/org-org123/');
    });
    
    it('sollte Präfix für User erstellen', () => {
      const prefix = buildListPrefix('org123', 'user456');
      expect(prefix).toBe('production/org-org123/user-user456/');
    });
    
    it('sollte Präfix für Typ erstellen', () => {
      const prefix = buildListPrefix('org123', 'user456', 'documents');
      expect(prefix).toBe('production/org-org123/user-user456/documents/');
    });
    
    it('sollte Test-Präfix erstellen', () => {
      const prefix = buildListPrefix('org123', 'user456', 'documents', true);
      expect(prefix).toBe('testing/org-test/user-user456/documents/');
    });
  });
});
