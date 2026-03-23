import { kakaoService } from "@/lib/kakao/kakao.service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const x = url.searchParams.get("x");
  const y = url.searchParams.get("y");
  const radius = url.searchParams.get("radius") || "2000";
  const sort = url.searchParams.get("sort") || "accuracy";

  if (!x || !y) {
    return Response.json({ error: "x and y parameters are required" }, { status: 400 });
  }

  const out = await kakaoService.getNearbyRanked({ x, y, radius, sort });
  if (!out.ok) {
    return Response.json(out.data, { status: out.status });
  }

  return Response.json(out.data);
}
