import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, MapPin, ChevronRight, RefreshCw, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Province {
  id: string;
  name: string;
  sort_order: number;
}

interface District {
  id: string;
  province_id: string;
  name: string;
  sort_order: number;
  sync_interval_days: number | null;
  last_synced_at: string | null;
}

function adminFetch(token: string, body: Record<string, unknown>) {
  return fetch(`${supabaseUrl}/functions/v1/admin-themes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": token,
      apikey: anonKey,
    },
    body: JSON.stringify(body),
  }).then((r) => r.json());
}

interface Props {
  token: string;
}

const SYNC_OPTIONS = [
  { value: "0", label: "동기화 안함" },
  { value: "1", label: "매일" },
  { value: "3", label: "3일마다" },
  { value: "7", label: "매주" },
];

function formatLastSync(dateStr: string | null): string {
  if (!dateStr) return "동기화 안됨";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return "방금 전";
  if (diffH < 24) return `${diffH}시간 전`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}일 전`;
}

export default function AdminRegions({ token }: Props) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());

  // Province editing
  const [newProvinceName, setNewProvinceName] = useState("");
  const [editingProvinceId, setEditingProvinceId] = useState<string | null>(null);
  const [editProvinceName, setEditProvinceName] = useState("");

  // District editing
  const [newDistrictName, setNewDistrictName] = useState("");
  const [editingDistrictId, setEditingDistrictId] = useState<string | null>(null);
  const [editDistrictName, setEditDistrictName] = useState("");

  const loadRegions = useCallback(async () => {
    setLoading(true);
    const data = await adminFetch(token, { action: "list_regions" });
    if (data.provinces) setProvinces(data.provinces);
    if (data.districts) setDistricts(data.districts);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadRegions();
  }, [loadRegions]);

  const selectedProvince = provinces.find((p) => p.id === selectedProvinceId);
  const filteredDistricts = districts
    .filter((d) => d.province_id === selectedProvinceId)
    .sort((a, b) => a.sort_order - b.sort_order);

  // Province CRUD
  async function createProvince() {
    const name = newProvinceName.trim();
    if (!name) return;
    await adminFetch(token, {
      action: "create_province",
      province_name: name,
      sort_order: provinces.length,
    });
    setNewProvinceName("");
    loadRegions();
  }

  async function renameProvince(id: string) {
    const name = editProvinceName.trim();
    if (!name) return;
    await adminFetch(token, {
      action: "update_province",
      province_id: id,
      province_name: name,
    });
    setEditingProvinceId(null);
    loadRegions();
  }

  async function deleteProvince(id: string) {
    if (!confirm("이 시/도를 삭제하시겠습니까? 하위 지역도 모두 삭제됩니다.")) return;
    await adminFetch(token, { action: "delete_province", province_id: id });
    if (selectedProvinceId === id) setSelectedProvinceId(null);
    loadRegions();
  }

  // District CRUD
  async function createDistrict() {
    const name = newDistrictName.trim();
    if (!name || !selectedProvinceId) return;
    await adminFetch(token, {
      action: "create_district",
      province_id: selectedProvinceId,
      district_name: name,
      sort_order: filteredDistricts.length,
    });
    setNewDistrictName("");
    loadRegions();
  }

  async function renameDistrict(id: string) {
    const name = editDistrictName.trim();
    if (!name) return;
    await adminFetch(token, {
      action: "update_district",
      district_id: id,
      district_name: name,
    });
    setEditingDistrictId(null);
    loadRegions();
  }

  async function deleteDistrict(id: string) {
    if (!confirm("이 지역을 삭제하시겠습니까?")) return;
    await adminFetch(token, { action: "delete_district", district_id: id });
    loadRegions();
  }

  async function setSyncInterval(districtId: string, days: number) {
    await adminFetch(token, {
      action: "update_district",
      district_id: districtId,
      sync_interval_days: days || null,
    });
    loadRegions();
  }

  async function triggerSync(districtId: string) {
    setSyncingIds((prev) => new Set(prev).add(districtId));
    try {
      await adminFetch(token, {
        action: "trigger_sync",
        district_id: districtId,
      });
      loadRegions();
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(districtId);
        return next;
      });
    }
  }

  async function moveDistrict(id: string, direction: "up" | "down") {
    const idx = filteredDistricts.findIndex((d) => d.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= filteredDistricts.length) return;

    const current = filteredDistricts[idx];
    const swap = filteredDistricts[swapIdx];

    await Promise.all([
      adminFetch(token, { action: "update_district", district_id: current.id, sort_order: swap.sort_order }),
      adminFetch(token, { action: "update_district", district_id: swap.id, sort_order: current.sort_order }),
    ]);
    loadRegions();
  }

  async function moveProvince(id: string, direction: "up" | "down") {
    const idx = provinces.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= provinces.length) return;

    const current = provinces[idx];
    const swap = provinces[swapIdx];

    await Promise.all([
      adminFetch(token, { action: "update_province", province_id: current.id, sort_order: swap.sort_order }),
      adminFetch(token, { action: "update_province", province_id: swap.id, sort_order: current.sort_order }),
    ]);
    loadRegions();
  }

  if (loading && provinces.length === 0) {
    return <p className="text-sm text-muted-foreground">로딩 중...</p>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Province list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
          <MapPin className="h-4 w-4" /> 시/도 목록
        </h2>

        <div className="flex gap-2">
          <Input
            placeholder="새 시/도 이름..."
            value={newProvinceName}
            onChange={(e) => setNewProvinceName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createProvince()}
          />
          <Button onClick={createProvince} disabled={!newProvinceName.trim()} size="sm">
            <Plus className="h-4 w-4 mr-1" /> 추가
          </Button>
        </div>

        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {provinces.map((prov, idx) => (
            <div
              key={prov.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                selectedProvinceId === prov.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              {editingProvinceId === prov.id ? (
                <>
                  <Input
                    className="flex-1 h-8"
                    value={editProvinceName}
                    onChange={(e) => setEditProvinceName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && renameProvince(prov.id)}
                    autoFocus
                  />
                  <Button size="sm" onClick={() => renameProvince(prov.id)}>저장</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingProvinceId(null)}>취소</Button>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveProvince(prov.id, "up")}
                      disabled={idx === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                    >▲</button>
                    <button
                      onClick={() => moveProvince(prov.id, "down")}
                      disabled={idx === provinces.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                    >▼</button>
                  </div>
                  <button
                    className="flex-1 text-left text-sm font-medium whitespace-pre-line"
                    onClick={() => setSelectedProvinceId(prov.id)}
                  >
                    {prov.name.replace("\n", " ")}
                  </button>
                  <Badge variant="outline" className="text-xs">
                    {districts.filter((d) => d.province_id === prov.id).length}개 지역
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => { setEditingProvinceId(prov.id); setEditProvinceName(prov.name); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteProvince(prov.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  {selectedProvinceId === prov.id && (
                    <ChevronRight className="h-4 w-4 text-primary" />
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* District list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {selectedProvince ? (
            <span>{selectedProvince.name.replace("\n", " ")} — 하위 지역</span>
          ) : (
            "시/도를 선택하세요"
          )}
        </h2>

        {selectedProvinceId && (
          <>
            <div className="flex gap-2">
              <Input
                placeholder="새 지역 이름..."
                value={newDistrictName}
                onChange={(e) => setNewDistrictName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createDistrict()}
              />
              <Button onClick={createDistrict} disabled={!newDistrictName.trim()} size="sm">
                <Plus className="h-4 w-4 mr-1" /> 추가
              </Button>
            </div>

            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
              {filteredDistricts.map((dist, idx) => (
                <div
                  key={dist.id}
                  className="rounded-lg border border-border overflow-hidden"
                >
                  {/* Main row */}
                  <div className="flex items-center gap-2 px-3 py-2">
                    {editingDistrictId === dist.id ? (
                      <>
                        <Input
                          className="flex-1 h-8"
                          value={editDistrictName}
                          onChange={(e) => setEditDistrictName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && renameDistrict(dist.id)}
                          autoFocus
                        />
                        <Button size="sm" onClick={() => renameDistrict(dist.id)}>저장</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingDistrictId(null)}>취소</Button>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => moveDistrict(dist.id, "up")}
                            disabled={idx === 0}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                          >▲</button>
                          <button
                            onClick={() => moveDistrict(dist.id, "down")}
                            disabled={idx === filteredDistricts.length - 1}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                          >▼</button>
                        </div>
                        <span className="flex-1 text-sm font-medium">{dist.name}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => { setEditingDistrictId(dist.id); setEditDistrictName(dist.name); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteDistrict(dist.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Sync controls row */}
                  {editingDistrictId !== dist.id && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-t border-border">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <Select
                        value={String(dist.sync_interval_days || 0)}
                        onValueChange={(v) => setSyncInterval(dist.id, parseInt(v))}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SYNC_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <span className="text-xs text-muted-foreground flex-1">
                        {formatLastSync(dist.last_synced_at)}
                      </span>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        disabled={syncingIds.has(dist.id)}
                        onClick={() => triggerSync(dist.id)}
                      >
                        <RefreshCw className={`h-3 w-3 ${syncingIds.has(dist.id) ? "animate-spin" : ""}`} />
                        {syncingIds.has(dist.id) ? "동기화 중..." : "지금 동기화"}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {filteredDistricts.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">등록된 지역이 없습니다</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
