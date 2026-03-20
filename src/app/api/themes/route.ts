import { prisma } from "@/lib/prisma";

export async function GET() {
  const themes = await prisma.theme.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, icon_url: true },
  });

  return Response.json(themes);
}

