export interface Region {
  province: string;
  districts: string[];
}

export const REGIONS: Region[] = [
  {
    province: "서울",
    districts: [
      "강남/역삼/삼성/논현",
      "서초/신사/방배",
      "잠실/방이",
      "잠실새내/신천/종합운동장",
      "영등포/여의도",
      "신림/서울대/사당/동작",
      "천호/길동/둔촌",
      "화곡/까치산/양천/목동",
      "구로/금천/오류/신도림",
      "신촌/홍대/합정",
      "연신내/불광/응암",
      "종로/대학로/동묘앞역",
      "성신여대/성북/월곡",
      "이태원/용산/서울역/명동/회현",
      "동대문/을지로/충무로/신당/약수",
      "회기/고려대/청량리/신설동",
      "장안동/답십리",
      "건대/군자/구의",
      "왕십리/성수/금호",
      "수유/미아",
      "상봉/중랑/면목",
      "태릉/노원/도봉/창동",
    ],
  },
  {
    province: "경기",
    districts: [
      "수원/화성",
      "성남/분당",
      "용인/기흥",
      "안양/군포/의왕",
      "부천/광명",
      "안산/시흥",
      "고양/일산",
      "파주/김포",
      "의정부/양주/동두천",
      "남양주/구리/하남",
      "평택/오산/안성",
      "이천/여주/광주",
    ],
  },
  {
    province: "인천",
    districts: [
      "부평/계양",
      "주안/간석",
      "송도/연수",
      "구월/남동",
      "청라/검단",
    ],
  },
  {
    province: "강원",
    districts: [
      "춘천",
      "원주",
      "강릉",
      "속초/양양",
      "동해/삼척",
    ],
  },
  {
    province: "제주",
    districts: [
      "제주시/연동",
      "서귀포시",
      "애월/한림",
      "중문/대정",
    ],
  },
  {
    province: "대전",
    districts: [
      "둔산/유성",
      "대전역/중구",
      "서구/유성구",
    ],
  },
  {
    province: "충북",
    districts: [
      "청주",
      "충주",
      "제천",
    ],
  },
  {
    province: "충남\n세종",
    districts: [
      "천안/아산",
      "세종시",
      "서산/당진",
      "공주/논산",
    ],
  },
  {
    province: "부산",
    districts: [
      "서면/전포",
      "해운대/마린시티",
      "광안리/수영",
      "남포동/자갈치",
      "경성대/대연",
      "부산대/장전",
      "센텀시티",
    ],
  },
  {
    province: "울산",
    districts: [
      "삼산/신정",
      "성남/무거",
      "태화강/중구",
    ],
  },
  {
    province: "경남",
    districts: [
      "창원/마산",
      "김해/양산",
      "거제/통영",
      "진주",
    ],
  },
  {
    province: "대구",
    districts: [
      "동성로/중구",
      "수성구/범어",
      "북구/칠곡",
      "서구/달서구",
    ],
  },
  {
    province: "경북",
    districts: [
      "포항",
      "구미",
      "경주",
      "안동",
    ],
  },
  {
    province: "광주",
    districts: [
      "충장로/금남로",
      "상무지구",
      "첨단/수완",
    ],
  },
  {
    province: "전남",
    districts: [
      "여수",
      "순천",
      "목포",
    ],
  },
  {
    province: "전주\n전북",
    districts: [
      "전주 객사/한옥마을",
      "전주 덕진/송천",
      "익산/군산",
    ],
  },
];

export interface Bar {
  id: string;
  name: string;
  category: string;
  district: string;
  rating: number;
  distance: string;
  imageUrl: string;
  description: string;
}

export const SAMPLE_BARS: Bar[] = [
  { id: "1", name: "술도가", category: "전통주점", district: "강남/역삼/삼성/논현", rating: 4.5, distance: "320m", imageUrl: "", description: "엄선된 전통주와 안주를 즐길 수 있는 공간" },
  { id: "2", name: "하이볼 바", category: "칵테일바", district: "강남/역삼/삼성/논현", rating: 4.7, distance: "180m", imageUrl: "", description: "시그니처 하이볼이 유명한 바" },
  { id: "3", name: "이자카야 텐", category: "이자카야", district: "강남/역삼/삼성/논현", rating: 4.3, distance: "520m", imageUrl: "", description: "정통 일본식 이자카야" },
  { id: "4", name: "와인앤모어", category: "와인바", district: "서초/신사/방배", rating: 4.6, distance: "210m", imageUrl: "", description: "소규모 와이너리 직수입 와인 전문" },
  { id: "5", name: "맥파이", category: "크래프트비어", district: "신촌/홍대/합정", rating: 4.4, distance: "150m", imageUrl: "", description: "수제 맥주와 펍 푸드" },
  { id: "6", name: "을지로 노가리", category: "호프집", district: "동대문/을지로/충무로/신당/약수", rating: 4.2, distance: "90m", imageUrl: "", description: "40년 전통 노가리 골목 맛집" },
  { id: "7", name: "바 르퓌주", category: "칵테일바", district: "이태원/용산/서울역/명동/회현", rating: 4.8, distance: "430m", imageUrl: "", description: "클래식 칵테일 전문 스피크이지 바" },
  { id: "8", name: "두꺼비 포차", category: "포장마차", district: "건대/군자/구의", rating: 4.1, distance: "270m", imageUrl: "", description: "감성 포차 스타일의 술집" },
  { id: "9", name: "소곡주 한잔", category: "전통주점", district: "종로/대학로/동묘앞역", rating: 4.4, distance: "380m", imageUrl: "", description: "전통 소곡주와 한식 안주 페어링" },
  { id: "10", name: "루프탑 라운지", category: "라운지바", district: "영등포/여의도", rating: 4.6, distance: "610m", imageUrl: "", description: "한강뷰 루프탑 라운지" },
  { id: "11", name: "해운대 소주방", category: "소주방", district: "서면/전포", rating: 4.3, distance: "200m", imageUrl: "", description: "부산 감성 소주방" },
  { id: "12", name: "전포 카페바", category: "와인바", district: "서면/전포", rating: 4.5, distance: "340m", imageUrl: "", description: "낮에는 카페, 밤에는 와인바" },
  { id: "13", name: "수원 양꼬치", category: "호프집", district: "수원/화성", rating: 4.2, distance: "130m", imageUrl: "", description: "양꼬치와 칭따오가 맛있는 곳" },
  { id: "14", name: "분당 몰트바", category: "크래프트비어", district: "성남/분당", rating: 4.6, distance: "250m", imageUrl: "", description: "50종 이상의 수제맥주 보유" },
  { id: "15", name: "해운대 오션뷰", category: "라운지바", district: "해운대/마린시티", rating: 4.8, distance: "400m", imageUrl: "", description: "해운대 바다가 보이는 루프탑 바" },
  { id: "16", name: "광안리 선셋바", category: "칵테일바", district: "광안리/수영", rating: 4.5, distance: "180m", imageUrl: "", description: "광안대교 야경 명소 칵테일바" },
  { id: "17", name: "부평 생맥집", category: "호프집", district: "부평/계양", rating: 4.1, distance: "90m", imageUrl: "", description: "가성비 생맥주와 치킨" },
  { id: "18", name: "송도 와인살롱", category: "와인바", district: "송도/연수", rating: 4.4, distance: "310m", imageUrl: "", description: "센트럴파크 뷰 와인바" },
  { id: "19", name: "동성로 포차거리", category: "포장마차", district: "동성로/중구", rating: 4.0, distance: "120m", imageUrl: "", description: "대구 감성 야외 포차" },
  { id: "20", name: "수성못 이자카야", category: "이자카야", district: "수성구/범어", rating: 4.3, distance: "280m", imageUrl: "", description: "수성못 근처 정통 이자카야" },
  { id: "21", name: "둔산 하이볼", category: "칵테일바", district: "둔산/유성", rating: 4.5, distance: "200m", imageUrl: "", description: "대전 핫플 하이볼 전문점" },
  { id: "22", name: "충장로 막걸리", category: "전통주점", district: "충장로/금남로", rating: 4.3, distance: "150m", imageUrl: "", description: "광주 전통 막걸리 전문점" },
  { id: "23", name: "상무 펍", category: "크래프트비어", district: "상무지구", rating: 4.4, distance: "270m", imageUrl: "", description: "광주 상무지구 수제맥주 펍" },
  { id: "24", name: "한옥마을 주막", category: "전통주점", district: "전주 객사/한옥마을", rating: 4.7, distance: "100m", imageUrl: "", description: "한옥마을 감성 전통 주막" },
  { id: "25", name: "춘천 닭갈비 호프", category: "호프집", district: "춘천", rating: 4.2, distance: "160m", imageUrl: "", description: "닭갈비와 맥주의 조합" },
  { id: "26", name: "강릉 커피맥주", category: "크래프트비어", district: "강릉", rating: 4.5, distance: "220m", imageUrl: "", description: "커피 향 수제맥주가 유명한 브루어리" },
  { id: "27", name: "일산 와인테이블", category: "와인바", district: "고양/일산", rating: 4.4, distance: "350m", imageUrl: "", description: "내추럴 와인 전문 바" },
];
