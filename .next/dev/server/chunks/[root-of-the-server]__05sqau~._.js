module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/src/lib/prisma.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@prisma/adapter-pg/dist/index.mjs [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
// Prevent exhausting database connections in development (Next.js hot reload).
const globalForPrisma = globalThis;
const adapter = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PrismaPg"]({
    connectionString: process.env.DATABASE_URL
});
const prisma = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
    adapter
});
if ("TURBOPACK compile-time truthy", 1) {
    globalForPrisma.prisma = prisma;
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/lib/kakao-rest.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fetchKakaoKeywordSearch",
    ()=>fetchKakaoKeywordSearch,
    "getKakaoRestApiKey",
    ()=>getKakaoRestApiKey
]);
/**
 * Kakao Local REST API (server-only). Uses KAKAO_REST_API_KEY.
 * @see https://developers.kakao.com/docs/latest/ko/local/dev-guide#search-by-keyword
 */ const KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
function getKakaoRestApiKey() {
    return process.env.KAKAO_REST_API_KEY;
}
async function fetchKakaoKeywordSearch(params) {
    const key = getKakaoRestApiKey();
    if (!key) {
        return {
            ok: false,
            status: 500,
            data: {
                error: "KAKAO_REST_API_KEY not configured"
            }
        };
    }
    const res = await fetch(`${KAKAO_KEYWORD_URL}?${params}`, {
        headers: {
            Authorization: `KakaoAK ${key}`
        }
    });
    const data = await res.json();
    return {
        ok: res.ok,
        status: res.status,
        data
    };
}
}),
"[project]/src/app/api/kakao-search/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$kakao$2d$rest$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/kakao-rest.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
async function GET(req) {
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode");
    /** 검색창 이름 검색 — Kakao 키워드 API 직접 호출 (구 kakao-proxy simple) */ if (mode === "simple") {
        const query = url.searchParams.get("query") ?? "";
        if (!query.trim()) {
            return Response.json({
                documents: [],
                meta: {
                    total_count: 0,
                    pageable_count: 0,
                    is_end: true
                }
            });
        }
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$kakao$2d$rest$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getKakaoRestApiKey"])()) {
            return Response.json({
                error: "KAKAO_REST_API_KEY not configured"
            }, {
                status: 500
            });
        }
        const page = url.searchParams.get("page") ?? "1";
        const size = url.searchParams.get("size") ?? "15";
        const sort = url.searchParams.get("sort") ?? "accuracy";
        const params = new URLSearchParams({
            query,
            page,
            size,
            sort
        });
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$kakao$2d$rest$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fetchKakaoKeywordSearch"])(params);
        return Response.json(result.data, {
            status: result.ok ? 200 : result.status
        });
    }
    const district = url.searchParams.get("district") ?? "";
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const size = Number(url.searchParams.get("size") ?? "15") || 15;
    const location = district.trim();
    if (!location) {
        return Response.json({
            places: [],
            isEnd: true,
            total: 0,
            pageableCount: 0,
            currentPage: page,
            totalPages: 0
        });
    }
    // 1) Try cached DB first
    const matched = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].district.findFirst({
        where: {
            name: {
                contains: location,
                mode: "insensitive"
            }
        },
        select: {
            id: true,
            last_synced_at: true
        }
    });
    if (matched?.last_synced_at) {
        const cached = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].cachedPlace.findMany({
            where: {
                district_id: matched.id
            },
            select: {
                place_data: true
            }
        });
        if (cached.length > 0) {
            const allPlaces = cached.map((c)=>c.place_data);
            const totalCount = allPlaces.length;
            const totalPages = Math.ceil(totalCount / size);
            const start = (page - 1) * size;
            const pageItems = allPlaces.slice(start, start + size);
            return Response.json({
                places: pageItems,
                isEnd: page >= totalPages,
                total: totalCount,
                pageableCount: totalCount,
                currentPage: page,
                totalPages
            });
        }
    }
    // 2) Fallback: Kakao 키워드 API 직접 호출
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$kakao$2d$rest$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getKakaoRestApiKey"])()) {
        return Response.json({
            error: "KAKAO_REST_API_KEY not configured"
        }, {
            status: 500
        });
    }
    const query = `${location} 술집`;
    const params = new URLSearchParams({
        query,
        page: String(page),
        size: String(size),
        sort: "accuracy"
    });
    const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$kakao$2d$rest$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fetchKakaoKeywordSearch"])(params);
    if (!result.ok) {
        return Response.json({
            error: `Kakao API error: ${result.status}`,
            ...result.data
        }, {
            status: result.status >= 500 ? 500 : result.status
        });
    }
    const data = result.data;
    const totalCount = data.meta?.total_count ?? 0;
    const pageableCount = data.meta?.pageable_count ?? 0;
    const totalPages = Math.ceil(pageableCount / size);
    return Response.json({
        places: data.documents ?? [],
        isEnd: data.meta?.is_end ?? false,
        total: totalCount,
        pageableCount,
        currentPage: page,
        totalPages
    });
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__05sqau~._.js.map