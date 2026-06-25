import { ApiRouteError } from '@/lib/api/errors';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type StringOptions = {
  field: string;
  minLength?: number;
  maxLength?: number;
  trim?: boolean;
  allowEmpty?: boolean;
};

export async function readJsonBody(req: Request) {
  try {
    return await req.json();
  } catch (error) {
    throw new ApiRouteError(400, 'Request body must be valid JSON.', {
      code: 'invalid_json',
      cause: error,
    });
  }
}

export function ensureObject(value: unknown, field = 'body') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiRouteError(400, `${capitalize(field)} must be an object.`, {
      code: 'invalid_payload',
    });
  }

  return value as Record<string, unknown>;
}

export function readRequiredString(value: unknown, options: StringOptions) {
  const normalized = normalizeString(value, options);

  if (!normalized && !options.allowEmpty) {
    throw new ApiRouteError(400, `${options.field} is required.`, {
      code: 'validation_error',
      details: {
        field: options.field,
      },
    });
  }

  if (options.minLength && normalized.length < options.minLength) {
    throw new ApiRouteError(
      400,
      `${options.field} must be at least ${options.minLength} characters long.`,
      {
        code: 'validation_error',
        details: {
          field: options.field,
          minLength: options.minLength,
        },
      }
    );
  }

  if (options.maxLength && normalized.length > options.maxLength) {
    throw new ApiRouteError(
      400,
      `${options.field} must be ${options.maxLength} characters or fewer.`,
      {
        code: 'validation_error',
        details: {
          field: options.field,
          maxLength: options.maxLength,
        },
      }
    );
  }

  return normalized;
}

export function readOptionalString(value: unknown, options: StringOptions) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return readRequiredString(value, {
    ...options,
    allowEmpty: options.allowEmpty ?? true,
  });
}

export function readEmail(value: unknown, field = 'Email') {
  const email = readRequiredString(value, {
    field,
    maxLength: 320,
  }).toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    throw new ApiRouteError(400, 'Email address is invalid.', {
      code: 'validation_error',
      details: {
        field,
      },
    });
  }

  return email;
}

export function readBoolean(value: unknown, field: string) {
  if (typeof value !== 'boolean') {
    throw new ApiRouteError(400, `${field} must be true or false.`, {
      code: 'validation_error',
      details: {
        field,
      },
    });
  }

  return value;
}

export function readOptionalBoolean(value: unknown, field: string) {
  if (value === undefined) {
    return undefined;
  }

  return readBoolean(value, field);
}

export function readUuid(value: unknown, field: string) {
  const id = readRequiredString(value, {
    field,
  });

  if (!UUID_REGEX.test(id)) {
    throw new ApiRouteError(400, `${field} is invalid.`, {
      code: 'validation_error',
      details: {
        field,
      },
    });
  }

  return id;
}

export function readOptionalObject(value: unknown, field: string) {
  if (value === undefined) {
    return undefined;
  }

  return ensureObject(value, field);
}

export function readEnumValue<T extends string>(value: unknown, field: string, allowed: readonly T[]) {
  const normalized = readRequiredString(value, { field });

  if (!allowed.includes(normalized as T)) {
    throw new ApiRouteError(400, `${field} is invalid.`, {
      code: 'validation_error',
      details: {
        field,
        allowed,
      },
    });
  }

  return normalized as T;
}

function normalizeString(value: unknown, options: StringOptions) {
  const raw = typeof value === 'string' ? value : String(value ?? '');
  return options.trim === false ? raw : raw.trim();
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
