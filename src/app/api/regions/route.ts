import { prisma } from "@/lib/prisma";

export async function GET() {
  const [provinces, districts] = await Promise.all([
    prisma.province.findMany({
      orderBy: { sort_order: "asc" },
      select: { id: true, name: true, sort_order: true },
    }),
    prisma.district.findMany({
      orderBy: { sort_order: "asc" },
      select: { id: true, province_id: true, name: true, sort_order: true },
    }),
  ]);

  return Response.json({ provinces, districts });
}

