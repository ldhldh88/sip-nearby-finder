import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isValidPostgresUuid } from "@/lib/anonymous-user-id";

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

  if (!isValidPostgresUuid(userId)) {
    return Response.json(
      {
        error:
          "user_id는 UUID 형식이어야 합니다. 앱을 새로고침하면 자동으로 바로잡힙니다.",
      },
      { status: 400 }
    );
  }

  const uniqueThemeIds = [...new Set(themeIds)];
  for (const tid of uniqueThemeIds) {
    if (!isValidPostgresUuid(tid)) {
      return Response.json({ error: "잘못된 테마 ID입니다." }, { status: 400 });
    }
  }

  try {
    if (uniqueThemeIds.length > 0) {
      await prisma.barMeta.upsert({
        where: { kakao_place_id: kakaoPlaceId },
        create: {
          kakao_place_id: kakaoPlaceId,
          like_count: 0,
          view_count: 0,
          bookmark_count: 0,
          hot_score: 0,
        },
        update: {},
      });
    }

    await prisma.barTheme.deleteMany({
      where: { kakao_place_id: kakaoPlaceId, user_id: userId },
    });

    if (uniqueThemeIds.length > 0) {
      await prisma.barTheme.createMany({
        data: uniqueThemeIds.map((theme_id) => ({
          kakao_place_id: kakaoPlaceId,
          theme_id,
          user_id: userId,
        })),
      });
    }
  } catch (e) {
    console.error("[bar-themes POST]", e);

    const raw = e instanceof Error ? e.message : String(e);
    if (/row-level security|42501/i.test(raw)) {
      return Response.json(
        {
          error:
            "데이터베이스 접근 권한(bar_themes RLS) 문제입니다. Supabase에 최신 SQL 마이그레이션을 적용했는지 확인해 주세요.",
        },
        { status: 503 }
      );
    }

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2003") {
        return Response.json(
          { error: "장소·테마 정보가 DB와 맞지 않습니다. 잠시 후 다시 시도해 주세요." },
          { status: 400 }
        );
      }
      if (e.code === "P2002") {
        return Response.json(
          { error: "중복된 저장 요청입니다. 새로고침 후 다시 시도해 주세요." },
          { status: 409 }
        );
      }
    }

    return Response.json(
      { error: "테마를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
}
