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
"[project]/src/app/api/kakao-place-photo/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const MAX_PHOTOS = 5;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map();
function normalizeImageUrl(url) {
    const t = url.trim();
    if (t.startsWith("//")) return `https:${t}`;
    return t;
}
/** Prefer real photos over Kakao static-map og previews */ function isStaticMapOg(url) {
    return url.includes("staticmap.kakao.com");
}
async function collectPhotosFromJson(placeId, photos) {
    const res = await fetch(`https://place.map.kakao.com/main/v/${placeId}`, {
        headers: {
            "User-Agent": UA,
            Accept: "application/json"
        }
    });
    if (!res.ok) return;
    const data = await res.json();
    const mainPhoto = data?.basicInfo?.mainphotourl;
    if (mainPhoto) photos.push(normalizeImageUrl(mainPhoto));
    const photoGroups = data?.photo?.photoList;
    if (photoGroups && Array.isArray(photoGroups)) {
        for (const group of photoGroups){
            if (group.list && Array.isArray(group.list)) {
                for (const item of group.list){
                    const photoUrl = item.orgurl || item.url;
                    if (photoUrl && !photos.includes(normalizeImageUrl(photoUrl)) && photos.length < MAX_PHOTOS) {
                        photos.push(normalizeImageUrl(photoUrl));
                    }
                }
            }
            if (photos.length >= MAX_PHOTOS) break;
        }
    }
}
async function collectPhotosFromHtml(placeId, photos) {
    const htmlRes = await fetch(`https://place.map.kakao.com/${placeId}`, {
        headers: {
            "User-Agent": UA,
            Accept: "text/html,application/xhtml+xml"
        }
    });
    if (!htmlRes.ok) return;
    const html = await htmlRes.text();
    const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (ogMatch?.[1]) {
        const u = normalizeImageUrl(ogMatch[1]);
        if (!isStaticMapOg(u)) photos.push(u);
    }
    if (photos.length === 0) {
        const tw = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
        if (tw?.[1]) photos.push(normalizeImageUrl(tw[1]));
    }
}
async function fetchKakaoPlacePhotos(placeId) {
    const photos = [];
    try {
        await collectPhotosFromJson(placeId, photos);
    } catch  {
    // JSON endpoint deprecated or changed
    }
    if (photos.length === 0) {
        try {
            await collectPhotosFromHtml(placeId, photos);
        } catch  {
        // ignore
        }
    }
    return photos.slice(0, MAX_PHOTOS);
}
async function GET(req) {
    const url = new URL(req.url);
    const placeId = url.searchParams.get("placeId");
    if (!placeId) {
        return Response.json({
            error: "placeId is required"
        }, {
            status: 400
        });
    }
    const cached = cache.get(placeId);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        const body = {
            photo_url: cached.photos[0] ?? null,
            photos: cached.photos
        };
        return Response.json(body, {
            headers: {
                "Cache-Control": "public, max-age=86400"
            }
        });
    }
    const photos = await fetchKakaoPlacePhotos(placeId);
    cache.set(placeId, {
        photos,
        ts: Date.now()
    });
    if (cache.size > 5000) {
        const oldest = [
            ...cache.entries()
        ].sort((a, b)=>a[1].ts - b[1].ts);
        for(let i = 0; i < 1000 && i < oldest.length; i++){
            cache.delete(oldest[i][0]);
        }
    }
    const body = {
        photo_url: photos[0] ?? null,
        photos
    };
    return Response.json(body, {
        headers: {
            "Cache-Control": "public, max-age=86400"
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0luav6u._.js.map