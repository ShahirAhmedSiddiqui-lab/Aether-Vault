import { headers } from 'next/headers';
import { type NextRequest } from 'next/server';

function normalizeBaseUrl(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
}

function isLocalBaseUrl(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  try {
    const { hostname } = new URL(value);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

function resolvePreferredBaseUrl(runtimeOrigin: string | null | undefined) {
  const configuredPublicSiteUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);
  const configuredAppUrl = normalizeBaseUrl(process.env.APP_URL);
  const normalizedRuntimeOrigin = normalizeBaseUrl(runtimeOrigin);

  if (configuredPublicSiteUrl && !isLocalBaseUrl(configuredPublicSiteUrl)) {
    return configuredPublicSiteUrl;
  }

  if (configuredAppUrl && !isLocalBaseUrl(configuredAppUrl)) {
    return configuredAppUrl;
  }

  if (normalizedRuntimeOrigin && !isLocalBaseUrl(normalizedRuntimeOrigin)) {
    return normalizedRuntimeOrigin;
  }

  return configuredPublicSiteUrl || configuredAppUrl || normalizedRuntimeOrigin || 'http://localhost:3000';
}

export function resolveBaseUrlFromRequest(req: NextRequest) {
  return resolvePreferredBaseUrl(req.nextUrl.origin);
}

export async function resolveBaseUrlFromHeaders() {
  const headerStore = await headers();
  const forwardedProto = headerStore.get('x-forwarded-proto');
  const forwardedHost = headerStore.get('x-forwarded-host') || headerStore.get('host');
  const forwardedOrigin =
    forwardedProto && forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : headerStore.get('origin');

  return resolvePreferredBaseUrl(forwardedOrigin);
}
