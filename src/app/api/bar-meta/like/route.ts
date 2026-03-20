import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid body" }, { status: 400 });

  const kakaoPlaceId = String(body.kakao_place_id ?? "");
  const incrementRaw = body.increment ?? 0;
  const increment = Number(incrementRaw);

  if (!kakaoPlaceId || !Number.isFinite(increment) || increment === 0) {
    return Response.json({ error: "kakao_place_id and increment are required" }, { status: 400 });
  }

  await prisma.barMeta.upsert({
    where: { kakao_place_id: kakaoPlaceId },
    create: {
      kakao_place_id: kakaoPlaceId,
      like_count: increment,
      view_count: 0,
      bookmark_count: 0,
      hot_score: 0,
    },
    update: {
      like_count: { increment },
      updated_at: new Date(),
    },
  });

  return Response.json({ ok: true });
}

