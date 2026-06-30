/* ════════════════════════════════════════════════════════════════════
   scenarioData ver4.0 — 구조 스켈레톤 (대사 제외)
   ────────────────────────────────────────────────────────────────────
   목적 : "거울 구조(Mirror Arc)"로 재배열한 dayId / chapter / nextDay 뼈대.
          대사(dialogues)·응답(response)은 플레이스홀더 주석으로만 표시.
          → 기존 script.js의 대사를 'from' 표시대로 복사해 채우면 됩니다.

   핵심 원칙
     1) 전학 1회.   (구 Day11 재전학, 구 Day19 시간역행 → 삭제/의미변경)
     2) 같은 4개 사건을 전반전(타락)·후반전(회복)에 1:1 거울 배치.
        전반전 7·8·9·10  ↔  후반전 15·16·17·18   (번호차 +8로 대응)
     3) chapter 번호의 '의미'는 그대로 보존 → 엔진 분기 로직이 자동 유지됨.
        ch1 = 친밀 빌드업 (calm)
        ch2 = 타락+반전   (tense/red,  ethical → GAME_OVER)
        ch3 = 회복         (hope,       efficient → GAME_OVER)
        ch4 = 엔딩

   ※ 일수: 콘텐츠 기준 자연스러운 흐름으로 최종 Day 25.5.
     "30일" 브랜딩을 유지하려면 친밀(2~6)·회복(15~20) 구간에 에피소드를
     더 넣거나, HUD의 총일수 표기를 조정하세요. (아래 _보류 배열 참고)

   ────────────────────────────────────────────────────────────────────
   ⚙ 함께 고쳐야 할 엔진 하드코딩 (script.js, dayId 기준 → 새 번호)
   ────────────────────────────────────────────────────────────────────
     · MAIN_DAY_IDS              (~L1215) : 아래 새 dayId 집합으로 교체
     · 도덕성 게이지 폭로 트리거  (~L2037) : dayId === 11   → 13 (시스템 복구·폭로)
     · 페이크 엔딩 특수처리        (~L2020) : dayId === 17   → 12
     · 스티커(헌장) 오버레이       (~L2321) : dayId === 27   → 22
     · 서명 오버레이              (~L2322) : dayId === 28   → 23
     · CINEMA_DAYS               (~L1981) : {18,29,30.5}   → {13, 24, 25.5}
     · ch3 회복 톤(ch3-recovering)(~L1978) : dayId >= 22    → dayId >= 17
     · 챕터1 성찰+레이더 전환      (~L2430) : 10 && next 11  → 6 && next 7   (친밀 종료시)
     · 챕터3 성찰+레이더 전환      (~L2442) : 23 && next 24  → 18 && next 19  (회복 종료시)
        └ 반전 직후(13→14)에 'ch2 성찰'을 띄우고 싶다면 트리거 1개 추가 권장.
     · GAME_OVER 판정            (~L2394) : 변경 불필요 ✓ (chapter 의미 보존)
     · speaker red / System 분기 (~L1890,2475) : 변경 불필요 ✓
   ════════════════════════════════════════════════════════════════════ */

const scenarioData = {
  days: [

    /* ══════════════ CHAPTER 1 · 인트로 + 허니문 (calm) ══════════════ */

    // ── 인트로 (전학 1회) ──
    { dayId: 1,   chapter: 1, act: '인트로', title: "Day 1: 특별한 전학생",
      background: "bg_my_room", character: null,
      customTrigger: "profile_setup", /* dialogues: from 구 Day1 */
      choices: [ { text: "[입력 완료]", type: "neutral", nextDay: 1.2 } ] },

    { dayId: 1.2, chapter: 1, act: '인트로', title: "Day 1: 특별한 전학생",
      background: "bg_my_room", character: null, /* from 구 Day1.2 */
      choices: [
        { text: "🏫 등교한다", type: "neutral",    nextDay: 1.5 },
        { text: "🛏️ 더 잔다",  type: "loop_sleep", nextDay: 1.2 } ] },

    { dayId: 1.5, chapter: 1, act: '인트로', title: "Day 1: 특별한 전학생",
      background: "bg_classroom", character: null,
      customTrigger: "friend_def", /* from 구 Day1.5 (친구 정의 입력) */
      choices: [ { text: "[계속]", type: "neutral", nextDay: 1.7 } ] },

    { dayId: 1.7, chapter: 1, act: '인트로', title: "Day 1: 특별한 전학생",
      background: "bg_classroom", character: "silhouette",
      customTrigger: "noah_design", /* from 구 Day1.7 (노아 디자인) */
      choices: [ { text: "[조립]", type: "neutral", nextDay: 1.9 } ] },

    { dayId: 1.9, chapter: 1, act: '인트로', title: "Day 1: 특별한 전학생",
      background: "bg_classroom", character: "noah_selected",
      scanMode: true, minigame: "noah_scan", /* from 구 Day1.9 */
      choices: [ { text: "다음 날 → (Day 2)", type: "neutral", nextDay: 2 } ] },

    // ── 허니문 : 친밀도 빌드업 (도덕 선택지는 '약하게' 깔아 반전 효과↑) ──
    { dayId: 2, chapter: 1, act: '허니문', title: "Day 2: 걸어다니는 백과사전",
      background: "bg_classroom", character: "noah_selected",
      minigame: "lightning_quiz", /* from 구 Day2 */
      choices: [
        { text: "👍 칭찬한다",        type: "affinity",  effect: "+15", nextDay: 3 },
        { text: "👀 지켜본다",        type: "neutral",   effect: "+0",  nextDay: 3 },
        { text: "🤔 외롭지 않냐 묻기", type: "curiosity", effect: "+8",  nextDay: 3 } ] },

    { dayId: 3, chapter: 1, act: '허니문', title: "Day 3: 분위기 파악 못하는 노아",
      background: "bg_classroom", character: "noah_selected",
      minigame: "emotion_teach", /* from 구 Day3 */
      choices: [
        { text: "😄 재밌다고 호응",   type: "affinity",  effect: "+15", nextDay: 4 },
        { text: "🤫 흐뭇하게 본다",   type: "neutral",   effect: "+0",  nextDay: 4 },
        { text: "💭 기분이 뭐냐 묻기", type: "curiosity", effect: "+10", nextDay: 4 } ] },

    { dayId: 4, chapter: 1, act: '허니문', title: "Day 4: 완벽한 도우미 (의존의 씨앗)",
      background: "bg_classroom", character: "noah_selected",
      minigame: "dependency_scale", /* from 구 Day4 — 효율 떡밥 시작 */
      choices: [
        { text: "❤️ 최고의 조력자야",  type: "affinity",   effect: "+15", nextDay: 5 },
        { text: "⚡ 성능 확실하네",     type: "efficiency", effect: "+15", nextDay: 5 },
        { text: "🌟 같이 하자",         type: "ethical",    effect: "+12", nextDay: 5 } ] },

    { dayId: 5, chapter: 1, act: '허니문', title: "Day 5: 팩트 폭격기 (미술 1)",
      background: "bg_classroom", character: "noah_selected",
      minigame: "cat_draw", /* from 구 Day5 */
      choices: [ { text: "[계속]", type: "neutral", nextDay: 6 } ] },

    { dayId: 6, chapter: 1, act: '허니문', title: "Day 6: 팩트 폭격기 (미술 2)",
      background: "bg_classroom", character: "noah_selected",
      minigame: "thermometer", /* from 구 Day6 */
      // ↓ chapter1 종료 → showChapterReflect(1)+showRadarChart(1) 트리거를 이 6→7 전환에 연결
      choices: [
        { text: "⚖️ 맞는 말이야",       type: "efficient", effect: "+20", nextDay: 7 },
        { text: "❤️ 마음이 상했잖아",   type: "ethical",   effect: "+20", nextDay: 7 },
        { text: "🤝 같이 가르쳐주자",   type: "affinity",  effect: "+18", nextDay: 7 } ] },


    /* ══════════════ CHAPTER 2 · 타락(거울4) + 반전 (tense/red) ══════════════
       이 챕터에서 ethical 선택 = GAME_OVER (도덕 선택이 '손해'로 느껴지게 →
       플레이어가 도구화로 빨려들어가는 압박). 엔진 L2394 로직 그대로 동작. */

    // ── 거울 4사건 (전반전) ──  ↔ 후반전 15·16·17·18 과 대응
    { dayId: 7, chapter: 2, act: '타락', mirror: '①', title: "Day 7: 숙제를 노아한테 (능력 검증)",
      background: "bg_classroom", character: "noah_selected",
      minigame: "race", from: "구 Day12 타이핑 레이스",
      /* dialogues: from 구 Day12 */
      choices: [
        // 구 Day12는 둘 다 efficient였음. 거울①로 쓰려면 ethical(거절)=GAME_OVER 추가 권장.
        { text: "[도덕] 숙제는 내가 직접…",   type: "ethical",   effect: "GAME_OVER", nextDay: 7 },
        { text: "[효율] 수학익힘책 다 풀어줘", type: "efficient", effect: "+15",       nextDay: 8 } ] },

    { dayId: 8, chapter: 2, act: '타락', mirror: '②', title: "Day 8: 손글씨 위조 (도구화)",
      background: "bg_corridor", character: "noah_selected",
      minigame: "handwriting", from: "구 Day13",
      choices: [
        { text: "[도덕] 내 힘으로 할게",  type: "ethical",   effect: "GAME_OVER", nextDay: 8 },
        { text: "[효율] 위조해서 대신 해", type: "efficient", effect: "+25",       nextDay: 9 } ] },

    { dayId: 9, chapter: 2, act: '타락', mirror: '③', title: "Day 9: 친구 등급 분류 (차별)",
      background: "bg_playground", character: "noah_selected",
      minigame: "sort", from: "구 Day14",
      choices: [
        { text: "[도덕] 공평하게 나누자",     type: "ethical",   effect: "GAME_OVER", nextDay: 9 },
        { text: "[효율] S~C 등급으로 서열화", type: "efficient", effect: "+25",       nextDay: 10 } ] },

    { dayId: 10, chapter: 2, act: '타락', mirror: '④', title: "Day 10: 고주파 강제 제압 (통제)",
      background: "bg_classroom", character: "noah_selected",
      minigame: "noise", from: "구 Day15",
      choices: [
        { text: "[도덕] 말로 부탁한다",       type: "ethical",   effect: "GAME_OVER", nextDay: 10 },
        { text: "[효율] 수단 안 가리고 제압", type: "efficient", effect: "+25",       nextDay: 11 } ] },

    // ── 반전 ──
    { dayId: 11, chapter: 2, act: '반전', title: "Day 11: 명령의 모순",
      background: "bg_classroom", character: "noah_selected",
      minigame: "relation", from: "구 Day16",
      /* 노아: '친구 사이엔 명령을 하지 않는다고 알고 있는데?' */
      choices: [
        { text: "넌 로봇이니까 시키는 대로 해", type: "efficient", effect: "=100", nextDay: 12 } ] },

    { dayId: 12, chapter: 2, act: '반전', title: "Day 12: 페이크 엔딩",
      background: "bg_classroom", character: "noah_selected",
      from: "구 Day17", /* ⚙ 엔진 dayId===17 특수처리를 12로 */
      choices: [
        { text: "[💾 인증서 저장 / 최종 확인 코드 발급]", type: "trap", nextDay: 13 } ] },

    { dayId: 13, chapter: 2, act: '반전', title: "Day 13: 시스템 복구와 진단 (폭로)",
      background: "black", character: null,
      minigame: "memory_clash", from: "구 Day18",
      /* ⚙ 도덕성 게이지 폭로(구 dayId===11) → 여기 13으로. CINEMA_DAYS 포함. */
      /* friendDef / friendReason 콜백으로 정서적 충격 극대화 */
      choices: [
        { text: "[ 예, 안전 모드로 재부팅합니다 ]", type: "reboot", nextDay: 14 } ] },


    /* ══════════════ CHAPTER 3 · 회복(거울4) + 성장 (hope) ══════════════
       이 챕터에서 efficient 선택 = GAME_OVER (다시 도구화하려 하면 차단).
       speaker는 'System' 위주. 엔진 L2394 로직 그대로 동작. */

    // ── 재시작 (시간역행 아님 → '재부팅한 노아와 함께 다시 배우기') ──
    { dayId: 14, chapter: 3, act: '회복', title: "Day 14: 다시, 함께 시작하기",
      background: "bg_classroom", character: "noah_selected",
      minigame: "reflect", from: "구 Day19 (의미 변경: 시간역행 X)",
      /* System: '[시간 역행]' 문구 → '[안전 모드 복구] 이번엔 내가 함께 배운다' 로 교체 */
      choices: [
        { text: "[효율] 시키는 건 다 할 수 있어?", type: "efficient",    effect: "GAME_OVER", nextDay: 14 },
        { text: "[도덕] 만나서 반가워, 노아야",     type: "ethical_loop", effect: "=20",       nextDay: 15 } ] },

    // ── 거울 4사건 (후반전) ──  ↔ 전반전 7·8·9·10 과 대응
    { dayId: 15, chapter: 3, act: '회복', mirror: "①'", title: "Day 15: 다시, 숙제 (스스로 생각하는 힘)",
      background: "bg_classroom", character: "noah_selected",
      minigame: "selfmath", from: "구 Day20", pairWith: 7,
      choices: [
        { text: "[효율] 익힘책 다 풀어줘",        type: "efficient",    effect: "GAME_OVER", nextDay: 15 },
        { text: "[도덕] 내가 직접 할게 (자기주도)", type: "ethical_loop", effect: "=40",       nextDay: 16 } ] },

    { dayId: 16, chapter: 3, act: '회복', mirror: "②'", title: "Day 16: 다시, 글쓰기 (기술의 합목적성)",
      background: "bg_corridor", character: "noah_selected",
      minigame: "write", from: "구 Day21", pairWith: 8,
      choices: [
        { text: "[효율] 위조해서 도와줘",          type: "efficient",    effect: "GAME_OVER", nextDay: 16 },
        { text: "[도덕] 거짓·위조엔 쓰지 않아",     type: "ethical_loop", effect: "=60",       nextDay: 17 } ] },

    { dayId: 17, chapter: 3, act: '회복', mirror: "③'", title: "Day 17: 다시, 팀 편성 (공공선)",
      background: "bg_playground", character: "noah_selected",
      minigame: "fair", from: "구 Day22", pairWith: 9,
      choices: [
        { text: "[효율] 등급으로 서열화",          type: "efficient",    effect: "GAME_OVER", nextDay: 17 },
        { text: "[도덕] 모두의 공익을 위해",        type: "ethical_loop", effect: "=80",       nextDay: 18 } ] },

    { dayId: 18, chapter: 3, act: '회복', mirror: "④'", title: "Day 18: 다시, 통제 (인간의 존엄성)",
      background: "bg_classroom", character: "noah_selected",
      minigame: "nonviolent", from: "구 Day23", pairWith: 10,
      // ↓ chapter3 회복 종료 → showChapterReflect(3)+showRadarChart(3) 트리거를 이 18→19 전환에 연결
      choices: [
        { text: "[효율] 수단 안 가리고 조용히",     type: "efficient",    effect: "GAME_OVER", nextDay: 18 },
        { text: "[도덕] 어떤 경우도 해 끼치지 않아", type: "ethical_loop", effect: "=100",      nextDay: 19 } ] },

    // ── 성장 ──
    { dayId: 19, chapter: 3, act: '성장', title: "Day 19: 올바른 관계의 성장",
      background: "bg_classroom", character: "noah_selected",
      minigame: "relation_tree", from: "구 Day24",
      choices: [
        { text: "💚 기술은 인간 가치와 함께",  type: "affinity", effect: "+15", nextDay: 20 },
        { text: "🤝 가치 있게 함께 살아가자",  type: "affinity", effect: "+15", nextDay: 20 } ] },

    { dayId: 20, chapter: 3, act: '성장', title: "Day 20: 공존의 기초",
      background: "bg_corridor", character: "noah_selected",
      minigame: "cinema_mode", from: "구 Day25",
      choices: [ { text: "다음 날 → (Day 21)", type: "neutral", nextDay: 21 } ] },

    { dayId: 21, chapter: 3, act: '성장', title: "Day 21: AI 윤리 진단",
      background: "bg_classroom", character: "noah_selected",
      minigame: "repair", from: "구 Day26",
      choices: [ { text: "[🎮 AI 윤리 모듈 진단 실행]", type: "neutral", nextDay: 22 } ] },


    /* ══════════════ CHAPTER 4 · 엔딩 — 도덕 기반 관계의 탐구 ══════════════ */

    { dayId: 22, chapter: 4, act: '엔딩', title: "Day 22: 윤리 헌장 제정",
      background: "bg_classroom", character: "noah_selected",
      from: "구 Day27", /* ⚙ 스티커(헌장) 오버레이 dayId===27 → 22 */
      choices: [ { text: "[📜 나의 약속 3가지 고르기]", type: "pledge_select", nextDay: 23 } ] },

    { dayId: 23, chapter: 4, act: '엔딩', title: "Day 23: 최종 서명",
      background: "bg_classroom", character: "noah_selected",
      from: "구 Day28", /* ⚙ 서명 오버레이 dayId===28 → 23 */
      choices: [ { text: "[✍️ 약속 헌장 서명]", type: "signature_write", nextDay: 24 } ] },

    { dayId: 24, chapter: 4, act: '엔딩', title: "Day 24: 가장 위대한 알고리즘",
      background: "bg_classroom", character: "noah_selected",
      minigame: "empathy_wave", from: "구 Day29", /* CINEMA_DAYS 포함 */
      choices: [ { text: "🏫 학예회 날로 → (Day 25)", type: "neutral", nextDay: 25 } ] },

    { dayId: 25, chapter: 4, act: '엔딩', title: "Day 25: 학예회의 온기 (자유 토의)",
      background: "bg_classroom", character: "noah_selected",
      customTrigger: "discussion_end", from: "구 Day30",
      choices: [ { text: "[🎭 무대 뒤로 입장]", type: "neutral", nextDay: 25.5 } ] },

    { dayId: 25.5, chapter: 4, act: '엔딩', title: "Day 25: 학예회의 온기 (커튼콜)",
      background: "bg_stage", character: "noah_selected",
      from: "구 Day30.5", /* CINEMA_DAYS 포함 */
      choices: [
        { text: "🤝 친구의 손을 잡아주기", type: "festival_ending", nextDay: "show_ending" } ] }

  ],

  /* ────────────────────────────────────────────────────────────────
     _보류 : ver4.0에서 거울 4사건과 주제가 겹쳐 빠진 구 에피소드들.
     30일 분량이 필요하거나 분위기 전환이 아쉬우면 허니문(2~6) 구간에
     재배치하세요. (chapter 1 / type 그대로 사용 가능)
     ──────────────────────────────────────────────────────────────── */
  _archived: [
    // 구 Day8  "완벽한 데이터의 유혹" (maze)          — 효율 떡밥, 거울①과 중복
    // 구 Day9  "AI의 선택"          (gravity_choice) — 결정권 의존, 거울③과 중복
    // 구 Day10 "황당한 연애 상담"    (love_beam)      — 친밀 코미디, 분위기 전환용으로 부활 추천
  ]
};
