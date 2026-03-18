import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBarSearch } from "@/hooks/useBarSearch";
import { KakaoPlace } from "@/lib/kakao";
import { Lock, Search, MapPin, Tag, Plus, Pencil, Trash2, Store } from "lucide-react";
import AdminRegions from "@/components/AdminRegions";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Theme {
  id: string;
  name: string;
  icon_url: string | null;
  bar_count?: number;
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

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem("admin_token") || "");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Bar search + theme linking
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const { data: bars, isLoading: barsLoading } = useBarSearch(keyword);
  const [selectedBar, setSelectedBar] = useState<KakaoPlace | null>(null);
  const [linkedThemes, setLinkedThemes] = useState<string[]>([]);
  const [linkLoading, setLinkLoading] = useState(false);

  // Theme CRUD
  const [themes, setThemes] = useState<Theme[]>([]);
  const [newThemeName, setNewThemeName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [themesLoading, setThemesLoading] = useState(false);

  const loadThemes = useCallback(async () => {
    if (!token) return;
    setThemesLoading(true);
    const data = await adminFetch(token, { action: "list_themes_with_count" });
    if (data.themes) setThemes(data.themes);
    setThemesLoading(false);
  }, [token]);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  useEffect(() => {
    if (!selectedBar || !token) return;
    adminFetch(token, { action: "get_themes", kakao_place_id: selectedBar.id }).then((data) => {
      if (data.theme_ids) setLinkedThemes(data.theme_ids);
    });
  }, [selectedBar, token]);

  async function handleLogin() {
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/admin-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: anonKey },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setLoginError(data.error || "로그인 실패"); return; }
      setToken(data.token);
      sessionStorage.setItem("admin_token", data.token);
    } catch {
      setLoginError("서버 오류");
    } finally {
      setLoginLoading(false);
    }
  }

  async function toggleTheme(themeId: string) {
    if (!selectedBar) return;
    setLinkLoading(true);
    const isLinked = linkedThemes.includes(themeId);
    await adminFetch(token, {
      action: isLinked ? "unlink" : "link",
      kakao_place_id: selectedBar.id,
      theme_id: themeId,
    });
    setLinkedThemes((prev) =>
      isLinked ? prev.filter((id) => id !== themeId) : [...prev, themeId]
    );
    setLinkLoading(false);
    // refresh counts
    loadThemes();
  }

  async function createTheme() {
    const name = newThemeName.trim();
    if (!name) return;
    const data = await adminFetch(token, { action: "create_theme", theme_name: name });
    if (data.theme) {
      setNewThemeName("");
      loadThemes();
    }
  }

  async function renameTheme(themeId: string) {
    const name = editName.trim();
    if (!name) return;
    await adminFetch(token, { action: "rename_theme", theme_id: themeId, new_name: name });
    setEditingId(null);
    loadThemes();
  }

  async function deleteTheme(themeId: string) {
    if (!confirm("이 테마를 삭제하시겠습니까? 연결된 가게 태그도 모두 삭제됩니다.")) return;
    await adminFetch(token, { action: "delete_theme", theme_id: themeId });
    loadThemes();
  }

  function handleSearch() {
    setKeyword(searchInput);
    setSelectedBar(null);
    setLinkedThemes([]);
  }

  // Login screen
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm p-6 space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Lock className="h-5 w-5" />
            관리자 로그인
          </div>
          <Input
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {loginError && <p className="text-sm text-destructive">{loginError}</p>}
          <Button onClick={handleLogin} disabled={loginLoading} className="w-full">
            {loginLoading ? "확인 중..." : "로그인"}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">🍺 관리자</h1>
        <Button variant="ghost" size="sm" onClick={() => { setToken(""); sessionStorage.removeItem("admin_token"); }}>
          로그아웃
        </Button>
      </header>

      <div className="max-w-5xl mx-auto p-4">
        <Tabs defaultValue="link">
          <TabsList className="mb-4">
            <TabsTrigger value="link">테마 연결</TabsTrigger>
            <TabsTrigger value="manage">테마 관리</TabsTrigger>
            <TabsTrigger value="regions">지역 관리</TabsTrigger>
          </TabsList>

          {/* === Tab: 테마 연결 === */}
          <TabsContent value="link" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="술집 이름 또는 지역으로 검색..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch}>검색</Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Bar list */}
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground">검색 결과</h2>
                {barsLoading && <p className="text-sm text-muted-foreground">검색 중...</p>}
                {bars && bars.length === 0 && <p className="text-sm text-muted-foreground">결과가 없습니다.</p>}
                <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {bars?.map((bar) => (
                    <button
                      key={bar.id}
                      onClick={() => setSelectedBar(bar)}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                        selectedBar?.id === bar.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <p className="font-medium text-sm">{bar.place_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {bar.road_address_name || bar.address_name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme checkboxes */}
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  {selectedBar ? (
                    <span className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      {selectedBar.place_name} — 테마 설정
                    </span>
                  ) : "술집을 선택하세요"}
                </h2>
                {selectedBar && (
                  <div className="space-y-2">
                    {themes.map((theme) => {
                      const isLinked = linkedThemes.includes(theme.id);
                      return (
                        <label
                          key={theme.id}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                            isLinked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <Checkbox checked={isLinked} onCheckedChange={() => toggleTheme(theme.id)} disabled={linkLoading} />
                          <span className="text-sm font-medium">{theme.name}</span>
                          {isLinked && <Badge variant="secondary" className="ml-auto text-xs">연결됨</Badge>}
                        </label>
                      );
                    })}
                    {themes.length === 0 && <p className="text-sm text-muted-foreground">등록된 테마가 없습니다.</p>}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* === Tab: 테마 관리 === */}
          <TabsContent value="manage" className="space-y-4">
            {/* Create */}
            <div className="flex gap-2">
              <Input
                placeholder="새 테마 이름..."
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createTheme()}
              />
              <Button onClick={createTheme} disabled={!newThemeName.trim()}>
                <Plus className="h-4 w-4 mr-1" /> 추가
              </Button>
            </div>

            {/* List */}
            {themesLoading ? (
              <p className="text-sm text-muted-foreground">로딩 중...</p>
            ) : (
              <div className="space-y-2">
                {themes.map((theme) => (
                  <div key={theme.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border">
                    {editingId === theme.id ? (
                      <>
                        <Input
                          className="flex-1 h-8"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && renameTheme(theme.id)}
                          autoFocus
                        />
                        <Button size="sm" onClick={() => renameTheme(theme.id)}>저장</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>취소</Button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium flex-1">{theme.name}</span>
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Store className="h-3 w-3" />
                          {theme.bar_count ?? 0}개 가게
                        </Badge>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(theme.id); setEditName(theme.name); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteTheme(theme.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
                {themes.length === 0 && <p className="text-sm text-muted-foreground">등록된 테마가 없습니다.</p>}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
