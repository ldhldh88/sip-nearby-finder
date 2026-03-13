export interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
}

interface KakaoSearchResponse {
  documents: KakaoPlace[];
  meta: {
    is_end: boolean;
    pageable_count: number;
    total_count: number;
    same_name?: {
      keyword: string;
      region: string[];
      selected_region: string;
    };
  };
}

// District center coordinates for grid-based category search
const DISTRICT_COORDS: Record<string, { x: number; y: number; radius: number }> = {
  "강남/역삼/삼성/논현": { x: 127.0366, y: 37.5045, radius: 3000 },
  "서초/신사/방배": { x: 127.0127, y: 37.4920, radius: 3000 },
  "잠실/방이": { x: 127.0857, y: 37.5130, radius: 2500 },
  "잠실새내/신천/종합운동장": { x: 127.0746, y: 37.5110, radius: 2500 },
  "영등포/여의도": { x: 126.9246, y: 37.5247, radius: 2500 },
  "신림/서울대/사당/동작": { x: 126.9580, y: 37.4780, radius: 3000 },
  "천호/길동/둔촌": { x: 127.1237, y: 37.5380, radius: 2500 },
  "화곡/까치산/양천/목동": { x: 126.8666, y: 37.5370, radius: 3000 },
  "구로/금천/오류/신도림": { x: 126.8877, y: 37.4957, radius: 3000 },
  "신촌/홍대/합정": { x: 126.9234, y: 37.5565, radius: 2500 },
  "연신내/불광/응암": { x: 126.9184, y: 37.6195, radius: 2500 },
  "종로/대학로/동묘앞역": { x: 126.9920, y: 37.5720, radius: 2500 },
  "성신여대/성북/월곡": { x: 127.0190, y: 37.5920, radius: 2500 },
  "이태원/용산/서울역/명동/회현": { x: 126.9870, y: 37.5340, radius: 2500 },
  "동대문/을지로/충무로/신당/약수": { x: 127.0090, y: 37.5620, radius: 2500 },
  "회기/고려대/청량리/신설동": { x: 127.0456, y: 37.5830, radius: 2500 },
  "장안동/답십리": { x: 127.0640, y: 37.5650, radius: 2000 },
  "건대/군자/구의": { x: 127.0690, y: 37.5420, radius: 2500 },
  "왕십리/성수/금호": { x: 127.0370, y: 37.5480, radius: 2500 },
  "수유/미아": { x: 127.0250, y: 37.6370, radius: 2500 },
  "상봉/중랑/면목": { x: 127.0850, y: 37.5930, radius: 2500 },
  "태릉/노원/도봉/창동": { x: 127.0560, y: 37.6520, radius: 3000 },
  // 경기
  "수원/화성": { x: 127.0000, y: 37.2700, radius: 5000 },
  "성남/분당": { x: 127.1260, y: 37.3820, radius: 4000 },
  "용인/기흥": { x: 127.1140, y: 37.2830, radius: 5000 },
  "안양/군포/의왕": { x: 126.9510, y: 37.3940, radius: 4000 },
  "부천/광명": { x: 126.7830, y: 37.4830, radius: 4000 },
  "안산/시흥": { x: 126.8300, y: 37.3220, radius: 5000 },
  "고양/일산": { x: 126.8320, y: 37.6580, radius: 5000 },
  "파주/김포": { x: 126.7800, y: 37.7430, radius: 5000 },
  "의정부/양주/동두천": { x: 127.0340, y: 37.7380, radius: 5000 },
  "남양주/구리/하남": { x: 127.1280, y: 37.5880, radius: 5000 },
  "평택/오산/안성": { x: 127.0120, y: 37.0000, radius: 5000 },
  "이천/여주/광주": { x: 127.4350, y: 37.2720, radius: 5000 },
  // 인천
  "부평/계양": { x: 126.7220, y: 37.5070, radius: 3000 },
  "주안/간석": { x: 126.6800, y: 37.4500, radius: 3000 },
  "송도/연수": { x: 126.6560, y: 37.3830, radius: 3000 },
  "구월/남동": { x: 126.7310, y: 37.4480, radius: 3000 },
  "청라/검단": { x: 126.6400, y: 37.5300, radius: 3000 },
  // 기타
  "춘천": { x: 127.7300, y: 37.8810, radius: 5000 },
  "원주": { x: 127.9470, y: 37.3420, radius: 5000 },
  "강릉": { x: 128.8760, y: 37.7520, radius: 5000 },
  "속초/양양": { x: 128.5920, y: 38.2070, radius: 5000 },
  "동해/삼척": { x: 129.1140, y: 37.5250, radius: 5000 },
  "제주시/연동": { x: 126.5312, y: 33.4996, radius: 5000 },
  "서귀포시": { x: 126.5632, y: 33.2530, radius: 5000 },
  "애월/한림": { x: 126.3200, y: 33.4620, radius: 5000 },
  "중문/대정": { x: 126.4120, y: 33.2530, radius: 5000 },
  "둔산/유성": { x: 127.3846, y: 36.3550, radius: 4000 },
  "대전역/중구": { x: 127.4346, y: 36.3250, radius: 3000 },
  "서구/유성구": { x: 127.3560, y: 36.3620, radius: 4000 },
  "청주": { x: 127.4890, y: 36.6420, radius: 5000 },
  "충주": { x: 127.9260, y: 36.9910, radius: 5000 },
  "제천": { x: 128.1910, y: 37.1330, radius: 5000 },
  "천안/아산": { x: 127.0020, y: 36.8150, radius: 5000 },
  "세종시": { x: 127.0090, y: 36.5040, radius: 5000 },
  "서산/당진": { x: 126.4520, y: 36.7850, radius: 5000 },
  "공주/논산": { x: 127.1190, y: 36.4470, radius: 5000 },
  "서면/전포": { x: 129.0590, y: 35.1580, radius: 2500 },
  "해운대/마린시티": { x: 129.1600, y: 35.1630, radius: 3000 },
  "광안리/수영": { x: 129.1130, y: 35.1530, radius: 2500 },
  "남포동/자갈치": { x: 129.0270, y: 35.0980, radius: 2000 },
  "경성대/대연": { x: 129.0970, y: 35.1340, radius: 2500 },
  "부산대/장전": { x: 129.0840, y: 35.2310, radius: 2500 },
  "센텀시티": { x: 129.1290, y: 35.1700, radius: 2000 },
  "삼산/신정": { x: 129.3390, y: 35.5390, radius: 3000 },
  "성남/무거": { x: 129.3150, y: 35.5470, radius: 3000 },
  "태화강/중구": { x: 129.3130, y: 35.5570, radius: 3000 },
  "창원/마산": { x: 128.6820, y: 35.2280, radius: 5000 },
  "김해/양산": { x: 128.8890, y: 35.2340, radius: 5000 },
  "거제/통영": { x: 128.6210, y: 34.8800, radius: 5000 },
  "진주": { x: 128.1080, y: 35.1800, radius: 5000 },
  "동성로/중구": { x: 128.5963, y: 35.8690, radius: 2500 },
  "수성구/범어": { x: 128.6260, y: 35.8560, radius: 3000 },
  "북구/칠곡": { x: 128.5830, y: 35.8930, radius: 3000 },
  "서구/달서구": { x: 128.5560, y: 35.8500, radius: 3000 },
  "포항": { x: 129.3650, y: 36.0190, radius: 5000 },
  "구미": { x: 128.3440, y: 36.1190, radius: 5000 },
  "경주": { x: 129.2250, y: 35.8560, radius: 5000 },
  "안동": { x: 128.7290, y: 36.5680, radius: 5000 },
  "충장로/금남로": { x: 126.9150, y: 35.1490, radius: 2500 },
  "상무지구": { x: 126.8510, y: 35.1530, radius: 3000 },
  "첨단/수완": { x: 126.8440, y: 35.1920, radius: 3000 },
  "여수": { x: 127.6620, y: 34.7600, radius: 5000 },
  "순천": { x: 127.4870, y: 34.9510, radius: 5000 },
  "목포": { x: 126.3920, y: 34.8120, radius: 5000 },
  "전주 객사/한옥마을": { x: 127.1490, y: 35.8140, radius: 3000 },
  "전주 덕진/송천": { x: 127.1380, y: 35.8470, radius: 3000 },
  "익산/군산": { x: 126.9540, y: 35.9440, radius: 5000 },
};

function getSearchQuery(district: string): string {
  return district.split("/")[0];
}

function getDistrictCoords(district: string) {
  return DISTRICT_COORDS[district] || null;
}

// Generate sub-grid rectangles for a district to get more results
function generateGridRects(
  centerX: number,
  centerY: number,
  radius: number,
  gridSize: number = 3
): string[] {
  const rects: string[] = [];
  // Convert radius (meters) to approximate degrees
  const latDeg = radius / 111000; // ~111km per degree latitude
  const lngDeg = radius / (111000 * Math.cos((centerY * Math.PI) / 180));

  const cellW = (lngDeg * 2) / gridSize;
  const cellH = (latDeg * 2) / gridSize;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x1 = centerX - lngDeg + i * cellW;
      const y1 = centerY - latDeg + j * cellH;
      const x2 = x1 + cellW;
      const y2 = y1 + cellH;
      // rect format: x1,y1,x2,y2 (left-bottom, right-top)
      rects.push(`${x1},${y1},${x2},${y2}`);
    }
  }
  return rects;
}

export async function searchBars(
  district: string,
  page = 1,
  size = 15
): Promise<{ places: KakaoPlace[]; isEnd: boolean; total: number }> {
  const coords = getDistrictCoords(district);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (coords && page === 1) {
    // First page: use grid-based category search to get many results
    const grids = generateGridRects(coords.x, coords.y, coords.radius, 3);

    const allPlaces: KakaoPlace[] = [];
    const seenIds = new Set<string>();

    // Fetch all grid cells in parallel, 3 pages each
    const fetches: Promise<void>[] = [];

    for (const rect of grids) {
      for (let p = 1; p <= 3; p++) {
        fetches.push(
          (async () => {
            const params = new URLSearchParams({
              mode: 'category',
              category_group_code: 'FD6',
              rect,
              page: String(p),
              size: '15',
              sort: 'accuracy',
            });

            try {
              const res = await fetch(
                `${supabaseUrl}/functions/v1/kakao-proxy?${params}`,
                {
                  headers: {
                    Authorization: `Bearer ${anonKey}`,
                    apikey: anonKey,
                  },
                }
              );

              if (res.ok) {
                const data: KakaoSearchResponse = await res.json();
                for (const doc of data.documents) {
                  // Filter to only bars/pubs (술집)
                  if (
                    doc.category_name?.includes("술집") &&
                    !seenIds.has(doc.id)
                  ) {
                    seenIds.add(doc.id);
                    allPlaces.push(doc);
                  }
                }
              }
            } catch {
              // Skip failed grid cell
            }
          })()
        );
      }
    }

    await Promise.all(fetches);

    return {
      places: allPlaces,
      isEnd: true, // All results loaded at once
      total: allPlaces.length,
    };
  }

  // Fallback: keyword search for non-grid districts or subsequent pages
  const location = getSearchQuery(district);
  const query = `${location} 술집`;

  const params = new URLSearchParams({
    query,
    page: String(page),
    size: String(size),
    sort: "accuracy",
  });

  const res = await fetch(
    `${supabaseUrl}/functions/v1/kakao-proxy?${params}`,
    {
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Kakao API error: ${res.status}`);
  }

  const data: KakaoSearchResponse = await res.json();

  return {
    places: data.documents,
    isEnd: data.meta.is_end,
    total: data.meta.pageable_count, // Show accessible count, not total_count
  };
}
