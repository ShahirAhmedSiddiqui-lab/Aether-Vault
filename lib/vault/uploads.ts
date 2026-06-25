import { ApiRouteError } from '@/lib/api/errors';
import { type UploadedFileData } from '@/lib/vault/ingestion';

export const MAX_VAULT_UPLOAD_SIZE = 25 * 1024 * 1024;
export const ALLOWED_VAULT_UPLOAD_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/mpeg',
  'audio/mp3',
  'audio/webm',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/m4a',
  'audio/ogg',
]);

export function validateVaultUpload(fileData: UploadedFileData | undefined) {
  if (!fileData) {
    return;
  }

  if (!fileData.base64 || !fileData.mimeType) {
    throw new ApiRouteError(400, 'File upload payload is invalid.', {
      code: 'invalid_upload',
    });
  }

  if (!ALLOWED_VAULT_UPLOAD_MIME_TYPES.has(fileData.mimeType)) {
    throw new ApiRouteError(
      400,
      'Uploads must be a PDF, image, or supported audio file.',
      {
        code: 'invalid_upload_type',
        details: {
          mimeType: fileData.mimeType,
        },
      }
    );
  }

  const actualSize = getBase64ByteSize(fileData.base64);
  const declaredSize = typeof fileData.size === 'number' && fileData.size > 0 ? fileData.size : actualSize;

  if (Math.abs(declaredSize - actualSize) > 1024) {
    throw new ApiRouteError(400, 'Uploaded file metadata does not match the payload.', {
      code: 'invalid_upload_size',
    });
  }

  if (actualSize > MAX_VAULT_UPLOAD_SIZE) {
    throw new ApiRouteError(400, 'Uploads must be 25 MB or smaller.', {
      code: 'upload_too_large',
      details: {
        maxBytes: MAX_VAULT_UPLOAD_SIZE,
      },
    });
  }
}

export function coerceUploadedFileData(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiRouteError(400, 'File upload payload is invalid.', {
      code: 'invalid_upload',
    });
  }

  const data = value as Record<string, unknown>;

  return {
    base64: typeof data.base64 === 'string' ? data.base64 : '',
    mimeType: typeof data.mimeType === 'string' ? data.mimeType : '',
    name: typeof data.name === 'string' ? data.name : undefined,
    size: typeof data.size === 'number' ? data.size : undefined,
  } satisfies UploadedFileData;
}

function getBase64ByteSize(value: string) {
  const normalized = value.replace(/\s/g, '');
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0;
  return Math.floor((normalized.length * 3) / 4) - padding;
}
