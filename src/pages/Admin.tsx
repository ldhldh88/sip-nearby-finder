import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useBarSearch } from "@/hooks/useBarSearch";
import { KakaoPlace } from "@/lib/kakao";
import { Lock, Search, MapPin, Tag } from "lucide-react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Theme {
  id: string;
  name: string;
  icon_url: string | null;
}

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem("admin_token") || "");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const { data: bars, isLoading: barsLoading } = useBarSearch(keyword);

  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedBar, setSelectedBar] = useState<KakaoPlace | null>(null);
  const [linkedThemes, setLinkedThemes] = useState<string[]>([]);
  const [linkLoading, setLinkLoading] = useState(false);

  // Load themes
  useEffect(() => {
    supabase.from("themes").select("*").then(({ data }) => {
      if (data) setThemes(data);
    });
  }, []);

  // Load linked themes when bar selected
  useEffect(() => {
    if (!selectedBar || !token) return;
    fetchLinkedThemes(selectedBar.id);
  }, [selectedBar, token]);

  async function fetchLinkedThemes(placeId: string) {
    const res = await fetch(`${supabaseUrl}/functions/v1/admin-themes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
        apikey: anonKey,
      },
      body: JSON.stringify({ action: "get_themes", kakao_place_id: placeId }),
    });
    const data = await res.json();
    if (data.theme_ids) setLinkedThemes(data.theme_ids);
  }

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
      if (!res.ok) {
        setLoginError(data.error || "로그인 실패");
        return;
      }
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
    const action = isLinked ? "unlink" : "link";

    await fetch(`${supabaseUrl}/functions/v1/admin-themes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
        apikey: anonKey,
      },
      body: JSON.stringify({ action, kakao_place_id: selectedBar.id, theme_id: themeId }),
    });

    setLinkedThemes((prev) =>
      isLinked ? prev.filter((id) => id !== themeId) : [...prev, themeId]
    );
    setLinkLoading(false);
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

  // Admin dashboard
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">🍺 테마 관리</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setToken("");
            sessionStorage.removeItem("admin_token");
          }}
        >
          로그아웃
        </Button>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Search */}
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
            {bars && bars.length === 0 && (
              <p className="text-sm text-muted-foreground">결과가 없습니다.</p>
            )}
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {bars?.map((bar) => (
                <button
                  key={bar.id}
                  onClick={() => setSelectedBar(bar)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                    selectedBar?.id === bar.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
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

          {/* Theme panel */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {selectedBar ? (
                <span className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  {selectedBar.place_name} — 테마 설정
                </span>
              ) : (
                "술집을 선택하세요"
              )}
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
                      <Checkbox
                        checked={isLinked}
                        onCheckedChange={() => toggleTheme(theme.id)}
                        disabled={linkLoading}
                      />
                      <span className="text-sm font-medium">{theme.name}</span>
                      {isLinked && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          연결됨
                        </Badge>
                      )}
                    </label>
                  );
                })}
                {themes.length === 0 && (
                  <p className="text-sm text-muted-foreground">등록된 테마가 없습니다.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
