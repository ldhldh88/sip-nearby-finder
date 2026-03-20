import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma는 생성된 `node_modules/.prisma/client`를 런타임에 로드합니다.
  // 번들에 넣으면 Vercel 등에서 `.prisma/client/default`를 찾지 못하는 경우가 있습니다.
  serverExternalPackages: ["@prisma/client", "prisma", "@prisma/adapter-pg", "pg"],
};

export default nextConfig;
