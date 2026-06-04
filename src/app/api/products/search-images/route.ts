import { NextRequest, NextResponse } from "next/server";
import { searchImagesByProductIds } from "@/lib/postgres/catalog";

const IMAGE_CACHE_TTL = 60_000;
const imageCache = new Map<string, { expiresAt: number; images: Record<string, { imageUrl: string; imageAlt: string }> }>();

export async function GET(request: NextRequest) {
  try {
    const ids = (request.nextUrl.searchParams.get("ids") || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 8);

    if (ids.length === 0) {
      return NextResponse.json({ images: {} });
    }

    const cacheKey = ids.join(",");
    const cached = imageCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ images: cached.images });
    }

    const images = await searchImagesByProductIds(ids);

    imageCache.set(cacheKey, {
      expiresAt: Date.now() + IMAGE_CACHE_TTL,
      images,
    });

    return NextResponse.json(
      { images },
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load search images" },
      { status: 500 },
    );
  }
}
