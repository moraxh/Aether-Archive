import type { NextRequest } from "next/server";

const NASA_HOST_SUFFIX = "nasa.gov";

function getExtensionFromContentType(
  contentType: string | null,
  fallbackUrl: string,
) {
  if (contentType) {
    if (contentType.includes("jpeg")) return "jpg";
    if (contentType.includes("png")) return "png";
    if (contentType.includes("webp")) return "webp";
    if (contentType.includes("gif")) return "gif";
    if (contentType.includes("tiff")) return "tiff";
    if (contentType.includes("bmp")) return "bmp";
  }

  const fromUrl = fallbackUrl.split(".").pop()?.split("?")[0]?.trim();
  return fromUrl || "jpg";
}

export async function GET(request: NextRequest) {
  const sourceUrl = request.nextUrl.searchParams.get("url");
  const apodDate = request.nextUrl.searchParams.get("date") || "unknown";

  if (!sourceUrl) {
    return new Response("Missing url query param", { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  const isHttps = parsedUrl.protocol === "https:";
  const isNasaHost =
    parsedUrl.hostname === NASA_HOST_SUFFIX ||
    parsedUrl.hostname.endsWith(`.${NASA_HOST_SUFFIX}`);

  if (!isHttps || !isNasaHost) {
    return new Response("Only https NASA image urls are allowed", {
      status: 400,
    });
  }

  try {
    const upstream = await fetch(sourceUrl, { cache: "no-store" });

    if (!upstream.ok) {
      return new Response("Could not fetch source image", { status: 502 });
    }

    const contentType = upstream.headers.get("content-type");
    if (!contentType?.startsWith("image/")) {
      return new Response("Source is not an image", { status: 400 });
    }

    const extension = getExtensionFromContentType(contentType, sourceUrl);
    const safeDate = apodDate.replace(/[^0-9-]/g, "") || "unknown";
    const filename = `apod-${safeDate}.${extension}`;

    if (!upstream.body) {
      return new Response("Image stream unavailable", { status: 502 });
    }

    const contentLength = upstream.headers.get("content-length");

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        ...(contentLength ? { "Content-Length": contentLength } : {}),
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch {
    return new Response("Unexpected download error", { status: 500 });
  }
}
