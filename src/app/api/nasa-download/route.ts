import type { NextRequest } from "next/server";

const ALLOWED_HOST_SUFFIXES = ["nasa.gov", "amazonaws.com", "cloudfront.net"];

function isAllowedHost(hostname: string) {
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`),
  );
}

function getFilenameFromUrl(url: string) {
  const pathSegment = url.split("?")[0]?.split("/").pop();
  return pathSegment || "nasa-asset";
}

function sanitizeFilename(value: string) {
  const normalized = value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return normalized || "nasa-asset";
}

function getExtensionFromFilename(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext && ext !== filename.toLowerCase() ? ext : "";
}

function getExtensionFromContentType(contentType: string) {
  const mime = contentType.split(";")[0]?.trim().toLowerCase();

  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/tiff": "tif",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/aac": "aac",
    "audio/flac": "flac",
    "application/pdf": "pdf",
  };

  return mime ? (map[mime] ?? "") : "";
}

function ensureFilenameExtension(
  filename: string,
  sourceUrl: string,
  contentType: string,
) {
  if (getExtensionFromFilename(filename)) return filename;

  const fromUrl = getExtensionFromFilename(getFilenameFromUrl(sourceUrl));
  const fromType = getExtensionFromContentType(contentType);
  const ext = fromUrl || fromType;

  return ext ? `${filename}.${ext}` : filename;
}

async function buildDownloadResponse(
  sourceUrl: string,
  providedFilename: string | null,
) {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    return new Response("Only http/https urls are allowed", { status: 400 });
  }

  if (!isAllowedHost(parsedUrl.hostname)) {
    return new Response("Host is not allowed", { status: 400 });
  }

  const normalizedSourceUrl =
    parsedUrl.protocol === "http:"
      ? `https://${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}`
      : sourceUrl;

  try {
    const upstream = await fetch(normalizedSourceUrl, { cache: "no-store" });

    if (!upstream.ok) {
      return new Response("Could not fetch source asset", { status: 502 });
    }

    if (!upstream.body) {
      return new Response("Asset stream unavailable", { status: 502 });
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstream.headers.get("content-length");

    const fallbackFilename = getFilenameFromUrl(normalizedSourceUrl);
    const safeFilename = sanitizeFilename(providedFilename || fallbackFilename);
    const filenameWithExtension = ensureFilenameExtension(
      safeFilename,
      normalizedSourceUrl,
      contentType,
    );

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filenameWithExtension}"`,
        ...(contentLength ? { "Content-Length": contentLength } : {}),
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch {
    return new Response("Unexpected download error", { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const sourceUrl = request.nextUrl.searchParams.get("url");
  const providedFilename = request.nextUrl.searchParams.get("filename");

  if (!sourceUrl) {
    return new Response("Missing url query param", { status: 400 });
  }

  return buildDownloadResponse(sourceUrl, providedFilename);
}

export async function POST(request: NextRequest) {
  let payload: { url?: string; filename?: string };
  try {
    payload = (await request.json()) as { url?: string; filename?: string };
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const sourceUrl = payload.url;
  const providedFilename = payload.filename ?? null;

  if (!sourceUrl) {
    return new Response("Missing url in body", { status: 400 });
  }

  return buildDownloadResponse(sourceUrl, providedFilename);
}
