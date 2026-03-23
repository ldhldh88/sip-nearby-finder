import {
  runDistrictPlacesSync,
  type SyncPlacesBody,
} from "@/lib/district-sync";

function authorizeSync(req: Request): boolean {
  const secret = process.env.SYNC_PLACES_SECRET;
  if (!secret) return true;
  const h = req.headers.get("x-sync-secret");
  if (h === secret) return true;
  return process.env.ALLOW_ANONYMOUS_SYNC === "true";
}

export async function POST(req: Request) {
  if (!authorizeSync(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SyncPlacesBody = {};
  try {
    body = (await req.json()) as SyncPlacesBody;
  } catch {
    // no body (e.g. cron)
  }

  try {
    const result = await runDistrictPlacesSync(body);
    return Response.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sync failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
