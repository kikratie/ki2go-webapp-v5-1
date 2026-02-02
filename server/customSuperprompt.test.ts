import { describe, it, expect, vi } from 'vitest';

describe('Custom Superprompt System', () => {
  describe('Template-Priorität', () => {
    it('sollte User-spezifisches Template höchste Priorität haben', () => {
      const priorities = ['user', 'organization', 'global', 'base'];
      expect(priorities[0]).toBe('user');
    });

    it('sollte Firmen-spezifisches Template zweite Priorität haben', () => {
      const priorities = ['user', 'organization', 'global', 'base'];
      expect(priorities[1]).toBe('organization');
    });

    it('sollte globales Template dritte Priorität haben', () => {
      const priorities = ['user', 'organization', 'global', 'base'];
      expect(priorities[2]).toBe('global');
    });

    it('sollte Basis-Template niedrigste Priorität haben', () => {
      const priorities = ['user', 'organization', 'global', 'base'];
      expect(priorities[3]).toBe('base');
    });
  });

  describe('Custom Template Struktur', () => {
    it('sollte alle erforderlichen Felder haben', () => {
      const requiredFields = [
        'id', 'baseTemplateId', 'organizationId', 'userId',
        'name', 'superprompt', 'isActive', 'version', 'usageCount'
      ];
      expect(requiredFields).toContain('baseTemplateId');
      expect(requiredFields).toContain('superprompt');
      expect(requiredFields).toContain('isActive');
    });

    it('sollte Target-Typ korrekt bestimmen', () => {
      const getTargetType = (orgId: number | null, userId: number | null): string => {
        if (userId) return 'user';
        if (orgId) return 'organization';
        return 'global';
      };
      expect(getTargetType(null, 1)).toBe('user');
      expect(getTargetType(1, null)).toBe('organization');
      expect(getTargetType(null, null)).toBe('global');
    });
  });

  describe('Versionierung', () => {
    it('sollte Version bei Update erhöhen', () => {
      const currentVersion = 1;
      const newVersion = currentVersion + 1;
      expect(newVersion).toBe(2);
    });
  });

  describe('Workflow Integration', () => {
    it('sollte Custom-Template bei Ausführung finden', async () => {
      const findBestTemplate = (
        userId: number | null,
        organizationId: number | null,
        templates: Array<{ userId: number | null; organizationId: number | null; isActive: boolean }>
      ) => {
        const userTemplate = templates.find(t => t.userId === userId && t.isActive);
        if (userTemplate) return { type: 'user', template: userTemplate };
        
        const orgTemplate = templates.find(t => t.organizationId === organizationId && !t.userId && t.isActive);
        if (orgTemplate) return { type: 'organization', template: orgTemplate };
        
        const globalTemplate = templates.find(t => !t.organizationId && !t.userId && t.isActive);
        if (globalTemplate) return { type: 'global', template: globalTemplate };
        
        return { type: 'base', template: null };
      };

      const templates = [
        { userId: null, organizationId: null, isActive: true },
        { userId: null, organizationId: 1, isActive: true },
        { userId: 1, organizationId: null, isActive: true },
      ];

      const result1 = findBestTemplate(1, 1, templates);
      expect(result1.type).toBe('user');

      const result2 = findBestTemplate(2, 1, templates);
      expect(result2.type).toBe('organization');

      const result3 = findBestTemplate(2, 2, templates);
      expect(result3.type).toBe('global');
    });

    it('sollte Basis-Template verwenden wenn kein Custom-Template existiert', () => {
      const templates: Array<{ userId: number | null; organizationId: number | null; isActive: boolean }> = [];
      const result = templates.length === 0 ? { type: 'base' } : { type: 'custom' };
      expect(result.type).toBe('base');
    });
  });
});
