/**
 * Strukturierte Datenablage für KI2GO
 * 
 * Pfad-Struktur:
 * - production/org-{orgId}/user-{userId}/{type}/{filename}
 * - testing/org-test/user-{userId}/{type}/{filename}
 * 
 * Typen:
 * - documents: Hochgeladene Dokumente
 * - results: Generierte Ergebnisse (PDFs, etc.)
 * - generated: KI-generierte Inhalte
 * - exports: Exportierte Dateien
 * - temp: Temporäre Dateien
 */

import { storagePut, storageGet } from './storage';

export type StorageType = 'documents' | 'results' | 'generated' | 'exports' | 'temp';

export interface StructuredStorageOptions {
  organizationId: string;
  userId: string;
  type: StorageType;
  filename: string;
  isTestMode?: boolean;
}

export interface StructuredStorageResult {
  key: string;
  url: string;
  path: string;
  isTestData: boolean;
}

/**
 * Generiert einen strukturierten Pfad für die Dateiablage
 */
export function buildStructuredPath(options: StructuredStorageOptions): string {
  const { organizationId, userId, type, filename, isTestMode = false } = options;
  
  // Sanitize filename - entferne ungültige Zeichen
  const sanitizedFilename = filename
    .replace(/[^a-zA-Z0-9äöüÄÖÜß._-]/g, '_')
    .replace(/_{2,}/g, '_');
  
  // Generiere Timestamp für Eindeutigkeit
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  
  // Füge Timestamp zum Dateinamen hinzu (vor der Extension)
  const parts = sanitizedFilename.split('.');
  const extension = parts.length > 1 ? `.${parts.pop()}` : '';
  const baseName = parts.join('.');
  const uniqueFilename = `${baseName}_${timestamp}_${randomSuffix}${extension}`;
  
  if (isTestMode) {
    // Test-Daten: testing/org-test/user-{userId}/{type}/{filename}
    return `testing/org-test/user-${userId}/${type}/${uniqueFilename}`;
  } else {
    // Produktions-Daten: production/org-{orgId}/user-{userId}/{type}/{filename}
    return `production/org-${organizationId}/user-${userId}/${type}/${uniqueFilename}`;
  }
}

/**
 * Speichert eine Datei mit strukturiertem Pfad
 */
export async function structuredStoragePut(
  options: StructuredStorageOptions,
  data: Buffer | Uint8Array | string,
  contentType = 'application/octet-stream'
): Promise<StructuredStorageResult> {
  const path = buildStructuredPath(options);
  const result = await storagePut(path, data, contentType);
  
  return {
    key: result.key,
    url: result.url,
    path,
    isTestData: options.isTestMode ?? false,
  };
}

/**
 * Holt eine Datei über den strukturierten Pfad
 */
export async function structuredStorageGet(
  path: string
): Promise<{ key: string; url: string }> {
  return storageGet(path);
}

/**
 * Generiert einen Pfad für ein bestimmtes Dokument
 */
export function getDocumentPath(
  organizationId: string,
  userId: string,
  filename: string,
  isTestMode = false
): string {
  return buildStructuredPath({
    organizationId,
    userId,
    type: 'documents',
    filename,
    isTestMode,
  });
}

/**
 * Generiert einen Pfad für ein Ergebnis
 */
export function getResultPath(
  organizationId: string,
  userId: string,
  filename: string,
  isTestMode = false
): string {
  return buildStructuredPath({
    organizationId,
    userId,
    type: 'results',
    filename,
    isTestMode,
  });
}

/**
 * Generiert einen Pfad für generierte Inhalte
 */
export function getGeneratedPath(
  organizationId: string,
  userId: string,
  filename: string,
  isTestMode = false
): string {
  return buildStructuredPath({
    organizationId,
    userId,
    type: 'generated',
    filename,
    isTestMode,
  });
}

/**
 * Generiert einen Pfad für Exporte
 */
export function getExportPath(
  organizationId: string,
  userId: string,
  filename: string,
  isTestMode = false
): string {
  return buildStructuredPath({
    organizationId,
    userId,
    type: 'exports',
    filename,
    isTestMode,
  });
}

/**
 * Prüft ob ein Pfad zu Test-Daten gehört
 */
export function isTestPath(path: string): boolean {
  return path.startsWith('testing/');
}

/**
 * Prüft ob ein Pfad zu Produktions-Daten gehört
 */
export function isProductionPath(path: string): boolean {
  return path.startsWith('production/');
}

/**
 * Extrahiert Metadaten aus einem strukturierten Pfad
 */
export function parseStructuredPath(path: string): {
  environment: 'testing' | 'production' | 'unknown';
  organizationId: string | null;
  userId: string | null;
  type: StorageType | null;
  filename: string | null;
} {
  const parts = path.split('/');
  
  if (parts.length < 5) {
    return {
      environment: 'unknown',
      organizationId: null,
      userId: null,
      type: null,
      filename: null,
    };
  }
  
  const environment = parts[0] === 'testing' ? 'testing' : 
                      parts[0] === 'production' ? 'production' : 'unknown';
  
  // org-{id} oder org-test
  const orgPart = parts[1];
  const organizationId = orgPart.startsWith('org-') ? orgPart.substring(4) : null;
  
  // user-{id}
  const userPart = parts[2];
  const userId = userPart.startsWith('user-') ? userPart.substring(5) : null;
  
  // type
  const type = ['documents', 'results', 'generated', 'exports', 'temp'].includes(parts[3])
    ? parts[3] as StorageType
    : null;
  
  // filename (alles nach dem type)
  const filename = parts.slice(4).join('/');
  
  return {
    environment,
    organizationId,
    userId,
    type,
    filename,
  };
}

/**
 * Listet alle Dateien für eine Organisation/User (Hilfsfunktion für zukünftige Implementierung)
 * Hinweis: Die tatsächliche Implementierung hängt von der S3-API ab
 */
export function buildListPrefix(
  organizationId: string,
  userId?: string,
  type?: StorageType,
  isTestMode = false
): string {
  const base = isTestMode ? 'testing/org-test' : `production/org-${organizationId}`;
  
  if (userId && type) {
    return `${base}/user-${userId}/${type}/`;
  } else if (userId) {
    return `${base}/user-${userId}/`;
  } else {
    return `${base}/`;
  }
}
