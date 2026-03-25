import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const placeIdsRaw = url.searchParams.get("placeIds") ?? "";
  const userId = url.searchParams.get("userId") ?? null;

  const placeIds = placeIdsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (placeIds.length === 0) return Response.json({});

  const rows = await prisma.barTheme.findMany({
    where: {
      kakao_place_id: { in: placeIds },
      ...(userId ? { user_id: userId } : {}),
    },
    select: { kakao_place_id: true, theme_id: true },
  });

  const map: Record<string, string[]> = {};
  for (const row of rows) {
    if (!map[row.kakao_place_id]) map[row.kakao_place_id] = [];
    map[row.kakao_place_id].push(row.theme_id);
  }

  return Response.json(map);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const kakaoPlaceId = String((body as { kakao_place_id?: unknown }).kakao_place_id ?? "");
  const userId = String((body as { user_id?: unknown }).user_id ?? "");
  const themeIdsRaw = (body as { theme_ids?: unknown }).theme_ids;

  const themeIds = Array.isArray(themeIdsRaw)
    ? themeIdsRaw.map((v) => String(v)).filter(Boolean)
    : [];

  if (!kakaoPlaceId || !userId) {
    return Response.json(
      { error: "kakao_place_id and user_id are required" },
      { status: 400 }
    );
  }

  // Replace semantics: remove existing tags for this user/place, then re-create.
  // This makes "edit after connecting" possible.
  await prisma.barTheme.deleteMany({
    where: { kakao_place_id: kakaoPlaceId, user_id: userId },
  });

  if (themeIds.length > 0) {
    await prisma.barTheme.createMany({
      data: themeIds.map((theme_id) => ({
        kakao_place_id: kakaoPlaceId,
        theme_id,
        user_id: userId,
      })),
    });
  }

  return Response.json({ success: true });
}

