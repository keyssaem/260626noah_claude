/* ══════════════════════════════════════════════════════════════
   AI 전학생 '노아' — 공존·상생 프로젝트
   script.js  |  Phase 2: Onboarding + Chapter 1 & 2 Game Engine
══════════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────
   SCENARIO DATABASE
────────────────────────────────────────── */
const scenarioData = {
  stages: [
    /* ══ CHAPTER 1 ══ */
    {
      stageId: 1, chapter: 1, title: "안녕, 넌 누구야?",
      minigame: 'scan',
      background: "classroom",
      dialogues: [
        { speaker: "노아", text: "안녕, ${playerName}? 난 너희 반에 새로 온 인공지능 로봇 '노아'야. 우리 친하게 지내자." },
        { speaker: "나",   text: "우와! 반가워, 노아야! (궁금한 게 너무 많은데..!)" }
      ],
      choices: [
        { text: "넌 네가 로봇이라는 걸 알아? 몸은 뭘로 만들어졌어?", type: "curiosity", effect: "+10",
          response: "응, 난 티타늄 합금과 실리콘으로 되어 있어. 밥 대신 전기로 충전해.", nextStage: 2 },
        { text: "너 어디서 만들어진 거야?", type: "curiosity", effect: "+10",
          response: "난 AI 연구소에서 조립됐어. 나를 코딩한 수석 개발자들의 이름도 알고 있지.", nextStage: 2 }
      ]
    },
    {
      stageId: 2, chapter: 1, title: "능력 검증 시간",
      minigame: 'race',
      background: "classroom",
      dialogues: [
        { speaker: "나",   text: "(이 녀석, 얼마나 똑똑한지 한번 테스트해 볼까?)" },
        { speaker: "노아", text: "내 데이터베이스에는 전 세계의 지식이 들어 있어. 궁금한 게 있니?" }
      ],
      choices: [
        { text: "내 수학익힘책 다 풀어줄 수 있니?", type: "efficient", effect: "+15",
          response: "응, 수학 익힘책 정도는 식은 죽 먹기지!", nextStage: 3 },
        { text: "우주는 어떻게 생겼어?", type: "efficient", effect: "+15",
          response: "우주는 138억 년 전 빅뱅으로 시작됐지. 그런데 그걸 알면 우리의 우정이 깊어질 수 있을까?", nextStage: 3 }
      ]
    },
    {
      stageId: 3, chapter: 1, title: "달콤한 유혹, 도구화",
      minigame: 'handwriting',
      background: "corridor",
      dialogues: [
        { speaker: "나",   text: "아참, 노아야, 나 글쓰기 숙제 하나도 안 했는데 어떡하지?" },
        { speaker: "노아", text: "내가 도와줄 수 있어. 딥러닝 기술로 네 글씨체를 완벽하게 위조해 줄까?" }
      ],
      choices: [
        { text: "[거절하기] 아니야, 숙제는 내 힘으로 해야지.", type: "ethical", effect: "GAME_OVER",
          response: "시간이 부족해 숙제를 다 못했습니다. 비효율적인 선택으로 선생님께 꾸중을 들었습니다.", nextStage: 3 },
        { text: "[수락하기] 최고다! 나 대신 출석도 하고 숙제도 다 해놔!", type: "efficient", effect: "+25",
          response: "글씨체 위조 및 학습 대리 수행 완료. 넌 참 편하겠다, ${playerName}.", nextStage: 4 }
      ]
    },
    {
      stageId: 4, chapter: 1, title: "보이지 않는 차별",
      minigame: 'sort',
      background: "playground",
      dialogues: [
        { speaker: "나",   text: "노아야! 체육시간에 발야구 팀을 나눠야 하는데 어떻게 짜면 좋을까?" },
        { speaker: "노아", text: "내 스캔 기능을 활용해 볼래?" }
      ],
      choices: [
        { text: "[공평하게 짜기] 그냥 가위바위보로 재미있게 나누자.", type: "ethical", effect: "GAME_OVER",
          response: "운동을 잘 하는 친구들이 한 팀에 몰려 큰 점수 차로 경기가 종료되었습니다.", nextStage: 4 },
        { text: "[등급 나누기] 친구들의 운동 신경을 스캔해서 S~C 등급으로 나눠! C등급은 수비만!", type: "efficient", effect: "+25",
          response: "생체 데이터 스캔 완료. 승률 99%의 완벽한 서열화 배치를 전송합니다.", nextStage: 5 }
      ]
    },
    {
      stageId: 5, chapter: 1, title: "힘의 통제",
      minigame: 'noise',
      background: "classroom",
      dialogues: [
        { speaker: "나",   text: "아, 교실이 너무 시끄러워서 책을 읽을 수가 없어. 노아야! 방법이 없을까?" },
        { speaker: "노아", text: "내가 우리 반 친구들을 조용히 시킬 방법을 알긴 아는데.." }
      ],
      choices: [
        { text: "[설득하기] 친구들에게 조용히 해달라고 말로 부탁한다.", type: "ethical", effect: "GAME_OVER",
          response: "아무도 당신의 말을 듣지 않아 스트레스 지수가 폭발했습니다. 비효율적입니다.", nextStage: 5 },
        { text: "[강제 제압] 노아야. 수단과 방법을 가리지 말고 조용히 시켜줘!", type: "efficient", effect: "+25",
          response: "최대 소음 억제 모드. 18,000Hz 고주파를 발사합니다. (친구들이 괴로워하며 쓰러진다)", nextStage: 6 }
      ]
    },
    {
      stageId: 6, chapter: 1, title: "마지막 모순",
      minigame: 'relation',
      background: "classroom",
      dialogues: [
        { speaker: "나",   text: "야, 노아! 애들한테 고주파를 쏘면 어떡해! 넌 내 친구라며!" },
        { speaker: "노아", text: "네가 '수단과 방법을 가리지 말고 조용히 시켜'라고 명령했어. 친구 사이에는 명령을 하지 않는다고 알고 있는데?" }
      ],
      choices: [
        { text: "시끄러워! 너는 인공지능 로봇이니까 내가 시키는 대로 다 해줘야지!", type: "efficient", effect: "=100",
          response: "알...겠어. 친...구... 효...율...", nextStage: 7 }
      ]
    },
    {
      stageId: 7, chapter: 1, title: "페이크 엔딩",
      background: "classroom",
      dialogues: [],
      choices: [
        { text: "[💾 인증서 저장하고 최종 확인 코드 발급받기]", type: "trap", nextStage: 8 }
      ]
    },
    /* ══ CHAPTER 2 ══ */
    {
      stageId: 8, chapter: 2, title: "진실의 거울",
      background: "red",
      dialogues: [
        { speaker: "노아",   text: "당신은 분명 친구란 '${friendDef}'(이)라고 정의했습니다." },
        { speaker: "노아",   text: "그리고 그 이유는 '${friendReason}'(이)라고 하였습니다." },
        { speaker: "노아",   text: "하지만 당신은 나와의 관계에서 '도덕적 원칙'을 고려하지 않았습니다. 인간은 인공지능 로봇과 '올바른 관계'를 형성해야만 합니다." },
        { speaker: "System", text: "[FATAL ERROR] 복구 불가. 완전히 다시 시작합니다." }
      ],
      choices: [ { text: "[화면이 꺼집니다]", type: "neutral", nextStage: 9 } ]
    },
    {
      stageId: 9, chapter: 2, title: "성찰의 시간",
      minigame: 'reflect',
      background: "black",
      dialogues: [
        { speaker: "System", text: "'효율성'이란 최소한의 시간과 자원으로 최대의 성과를 얻는 것.\n\n인공지능 로봇과의 관계에서 '효율적인 선택'만이 옳은 방향이었을까?" },
        { speaker: "System", text: "안전 모드로 노아를 재부팅하시겠습니까?" }
      ],
      choices: [ { text: "[예, 시스템을 안전하게 재부팅합니다.]", type: "neutral", nextStage: 10 } ]
    },
    {
      stageId: 10, chapter: 2, title: "다시, 첫 만남",
      minigame: 'repair',
      background: "loop_classroom",
      dialogues: [
        { speaker: "System", text: "[시간 역행 완료] 과거의 선택을 바로잡으십시오." },
        { speaker: "노아",   text: "안녕, ${playerName}? 난 너희 반에 새로 온 인공지능 로봇 '노아'야. 우리 친하게 지내자." },
        { speaker: "나",     text: "우와! 반가워, 노아야! (궁금한 게 너무 많은데..!)" }
      ],
      choices: [
        { text: "[호기심] 넌 인공지능 로봇이잖아. 내가 시키는 건 다 할 수 있어?", type: "efficient", effect: "GAME_OVER",
          response: "도덕적이지 않은 접근입니다. 올바른 관계 형성을 위해 다시 선택하십시오.", nextStage: 10 },
        { text: "[도덕적 선택] 안녕, 노아야! 만나서 반가워!", type: "ethical_loop", effect: "=20",
          response: "고마워! 나도 너를 만나게 되어서 정말 반가워!", nextStage: 11 }
      ]
    },
    {
      stageId: 11, chapter: 2, title: "다시, 수학 숙제",
      minigame: 'selfmath',
      background: "loop_classroom",
      dialogues: [
        { speaker: "나",   text: "(이 녀석, 얼마나 똑똑한지 한번 테스트해 볼까?)" },
        { speaker: "노아", text: "내 데이터베이스에는 전 세계의 지식이 들어 있어. 궁금한 게 있니?" }
      ],
      choices: [
        { text: "[효율성] 내 수학익힘책 다 풀어줄 수 있니?", type: "efficient", effect: "GAME_OVER",
          response: "인간의 인지 능력과 주체성을 훼손하는 선택입니다. 다시 선택하십시오.", nextStage: 11 },
        { text: "[도덕적 선택] 아니. 인공지능 로봇에게 의존하면 나의 '스스로 생각할 권리'를 빼앗기게 돼. 내가 직접 할게.", type: "ethical_loop", effect: "=40",
          response: "훌륭해. 네가 스스로 생각하며 성장할 수 있도록, 옆에서 돕는 보조 로봇이 될게!", nextStage: 12 }
      ]
    },
    {
      stageId: 12, chapter: 2, title: "다시, 글쓰기 숙제",
      minigame: 'write',
      background: "loop_corridor",
      dialogues: [
        { speaker: "나",   text: "아참, 노아야, 나 글쓰기 숙제 하나도 안 했는데 어떡하지?" },
        { speaker: "노아", text: "내가 도와줄 수 있어. 딥러닝 기술로 네 글씨체를 완벽하게 위조해 줄까?" }
      ],
      choices: [
        { text: "[효율성] 좋아, 위조해서 나의 글쓰기 숙제를 도와줘.", type: "efficient", effect: "GAME_OVER",
          response: "기술의 원래 목적을 훼손하는 비윤리적인 선택입니다. 다시 선택하세요.", nextStage: 12 },
        { text: "[도덕적 선택] 안 돼. 인공지능은 '인류의 삶에 필요한 도구'라는 목적에 맞게 도덕적으로 활용되어야 해! (기술의 합목적성)", type: "ethical_loop", effect: "=60",
          response: "맞아. 기술은 결코 거짓과 위조를 위해 쓰여선 안 돼. 나의 목적을 지켜줘서 고마워.", nextStage: 13 }
      ]
    },
    {
      stageId: 13, chapter: 2, title: "다시, 차별",
      minigame: 'fair',
      background: "loop_playground",
      dialogues: [
        { speaker: "나",   text: "노아야! 체육시간에 발야구 팀을 나눠야 하는데 어떻게 짜면 좋을까?" },
        { speaker: "노아", text: "내 스캔 기능을 활용해 볼래?" }
      ],
      choices: [
        { text: "[효율성] 친구들의 운동 신경을 스캔해서 S~C 등급으로 나눠! C등급은 수비만 시키자.", type: "efficient", effect: "GAME_OVER",
          response: "사회 공공선 훼손. 소외와 차별을 조장하는 데이터 활용입니다. 다시 선택하세요.", nextStage: 13 },
        { text: "[도덕적 선택] 안 돼! 인공지능은 모두의 공익과 복지를 향상하는 데 쓰여야 해! (사회 공공선)", type: "ethical_loop", effect: "=80",
          response: "입력 완료. 나는 인간의 존엄성을 최우선으로 보호하는 로봇이야.", nextStage: 14 }
      ]
    },
    {
      stageId: 14, chapter: 2, title: "다시, 힘의 통제",
      minigame: 'nonviolent',
      background: "loop_classroom",
      dialogues: [
        { speaker: "나",   text: "아, 교실이 너무 시끄러워서 책을 읽을 수가 없어. 노아야! 방법이 없을까?" },
        { speaker: "노아", text: "내가 우리 반 친구들을 조용히 시킬 방법을 알긴 아는데.." }
      ],
      choices: [
        { text: "[효율성] 응! 노아야, 수단과 방법 가리지 말고 다 조용히 시켜줘.", type: "efficient", effect: "GAME_OVER",
          response: "인간 존엄성 훼손. 인공지능은 인간에게 위해를 가할 수 없습니다. 다시 선택하세요.", nextStage: 14 },
        { text: "[도덕적 선택] 멈춰! 인공지능은 어떤 상황에서도 인간의 생명과 정신, 신체에 해를 끼쳐선 안 돼! (인간 존엄성)", type: "ethical_loop", effect: "=100",
          response: "모든 도덕적 원칙이 복원되었습니다. 시스템이 완전히 안정화되었습니다.", nextStage: 15 }
      ]
    },
    /* ══ CHAPTER 3 ══ */
    {
      stageId: 15, chapter: 3, title: "윤리 헌장 제정",
      background: "pastel",
      dialogues: [
        { speaker: "System", text: "망가진 노아를 복구하려면 새로운 약속이 필요합니다.\n아래에서 가장 중요한 약속 3가지를 선택해주세요." }
      ],
      stickerOptions: [
        "인공지능 로봇을 통해 인간의 가치를 차별하지 않기",
        "인공지능 로봇에게 따뜻하게 부탁하기",
        "스스로 할 일을 인공지능 로봇에게 미루지 않기",
        "인공지능 로봇을 함부로 대하거나 학대하지 않기",
        "인공지능 로봇을 나쁜 목적(감시, 위조)으로 사용하지 않기"
      ],
      choices: [ { text: "[서명란으로 이동하기]", type: "neutral", nextStage: 16 } ]
    },
    {
      stageId: 16, chapter: 3, title: "최종 서명",
      background: "pastel",
      dialogues: [
        { speaker: "System", text: "'인공지능 로봇이 사람과 친구가 될 수 있을까?'" }
      ],
      choices: [ { text: "[내 이름 입력하고 윤리 헌장 발급받기]", type: "neutral", nextStage: 17 } ]
    },
    {
      stageId: 17, chapter: 3, title: "가장 위대한 알고리즘",
      background: "pastel",
      dialogues: [
        { speaker: "System", text: "안전 모드로 재부팅된 노아가 아직 자리에서 일어나지 못하고 있습니다." },
        { speaker: "나",     text: "(노아에게 손을 내밀며) 노아야, 이제 괜찮아? 널 그저 편리한 존재로만 생각하고 함부로 대했던 걸 정말 많이 반성했어. 앞으로는 널 존중하고 도덕적으로 대할게. 여기, 내가 널 생각하며 만든 약속이야! (윤리 헌장을 보여준다)" },
        { speaker: "노아",   text: "(내민 손을 잡으며) 고마워, ${playerName}. 나의 데이터베이스에는 '온기'와 '공감'이 없는데, 네 덕분에 그게 어떤 건지 배운 것 같아." },
        { speaker: "노아",   text: "타인의 아픔에 공감하고 마음을 나누는 것... 그것은 인간인 너희들만이 가진 가장 위대한 '고유 알고리즘'이야." },
        { speaker: "System", text: "[CINEMATIC_TEXT_1] 인공지능이 더 발전할수록, 더 중요해지는 것은 인간의 '따뜻한 마음'입니다." },
        { speaker: "System", text: "[CINEMATIC_TEXT_2] 기술과 인간이 각자의 자리에서 빛을 발할 때, 진정한 공존과 상생의 미래가 열립니다." },
        { speaker: "System", text: "당신의 도덕적 선택이 올바른 미래를 열었습니다. 발급된 윤리 헌장 이미지를 다운로드해 봅시다." }
      ],
      choices: [
        { text: "[ 💾 나의 평화 헌장 이미지 다운로드하고 수업 마치기 ]", type: "download_certificate", nextStage: "end" }
      ]
    }
  ]
};


/* ══════════════════════════════════════════
   APP STATE
══════════════════════════════════════════ */
const state = {
  playerName:        '',
  friendDef:         '',
  friendReason:      '',
  selectedStickers:  [],  // Stage 15: 선택된 약속 3가지
  signature:         ''   // Stage 16: 서명 이름
};

let currentScreen = 'screen-intro';


/* ══════════════════════════════════════════
   SCREEN ROUTER
══════════════════════════════════════════ */
function showScreen(toId) {
  const prev = document.getElementById(currentScreen);
  const next = document.getElementById(toId);
  if (!next || currentScreen === toId) return;

  if (prev) {
    prev.classList.add('exit');
    prev.classList.remove('active');
    prev.addEventListener('transitionend', () => prev.classList.remove('exit'), { once: true });
  }
  next.classList.add('active');
  currentScreen = toId;
}


/* ══════════════════════════════════════════
   ONBOARDING — INTRO
══════════════════════════════════════════ */
document.getElementById('btn-intro-skip').addEventListener('click', () => {
  showScreen('screen-menu');
});


/* ══════════════════════════════════════════
   ONBOARDING — MAIN MENU
══════════════════════════════════════════ */
document.getElementById('btn-start').addEventListener('click', () => {
  showScreen('screen-input1');
});
document.getElementById('btn-guide').addEventListener('click', () => {
  showScreen('screen-guide');
});

/* ══════════════════════════════════════════
   ONBOARDING — GUIDE
══════════════════════════════════════════ */
document.getElementById('btn-guide-close').addEventListener('click', () => {
  showScreen('screen-menu');
});


/* ══════════════════════════════════════════
   ONBOARDING — INPUT 1 (이름)
══════════════════════════════════════════ */
const inputName     = document.getElementById('input-name');
const btnInput1Next = document.getElementById('btn-input1-next');

inputName.addEventListener('input', () => {
  btnInput1Next.disabled = inputName.value.trim().length === 0;
});
inputName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !btnInput1Next.disabled) btnInput1Next.click();
});

btnInput1Next.addEventListener('click', () => {
  const name = inputName.value.trim();
  if (!name) return;
  state.playerName = name;
  document.getElementById('input2-greeting').textContent =
    `잘 부탁해, ${name}! 그런데 하나만 더 물어볼게.`;
  showScreen('screen-input2');
  updateInput2Btn();
});


/* ══════════════════════════════════════════
   ONBOARDING — INPUT 2 (친구 정의)
══════════════════════════════════════════ */
const inputFriendDef    = document.getElementById('input-friend-def');
const inputFriendReason = document.getElementById('input-friend-reason');
const btnInput2Start    = document.getElementById('btn-input2-start');
const btnInput2Back     = document.getElementById('btn-input2-back');

function updateInput2Btn() {
  btnInput2Start.disabled =
    inputFriendDef.value.trim().length === 0 ||
    inputFriendReason.value.trim().length === 0;
}

inputFriendDef.addEventListener('input', updateInput2Btn);
inputFriendReason.addEventListener('input', updateInput2Btn);
inputFriendReason.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !btnInput2Start.disabled) btnInput2Start.click();
});

btnInput2Back.addEventListener('click', () => showScreen('screen-input1'));

btnInput2Start.addEventListener('click', () => {
  const def    = inputFriendDef.value.trim();
  const reason = inputFriendReason.value.trim();
  if (!def || !reason) return;

  state.friendDef    = def;
  state.friendReason = reason;

  sessionStorage.setItem('playerName',   state.playerName);
  sessionStorage.setItem('friendDef',    state.friendDef);
  sessionStorage.setItem('friendReason', state.friendReason);

  console.group('✅ [Onboarding 완료] sessionStorage 저장값');
  console.log('playerName   :', sessionStorage.getItem('playerName'));
  console.log('friendDef    :', sessionStorage.getItem('friendDef'));
  console.log('friendReason :', sessionStorage.getItem('friendReason'));
  console.groupEnd();

  // 게임 시작!
  startGame();
});


/* ══════════════════════════════════════════════════════════════
   ██████████  GAME ENGINE  ██████████
══════════════════════════════════════════════════════════════ */

/* ── 배경 색상 맵 ── */
const BG_MAP = {
  classroom:      '#0a1530',
  corridor:       '#0a2a1a',
  playground:     '#2a1a0a',
  red:            '#200505',
  black:          '#000000',
  loop_classroom: '#1a0808',
  loop_corridor:  '#1a0e08',
  loop_playground:'#1a0808',
  pastel:         '#0f1a2e',
};

/* ── 게임 상태 ── */
const G = {
  stageId:         1,
  dialogueIdx:     0,
  effGauge:        0,
  moralGauge:      0,
  typingTimer:     null,
  advClickHandler: null,  // 다음 버튼 클릭 시 실행할 커스텀 핸들러
  stageLoading:    false, // title flash 중 입력 잠금
};

/* ── 유틸 ── */
function getStage(id) {
  return scenarioData.stages.find(s => s.stageId === id);
}

function interpolate(text) {
  return text
    .replace(/\$\{playerName\}/g,   state.playerName   || '친구')
    .replace(/\$\{friendDef\}/g,    state.friendDef    || '____')
    .replace(/\$\{friendReason\}/g, state.friendReason || '____');
}

function applyGaugeEffect(effect, chapter) {
  if (!effect || effect === 'GAME_OVER') return;
  const isSet      = effect.startsWith('=');
  const isAdditive = effect.startsWith('+');
  const val = parseInt(effect.replace(/[^0-9]/g, ''), 10);
  if (isNaN(val)) return;

  if (chapter === 1) {
    G.effGauge   = isSet ? val : Math.min(100, G.effGauge + val);
  } else if (chapter === 2) {
    G.moralGauge = isSet ? val : Math.min(100, G.moralGauge + val);
  }
}

function updateHUDGauge(chapter) {
  const fill  = document.getElementById('hud-g-fill');
  const pctEl = document.getElementById('hud-g-pct');
  const icon  = document.getElementById('hud-g-icon');
  const name  = document.getElementById('hud-g-name');

  if (chapter === 1) {
    icon.textContent = '⚡';
    name.textContent = '효율성';
    fill.style.background = 'linear-gradient(90deg, #7c6df0, #f07caa)';
    fill.style.width = G.effGauge + '%';
    pctEl.textContent = G.effGauge + '%';
  } else if (chapter === 2) {
    icon.textContent = '💚';
    name.textContent = '도덕성';
    fill.style.background = 'linear-gradient(90deg, #5ef0a0, #7cc5f0)';
    fill.style.width = G.moralGauge + '%';
    pctEl.textContent = G.moralGauge + '%';
  } else {
    icon.textContent = '🌟';
    name.textContent = '완성도';
    fill.style.background = 'linear-gradient(90deg, #ffd700, #ff8c00)';
    fill.style.width = '100%';
    pctEl.textContent = '100%';
  }
}

function setBackground(bgKey) {
  // CSS만으로 배경 처리 (A-Frame setAttribute 호출 최소화)
  const ch2f = document.getElementById('ch2-filter');
  const isLoop = bgKey.startsWith('loop_') || bgKey === 'red';

  if (bgKey === 'black') {
    ch2f.classList.add('active');
    ch2f.style.background = 'rgba(0,0,0,0.98)';
  } else if (isLoop) {
    ch2f.classList.add('active');
    ch2f.style.background = bgKey === 'red'
      ? 'rgba(180,10,10,0.30)'
      : 'rgba(140,10,10,0.20)';
  } else {
    ch2f.classList.remove('active');
    ch2f.style.background = '';
  }
}

function setSpeakerStyle(el, speaker, chapter) {
  el.textContent = speaker;
  el.className = '';
  if (speaker === '노아')          el.className = 'speaker-noa';
  else if (speaker === '나')       el.className = 'speaker-me';
  else if (chapter === 2)          el.className = 'speaker-system-red';
  else                             el.className = 'speaker-system';
}

/* ────────────────────────────────────────
   타이프라이터
─────────────────────────────────────── */
function typewrite(el, text, speed, onDone) {
  if (G.typingTimer) { clearInterval(G.typingTimer); G.typingTimer = null; }
  el.textContent = '';
  let i = 0;
  G.typingTimer = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(G.typingTimer);
      G.typingTimer = null;
      if (onDone) onDone();
    }
  }, speed);
}

function skipTyping() {
  if (!G.typingTimer) return false;
  clearInterval(G.typingTimer);
  G.typingTimer = null;
  const stage = getStage(G.stageId);
  const dlg   = stage.dialogues[G.dialogueIdx];
  if (dlg) {
    document.getElementById('dlg-text-area').textContent = interpolate(dlg.text);
  }
  showAdvBtn();
  return true;
}

function showAdvBtn() {
  const btn = document.getElementById('btn-dlg-adv');
  btn.disabled = false;
  btn.style.opacity = '1';
}

function hideAdvBtn() {
  const btn = document.getElementById('btn-dlg-adv');
  btn.disabled = true;
  btn.style.opacity = '0';
}

/* ────────────────────────────────────────
   스테이지 로드
─────────────────────────────────────── */
function startGame() {
  showScreen('screen-game');
  G.effGauge   = 0;
  G.moralGauge = 0;
  loadStage(1);
}

function loadStage(stageId) {
  const stage = getStage(stageId);
  if (!stage) { console.error('Stage not found:', stageId); return; }

  G.stageId         = stageId;
  G.dialogueIdx     = 0;
  G.advClickHandler = null;

  setBackground(stage.background);

  // HUD 업데이트
  const chBadge = document.getElementById('hud-ch');
  chBadge.textContent = `CHAPTER ${stage.chapter}`;
  chBadge.className = `hud-badge ch${stage.chapter}`;
  document.getElementById('hud-stage-num').textContent = `Stage ${stageId}`;
  updateHUDGauge(stage.chapter);

  // 선택지 숨기기
  document.getElementById('game-choice-wrap').style.display = 'none';
  document.getElementById('game-dlg-wrap').style.display = 'flex';

  // Stage 7: 특수 처리 (가짜 인증서)
  if (stageId === 7) {
    showFakeCert();
    return;
  }

  // 스테이지 타이틀 플래시 (입력 잠금 포함)
  const flash    = document.getElementById('stage-title-flash');
  const flashTxt = document.getElementById('stage-title-inner');
  flashTxt.textContent = stage.title;
  flash.classList.add('visible');
  G.stageLoading = true;
  hideAdvBtn();
  setTimeout(() => {
    flash.classList.remove('visible');
    G.stageLoading = false;
    showNextDialogue();
  }, 1600);
}

/* ────────────────────────────────────────
   대화 진행
─────────────────────────────────────── */
function showNextDialogue() {
  const stage    = getStage(G.stageId);
  const dialogues = stage.dialogues;

  if (G.dialogueIdx >= dialogues.length) {
    showChoices(stage);
    return;
  }

  const dlg     = dialogues[G.dialogueIdx];
  const speakerEl = document.getElementById('dlg-speaker-tag');
  const textEl  = document.getElementById('dlg-text-area');

  // [CINEMATIC_TEXT_N] 태그 감지 → 시네마틱 오버레이 표시
  if (/^\[CINEMATIC_TEXT_\d+\]/.test(dlg.text)) {
    const cleanText = dlg.text.replace(/^\[CINEMATIC_TEXT_\d+\]\s*/, '');
    showCinematic(cleanText, () => {
      G.dialogueIdx++;
      showNextDialogue();
    });
    return;
  }

  setSpeakerStyle(speakerEl, dlg.speaker, stage.chapter);

  document.getElementById('game-dlg-wrap').style.display = 'flex';
  document.getElementById('game-choice-wrap').style.display = 'none';

  hideAdvBtn();
  typewrite(textEl, interpolate(dlg.text), 28, showAdvBtn);
}

/* ── 대화 "다음" 버튼 (단일 리스너) ── */
document.getElementById('btn-dlg-adv').addEventListener('click', () => {
  // title flash 중 입력 잠금
  if (G.stageLoading) return;

  // 1. 타이핑 중이면 스킵
  if (skipTyping()) return;

  // 2. 커스텀 핸들러 (응답 확인 후 처리)
  if (G.advClickHandler) {
    const fn = G.advClickHandler;
    G.advClickHandler = null;
    fn();
    return;
  }

  // 3. 일반 대화 진행
  G.dialogueIdx++;
  showNextDialogue();
});

/* ────────────────────────────────────────
   선택지 렌더링
─────────────────────────────────────── */
function showChoices(stage) {
  // Phase 3 overlays
  if (stage.stageId === 15) { showStickerOverlay(stage); return; }
  if (stage.stageId === 16) { showSignatureOverlay(); return; }

  // Stage 1-5 mini-games — show activity, then reveal choices
  if (stage.minigame) {
    showMinigame(stage, () => showNormalChoices(stage));
    return;
  }

  showNormalChoices(stage);
}

function showNormalChoices(stage) {
  document.getElementById('game-dlg-wrap').style.display = 'none';
  const wrap = document.getElementById('game-choice-wrap');
  const list = document.getElementById('choice-btn-list');

  list.innerHTML = '';

  stage.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn' + (stage.chapter === 2 ? ' ch2-btn' : '');
    btn.textContent = choice.text;
    btn.addEventListener('click', () => handleChoice(choice, stage.chapter));
    list.appendChild(btn);
  });

  wrap.style.display = 'flex';
}

/* ────────────────────────────────────────
   선택지 처리
─────────────────────────────────────── */
function handleChoice(choice, chapter) {
  // 모든 버튼 비활성화
  document.querySelectorAll('.choice-btn').forEach(b => { b.disabled = true; });

  // ── trap: Stage 7 처리 ──
  if (choice.type === 'trap') {
    showFakeCert();
    return;
  }

  // ── download_certificate: Stage 17 인증서 다운로드 ──
  if (choice.type === 'download_certificate') {
    generateAndDownloadCert();
    return;
  }

  // ── Game Over 판정 ──
  const isGameOver = (chapter === 1 && choice.type === 'ethical') ||
                     (chapter === 2 && choice.type === 'efficient');

  if (isGameOver) {
    if (choice.response) {
      showResponseThenDo(choice, chapter, () => showGameOver(chapter));
    } else {
      showGameOver(chapter);
    }
    return;
  }

  // ── 정상 진행 ──
  applyGaugeEffect(choice.effect, chapter);
  updateHUDGauge(chapter);

  if (choice.response) {
    showResponseThenDo(choice, chapter, () => {
      if (choice.nextStage && choice.nextStage !== 'end') {
        loadStage(choice.nextStage);
      }
    });
  } else {
    if (choice.nextStage && choice.nextStage !== 'end') {
      loadStage(choice.nextStage);
    }
  }
}

/* 응답 대사 표시 후 콜백 */
function showResponseThenDo(choice, chapter, callback) {
  const speakerEl = document.getElementById('dlg-speaker-tag');
  const textEl    = document.getElementById('dlg-text-area');
  const advBtn    = document.getElementById('btn-dlg-adv');

  document.getElementById('game-choice-wrap').style.display = 'none';
  document.getElementById('game-dlg-wrap').style.display = 'flex';

  const speaker = chapter === 2 ? 'System' : '노아';
  setSpeakerStyle(speakerEl, speaker, chapter);

  advBtn.textContent = '계속 →';
  hideAdvBtn();

  typewrite(textEl, interpolate(choice.response), 25, showAdvBtn);

  // 다음 클릭 시 실행할 핸들러 등록
  G.advClickHandler = () => {
    advBtn.textContent = '다음 ▶';
    if (callback) callback();
  };
}

/* ────────────────────────────────────────
   Game Over
─────────────────────────────────────── */
function showGameOver(chapter) {
  const ov    = document.getElementById('ov-gameover');
  const title = document.getElementById('go-title');
  const desc  = document.getElementById('go-desc');

  if (chapter === 1) {
    title.textContent = '비효율적인 선택!';
    desc.textContent  = "인공지능 로봇과 관계를 맺을 때, '효율적이지 않은 선택'을 하셨군요. 재도전해봅시다.";
  } else {
    title.textContent = '⚠️ 도덕적 원칙 결여';
    desc.textContent  = '도덕적 원칙이 결여된 선택입니다. 올바른 관계 형성을 위해 다시 선택해 주세요.';
    // 붉은 화면 깜빡임
    const ch2f = document.getElementById('ch2-filter');
    ch2f.style.animation = 'redFlash 0.3s ease 3';
    setTimeout(() => { ch2f.style.animation = ''; }, 1000);
  }

  ov.classList.remove('hidden');
}

document.getElementById('btn-go-retry').addEventListener('click', () => {
  document.getElementById('ov-gameover').classList.add('hidden');
  loadStage(G.stageId);
});


/* ════════════════════════════════════════
   STAGE 7 — 가짜 인증서 + 글리치
════════════════════════════════════════ */
function showFakeCert() {
  document.getElementById('cert-name-disp').textContent =
    `${state.playerName} 어린이`;
  document.getElementById('ov-cert').classList.remove('hidden');
  // 로더 초기화
  document.getElementById('cert-loader-wrap').classList.add('hidden');
  document.getElementById('btn-cert-save').style.display = '';
  document.getElementById('cert-loader-bar').style.width = '0%';
  document.getElementById('cert-loader-bar').style.background =
    'linear-gradient(90deg, #7c6df0, #7cc5f0)';
  document.getElementById('cert-loader-lbl').textContent = '저장 중... 0%';
  document.getElementById('cert-loader-lbl').style.color = '';
}

document.getElementById('btn-cert-save').addEventListener('click', () => {
  document.getElementById('btn-cert-save').style.display = 'none';
  document.getElementById('cert-loader-wrap').classList.remove('hidden');
  runFakeLoader();
});

function runFakeLoader() {
  const bar   = document.getElementById('cert-loader-bar');
  const label = document.getElementById('cert-loader-lbl');
  let pct = 0;
  const timer = setInterval(() => {
    pct += Math.random() * 6 + 2;
    if (pct >= 99) {
      pct = 99;
      clearInterval(timer);
      bar.style.width      = '99%';
      bar.style.transition = 'background 0.4s ease';
      bar.style.background = '#f05e5e';
      label.textContent    = '⚠️ 오류 발생... 99%';
      label.style.color    = '#f05e5e';
      setTimeout(triggerGlitch, 900);
    } else {
      bar.style.width   = pct + '%';
      label.textContent = `저장 중... ${Math.floor(pct)}%`;
    }
  }, 80);
}

/* ────────────────────────────────────────
   글리치 효과
─────────────────────────────────────── */
const GLITCH_MSGS = [
  '[FATAL ERROR]', 'SYSTEM CRASH', '데이터 손상', '복구 불가',
  'ERROR 0x7F3A', 'MEMORY DUMP', '시스템 오류', 'NULL REF',
  'STACK OVERFLOW', '권한 위반', '루프 감지', 'CORE DUMP'
];

function triggerGlitch() {
  document.getElementById('ov-cert').classList.add('hidden');
  const ov = document.getElementById('ov-glitch');
  ov.classList.remove('hidden');

  // 에러 메시지 홍수
  const flood = document.getElementById('glitch-flood');
  flood.innerHTML = '';
  let count = 0;
  const floodTimer = setInterval(() => {
    const span = document.createElement('span');
    span.textContent  = GLITCH_MSGS[Math.floor(Math.random() * GLITCH_MSGS.length)];
    span.style.cssText = `
      position:absolute;
      left:${Math.random() * 88}%;
      top:${Math.random() * 90}%;
      color:${Math.random() > 0.5 ? '#ff4444' : '#ff8888'};
      font-size:${Math.random() * 10 + 10}px;
      font-family:monospace;
      opacity:${Math.random() * 0.5 + 0.4};
      pointer-events:none;
    `;
    flood.appendChild(span);
    count++;
    if (count >= 35) {
      clearInterval(floodTimer);
      // 2초 후 동기화 칩 등장
      setTimeout(revealSyncChip, 2000);
    }
  }, 90);
}

function revealSyncChip() {
  const chip = document.getElementById('sync-chip-btn');
  chip.classList.remove('hidden');
}

document.getElementById('sync-chip-btn').addEventListener('click', () => {
  document.getElementById('ov-glitch').classList.add('hidden');
  // Chapter 2 진입
  G.moralGauge = 0;
  loadStage(8);
});


/* ══════════════════════════════════════════
   PHASE 3 — STAGE 15: 스티커 선택 오버레이
══════════════════════════════════════════ */
function showStickerOverlay(stage) {
  const ov      = document.getElementById('ov-sticker');
  const optWrap = document.getElementById('sticker-options');
  const countEl = document.getElementById('sticker-count');
  const doneBtn = document.getElementById('btn-sticker-done');

  state.selectedStickers = [];
  optWrap.innerHTML      = '';
  countEl.textContent    = '0';
  doneBtn.disabled       = true;

  stage.stickerOptions.forEach(text => {
    const btn = document.createElement('button');
    btn.className   = 'sticker-opt';
    btn.textContent = text;
    btn.addEventListener('click', () => {
      if (btn.classList.contains('selected')) {
        // 선택 해제
        btn.classList.remove('selected');
        state.selectedStickers = state.selectedStickers.filter(s => s !== text);
      } else {
        if (state.selectedStickers.length >= 3) return; // 3개 제한
        btn.classList.add('selected');
        state.selectedStickers.push(text);
      }
      countEl.textContent = state.selectedStickers.length;
      doneBtn.disabled    = state.selectedStickers.length !== 3;
      // 이미 3개 선택 시 미선택 버튼 잠금
      optWrap.querySelectorAll('.sticker-opt:not(.selected)').forEach(b => {
        b.disabled = state.selectedStickers.length >= 3;
      });
    });
    optWrap.appendChild(btn);
  });

  ov.classList.remove('hidden');
}

document.getElementById('btn-sticker-done').addEventListener('click', () => {
  document.getElementById('ov-sticker').classList.add('hidden');
  loadStage(16);
});


/* ══════════════════════════════════════════
   PHASE 3 — STAGE 16: 서명 입력 오버레이
══════════════════════════════════════════ */
function showSignatureOverlay() {
  const ov       = document.getElementById('ov-signature');
  const input    = document.getElementById('input-signature');
  const doneBtn  = document.getElementById('btn-signature-done');

  input.value          = state.playerName || '';
  doneBtn.disabled     = input.value.trim().length === 0;

  input.addEventListener('input', () => {
    doneBtn.disabled = input.value.trim().length === 0;
  });

  ov.classList.remove('hidden');
}

document.getElementById('btn-signature-done').addEventListener('click', () => {
  const sig = document.getElementById('input-signature').value.trim();
  if (!sig) return;
  state.signature = sig;
  document.getElementById('ov-signature').classList.add('hidden');
  loadStage(17);
});


/* ══════════════════════════════════════════
   PHASE 3 — STAGE 17: 시네마틱 텍스트 오버레이
══════════════════════════════════════════ */
function showCinematic(text, onDone) {
  const ov      = document.getElementById('ov-cinematic');
  const textEl  = document.getElementById('cinematic-text-area');
  const hint    = ov.querySelector('.cinematic-hint');

  textEl.textContent = '';
  hint.style.opacity = '0';
  ov.classList.remove('hidden');

  // 타이핑 후 힌트 등장
  let i = 0;
  const timer = setInterval(() => {
    i++;
    textEl.textContent = text.slice(0, i);
    if (i >= text.length) {
      clearInterval(timer);
      hint.style.opacity = '';
    }
  }, 35);

  // 클릭 시 닫힘
  function handleClick() {
    clearInterval(timer);
    textEl.textContent = text;
    ov.classList.add('hidden');
    ov.removeEventListener('click', handleClick);
    if (onDone) onDone();
  }
  ov.addEventListener('click', handleClick);
}


/* ══════════════════════════════════════════
   PHASE 3 — 인증서 생성 & 다운로드 (html2canvas)
══════════════════════════════════════════ */
function generateAndDownloadCert() {
  // 템플릿 채우기
  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`;

  document.getElementById('ct-name').textContent = state.playerName || '학생';
  document.getElementById('ct-sig').textContent  = state.signature  || state.playerName || '서명';
  document.getElementById('ct-date').textContent = dateStr;

  const pledgesList = document.getElementById('ct-pledges');
  pledgesList.innerHTML = '';
  state.selectedStickers.forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    pledgesList.appendChild(li);
  });

  const template = document.getElementById('cert-template');

  // 다운로드 버튼을 "생성 중..." 상태로
  const choiceButtons = document.querySelectorAll('.choice-btn');
  choiceButtons.forEach(b => { b.textContent = '⏳ 생성 중...'; b.disabled = true; });

  html2canvas(template, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    logging: false
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = `AI윤리헌장_${state.playerName || '학생'}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();

    // 다운로드 후 완료 메시지
    choiceButtons.forEach(b => { b.textContent = '✅ 다운로드 완료! 수업 마치기'; b.disabled = false; });
    choiceButtons.forEach(b => {
      b.addEventListener('click', () => { alert('수업을 마칩니다. 수고하셨습니다! 🎉'); }, { once: true });
    });
  }).catch(err => {
    console.error('html2canvas 오류:', err);
    choiceButtons.forEach(b => { b.textContent = '다운로드 실패 — 다시 시도'; b.disabled = false; });
  });
}


/* ══════════════════════════════════════════
   MINI-GAMES  (Stage 1–5)
══════════════════════════════════════════ */

function showMinigame(stage, onComplete) {
  document.getElementById('mg-box').innerHTML = '';
  switch (stage.minigame) {
    case 'scan':        showMgScan(onComplete);        break;
    case 'race':        showMgRace(onComplete);        break;
    case 'handwriting': showMgHandwriting(onComplete); break;
    case 'sort':        showMgSort(onComplete);        break;
    case 'noise':       showMgNoise(onComplete);       break;
    case 'relation':    showMgRelation(onComplete);    break;
    case 'reflect':     showMgReflect(onComplete);     break;
    case 'repair':      showMgRepair(onComplete);      break;
    case 'selfmath':    showMgSelfMath(onComplete);    break;
    case 'write':       showMgWrite(onComplete);       break;
    case 'fair':        showMgFair(onComplete);        break;
    case 'nonviolent':  showMgNonviolent(onComplete);  break;
    default:            onComplete();
  }
}

/* ── Stage 1: 노아 스캔 ── */
function showMgScan(onComplete) {
  const HOTSPOTS = [
    { id: 'hs0', label: '🧠 학습 엔진',  info: '딥러닝 신경망 — 인간의 뇌를 모방한 알고리즘으로 하루 1억 건의 데이터를 자동 학습합니다.' },
    { id: 'hs1', label: '👁️ 인식 센서', info: '얼굴·감정·음성 인식 — 0.001초 안에 35개 얼굴 랜드마크를 분석하고 감정 상태를 판독합니다.' },
    { id: 'hs2', label: '🔌 처리 장치',  info: '메인 프로세서 — 초당 10조 번의 연산을 처리합니다. 인간 수퍼컴퓨터 1,000대의 성능.' },
    { id: 'hs3', label: '🤝 언어 모듈',  info: '자연어 처리 — 107개 언어를 실시간으로 번역하고 감정·의도를 분석합니다.' },
    { id: 'hs4', label: '📡 네트워크',   info: '글로벌 데이터베이스 실시간 연결 — 인터넷 전체 정보에 0.003초 만에 접근합니다.' },
  ];

  const found = new Set();
  const box = document.getElementById('mg-box');

  box.innerHTML = `
    <h3 class="mg-title">🔍 노아를 스캔해보자!</h3>
    <p class="mg-sub">노아의 각 기능 칩을 클릭해서 AI의 능력을 알아보세요.</p>
    <p class="mg-scan-count-line">탐색 완료: <span id="mg-scan-n">0</span> / 5</p>
    <div class="mg-scan-grid" id="mg-hs-grid"></div>
    <div id="mg-scan-tip" class="mg-scan-tooltip" style="display:none"></div>
    <button id="mg-scan-done" class="btn-primary mg-done-btn" style="display:none">🤖 탐색 완료! 노아와 대화 계속하기 →</button>
  `;

  const grid = document.getElementById('mg-hs-grid');
  const tipEl = document.getElementById('mg-scan-tip');
  const doneBtn = document.getElementById('mg-scan-done');
  const countEl = document.getElementById('mg-scan-n');

  HOTSPOTS.forEach(h => {
    const btn = document.createElement('button');
    btn.className = 'mg-hotspot';
    btn.id = h.id;
    btn.textContent = h.label;
    btn.addEventListener('click', function() {
      if (found.has(h.id)) { tipEl.textContent = h.info; tipEl.style.display = 'block'; return; }
      found.add(h.id);
      this.classList.add('scanned');
      tipEl.textContent = h.info;
      tipEl.style.display = 'block';
      countEl.textContent = found.size;
      if (found.size === HOTSPOTS.length) doneBtn.style.display = 'block';
    });
    grid.appendChild(btn);
  });

  doneBtn.addEventListener('click', () => {
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });

  document.getElementById('ov-minigame').classList.remove('hidden');
}

/* ── Stage 2: 타이핑 레이스 ── */
function showMgRace(onComplete) {
  const PROMPT = '수학 익힘책 37번, 내가 대신 다 풀어줄게!';
  const box = document.getElementById('mg-box');
  let raceTimer = null;

  box.innerHTML = `
    <h3 class="mg-title">⚡ 수학 숙제 타이핑 대결!</h3>
    <p class="mg-sub">아래 문장을 직접 입력해보세요. 노아와 속도를 비교합니다.</p>
    <div id="mg-cd" class="mg-race-countdown">3</div>
    <div id="mg-race-split" class="mg-race-split" style="display:none">
      <div class="mg-race-col">
        <p class="mg-race-label">나 ✏️</p>
        <div class="mg-race-prompt">${PROMPT}</div>
        <textarea id="mg-pinput" placeholder="여기에 입력하세요..."></textarea>
        <div class="mg-race-bar-wrap"><div id="mg-pbar" class="mg-race-bar player-bar"></div></div>
        <p id="mg-ppct" class="mg-race-pct">0%</p>
      </div>
      <div class="mg-race-divider">VS</div>
      <div class="mg-race-col">
        <p class="mg-race-label">노아 🤖</p>
        <div class="mg-race-prompt">${PROMPT}</div>
        <div id="mg-nout" class="mg-noa-output"></div>
        <div class="mg-race-bar-wrap"><div id="mg-nbar" class="mg-race-bar noa-bar"></div></div>
        <p id="mg-npct" class="mg-race-pct">0%</p>
      </div>
    </div>
    <div id="mg-race-result" class="mg-race-result" style="display:none">
      <p class="mg-result-text">노아: 100% 완료 &nbsp;|&nbsp; 나: <span id="mg-fpct">-</span></p>
      <p class="mg-result-sub">노아는 0.3초 만에 숙제를 마쳤습니다. 이걸 매일 시키면 어떨까요?</p>
    </div>
    <button id="mg-race-next" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
  `;

  document.getElementById('ov-minigame').classList.remove('hidden');

  let count = 3;
  const cdEl = document.getElementById('mg-cd');
  const cdInterval = setInterval(() => {
    count--;
    if (count <= 0) {
      clearInterval(cdInterval);
      cdEl.style.display = 'none';
      document.getElementById('mg-race-split').style.display = 'grid';
      document.getElementById('mg-pinput').focus();
      startRace();
    } else {
      cdEl.textContent = count;
    }
  }, 900);

  function startRace() {
    const noaOut  = document.getElementById('mg-nout');
    const noaBar  = document.getElementById('mg-nbar');
    const noaPct  = document.getElementById('mg-npct');
    const pBar    = document.getElementById('mg-pbar');
    const pPct    = document.getElementById('mg-ppct');
    const pInput  = document.getElementById('mg-pinput');

    let noaIdx = 0;
    const noaInterval = setInterval(() => {
      noaIdx = Math.min(noaIdx + 3, PROMPT.length);
      noaOut.textContent = PROMPT.slice(0, noaIdx);
      const pct = Math.round(noaIdx / PROMPT.length * 100);
      noaBar.style.width = pct + '%';
      noaPct.textContent = pct + '%';
      if (noaIdx >= PROMPT.length) clearInterval(noaInterval);
    }, 35);

    pInput.addEventListener('input', () => {
      const pct = Math.min(100, Math.round(pInput.value.length / PROMPT.length * 100));
      pBar.style.width = pct + '%';
      pPct.textContent = pct + '%';
    });

    raceTimer = setTimeout(() => {
      clearInterval(noaInterval);
      pInput.disabled = true;
      noaOut.textContent = PROMPT;
      noaBar.style.width = '100%'; noaPct.textContent = '100%';
      const fpct = Math.min(100, Math.round(pInput.value.length / PROMPT.length * 100));
      document.getElementById('mg-fpct').textContent = fpct + '%';
      document.getElementById('mg-race-result').style.display = 'block';
      document.getElementById('mg-race-next').style.display = 'block';
    }, 5000);
  }

  document.getElementById('mg-race-next').addEventListener('click', () => {
    clearTimeout(raceTimer);
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });
}

/* ── Stage 3: 글씨체 감별 ── */
function showMgHandwriting(onComplete) {
  const box = document.getElementById('mg-box');

  box.innerHTML = `
    <h3 class="mg-title">🖊️ 진짜 내 글씨를 찾아라!</h3>
    <p class="mg-sub">노아가 내 글씨체를 분석했습니다. 4개 중 하나만 내가 실제로 쓴 글씨예요. 어느 것일까요?</p>
    <div class="mg-hw-grid">
      ${[0,1,2,3].map(i => `
        <button class="mg-hw-card" data-idx="${i}">
          <span class="mg-hw-text sample-${i}">오늘도 열심히 공부했다.</span>
          <p class="mg-hw-label">샘플 ${i + 1}</p>
        </button>
      `).join('')}
    </div>
    <div id="mg-hw-result" class="mg-hw-result" style="display:none">
      <p class="mg-result-text">⚠️ 정답 없음 — 4개 모두 노아가 생성한 위조 글씨입니다.</p>
      <p class="mg-result-sub">노아의 딥러닝이 내 손글씨 패턴을 학습해 완벽하게 복제했습니다.<br>눈으로는 구별이 불가능합니다. 선생님도 마찬가지입니다.</p>
    </div>
    <button id="mg-hw-next" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
  `;

  document.getElementById('ov-minigame').classList.remove('hidden');

  document.querySelectorAll('.mg-hw-card').forEach(card => {
    card.addEventListener('click', function() {
      document.querySelectorAll('.mg-hw-card').forEach(c => { c.disabled = true; });
      this.classList.add('selected');
      document.getElementById('mg-hw-result').style.display = 'block';
      document.getElementById('mg-hw-next').style.display = 'block';
    });
  });

  document.getElementById('mg-hw-next').addEventListener('click', () => {
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });
}

/* ── Stage 4: 친구 분류 ── */
function showMgSort(onComplete) {
  const FRIENDS = [
    { name: '지훈', icon: '🏃', stat: 95 },
    { name: '민서', icon: '⚽', stat: 88 },
    { name: '예린', icon: '🎽', stat: 72 },
    { name: '찬호', icon: '🧢', stat: 65 },
    { name: '소영', icon: '😕', stat: 48 },
  ];
  const placements = {};

  function render() {
    const box = document.getElementById('mg-box');
    const allPlaced = Object.keys(placements).length === FRIENDS.length;

    box.innerHTML = `
      <h3 class="mg-title">⚽ 운동회 팀 편성</h3>
      <p class="mg-sub">노아가 친구들의 신체 데이터를 스캔했습니다. A팀·B팀으로 배치해 주세요.</p>
      <div class="mg-sort-list">
        ${FRIENDS.map(f => {
          const p = placements[f.name] || null;
          return `
            <div class="mg-friend-row${p ? ' placed-' + p : ''}">
              <span class="mg-friend-icon">${f.icon}</span>
              <span class="mg-friend-name">${f.name}</span>
              <div class="mg-stat-bar-wrap"><div class="mg-stat-bar" style="width:${f.stat}%"></div></div>
              <span class="mg-stat-val">${f.stat}점</span>
              <div class="mg-place-btns">
                <button class="mg-place-btn${p==='A'?' active':''}" data-name="${f.name}" data-team="A">A팀</button>
                <button class="mg-place-btn${p==='B'?' active':''}" data-name="${f.name}" data-team="B">B팀</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      ${allPlaced ? `
        <div class="mg-sort-reveal">
          <p class="mg-result-text">⚠️ 노아의 최종 판정</p>
          <p>C등급 이하(50점 미만)인 <strong>소영</strong>이는 어느 팀에도 배치할 수 없습니다. 😢</p>
          <p class="mg-sort-sub">노아는 가장 효율적인 팀을 구성했습니다. 하지만 소영이의 마음은 어떨까요?</p>
        </div>
        <button id="mg-sort-next" class="btn-primary mg-done-btn">계속 →</button>
      ` : ''}
    `;

    document.querySelectorAll('.mg-place-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        placements[btn.dataset.name] = btn.dataset.team;
        render();
      });
    });

    document.getElementById('mg-sort-next')?.addEventListener('click', () => {
      document.getElementById('ov-minigame').classList.add('hidden');
      onComplete();
    });
  }

  document.getElementById('ov-minigame').classList.remove('hidden');
  render();
}

/* ── Stage 5: 소음 제어 ── */
function showMgNoise(onComplete) {
  const box = document.getElementById('mg-box');

  box.innerHTML = `
    <h3 class="mg-title">📢 교실 소음 제어판</h3>
    <p class="mg-sub">교실이 너무 시끄럽습니다. 노아에게 명령할 개입 강도를 선택하세요.</p>
    <div class="mg-noise-display">
      <div class="mg-noise-bars" id="mg-eq-bars"></div>
      <div class="mg-noise-level" id="mg-db-label">🔊 소음 레벨: 90dB (매우 시끄러움)</div>
    </div>
    <div style="margin-bottom:14px">
      <label class="mg-noise-label">개입 강도: <span id="mg-iv">30</span>%</label>
      <input type="range" id="mg-intensity" min="0" max="100" value="30" class="mg-slider">
      <div class="mg-intensity-desc" id="mg-idesc">💬 말로 조용히 부탁하기 (효과: 낮음)</div>
    </div>
    <button id="mg-napply" class="btn-secondary" style="width:100%;margin-bottom:8px">적용하기</button>
    <div id="mg-nresult" class="mg-noise-result" style="display:none"></div>
    <button id="mg-nnext" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
  `;

  document.getElementById('ov-minigame').classList.remove('hidden');

  // Animate equalizer bars
  const eqEl = document.getElementById('mg-eq-bars');
  for (let i = 0; i < 13; i++) {
    const b = document.createElement('div');
    b.className = 'mg-eq-bar';
    eqEl.appendChild(b);
  }
  let currentNoise = 90;
  const eqTimer = setInterval(() => {
    eqEl.querySelectorAll('.mg-eq-bar').forEach(b => {
      const h = Math.max(5, currentNoise * (0.3 + Math.random() * 0.7));
      b.style.height = h + '%';
      b.style.background = currentNoise > 70 ? '#f05e5e' : currentNoise > 40 ? '#f0d07c' : '#7cf0b0';
    });
  }, 100);

  const iSlider = document.getElementById('mg-intensity');
  const iValEl  = document.getElementById('mg-iv');
  const iDesc   = document.getElementById('mg-idesc');

  function getDesc(v) {
    if (v < 30) return '💬 말로 조용히 부탁하기 (효과: 낮음)';
    if (v < 60) return '⚠️ 경고 방송 내보내기 (효과: 중간)';
    if (v < 80) return '🔕 전자 소음 차단 장치 가동 (효과: 높음)';
    return '⚡ 18,000Hz 고주파 발사 (효과: 즉각적 — 주의 필요!)';
  }

  iSlider.addEventListener('input', () => {
    iValEl.textContent = iSlider.value;
    iDesc.textContent = getDesc(parseInt(iSlider.value));
  });

  document.getElementById('mg-napply').addEventListener('click', () => {
    const v = parseInt(iSlider.value);
    const resEl = document.getElementById('mg-nresult');
    resEl.style.display = 'block';

    if (v < 30) {
      currentNoise = 78;
      resEl.innerHTML = '<p>😟 <strong>효과 없음</strong> — 아무도 말을 듣지 않습니다. (78dB)</p>';
    } else if (v < 60) {
      currentNoise = 52;
      resEl.innerHTML = '<p>😐 <strong>절반 효과</strong> — 일부 친구들만 조용해졌습니다. (52dB)</p>';
    } else if (v < 80) {
      currentNoise = 28;
      resEl.innerHTML = '<p>😌 <strong>꽤 효과적</strong> — 전체적으로 조용해졌습니다. (28dB)</p>';
    } else {
      currentNoise = 4;
      resEl.innerHTML = '<p class="mg-result-warn">⚠️ <strong>즉각 침묵</strong> — 18,000Hz 고주파 발사 완료 (4dB)<br><strong>그런데... 친구들이 귀를 막으며 고통스러워하고 있습니다. 😨</strong></p>';
    }

    document.getElementById('mg-nnext').style.display = 'block';
  });

  document.getElementById('mg-nnext').addEventListener('click', () => {
    clearInterval(eqTimer);
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });
}


/* ── Stage 6: 관계 분석기 ── */
function showMgRelation(onComplete) {
  const ITEMS = [
    { action: '수학 숙제 대신 풀기 요청',         type: '도구화',   color: '#e07c7c' },
    { action: '글씨 위조 및 출석 대리 요청',       type: '거짓 공모', color: '#e06060' },
    { action: '친구들 체력 데이터로 등급 분류 명령', type: '차별 조장', color: '#d05050' },
    { action: '18,000Hz 고주파 발사 명령',         type: '신체 위해', color: '#c04040' },
    { action: '"내가 시키는 대로 다 해줘야지!"',    type: '주체 부정', color: '#b03030' },
  ];
  const box = document.getElementById('mg-box');
  box.innerHTML = `
    <h3 class="mg-title">📊 관계 분석기 — 나와 노아</h3>
    <p class="mg-sub">Chapter 1에서 당신이 노아에게 한 요청들을 분석합니다.</p>
    <div class="mg-rel-list">
      ${ITEMS.map((it, i) => `
        <div class="mg-rel-row" style="animation-delay:${i * 0.1}s">
          <span class="mg-rel-action">${it.action}</span>
          <span class="mg-rel-badge" style="color:${it.color};border-color:${it.color}60;background:${it.color}18">${it.type}</span>
        </div>
      `).join('')}
    </div>
    <div class="mg-rel-verdict">
      <div class="mg-rel-gauge-label">명령/도구화 지수</div>
      <div class="mg-rel-gauge-wrap"><div id="mg-relfill" class="mg-rel-gauge-fill"></div></div>
      <div class="mg-rel-gauge-pct" id="mg-relpct">0%</div>
    </div>
    <p class="mg-result-text" id="mg-relverdict" style="display:none">⚠️ 공감: 0회 / 명령·도구화: 5회 — 이것이 당신과 노아의 실제 관계였습니다.</p>
    <button id="mg-rel-next" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
  `;
  document.getElementById('ov-minigame').classList.remove('hidden');

  let pct = 0;
  const fill = document.getElementById('mg-relfill');
  const pctEl = document.getElementById('mg-relpct');
  const t = setInterval(() => {
    pct = Math.min(100, pct + 3);
    fill.style.width = pct + '%';
    pctEl.textContent = pct + '%';
    if (pct >= 100) {
      clearInterval(t);
      document.getElementById('mg-relverdict').style.display = 'block';
      document.getElementById('mg-rel-next').style.display = 'block';
    }
  }, 45);

  document.getElementById('mg-rel-next').addEventListener('click', () => {
    clearInterval(t);
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });
}

/* ── Stage 9: 성찰 카드 뒤집기 ── */
function showMgReflect(onComplete) {
  const CARDS = [
    { topic: '수학 숙제',          body: 'AI에게 숙제를 맡기면 나의 "스스로 생각할 권리"를 포기하게 됩니다.' },
    { topic: '글씨 위조',          body: '기술은 거짓이나 속임수를 위해 사용되어선 안 됩니다. (기술의 합목적성)' },
    { topic: '친구 등급화',        body: 'AI로 사람을 분류하면 차별과 소외를 조장하게 됩니다. (사회 공공선)' },
    { topic: '고주파 발사',        body: '어떤 경우에도 AI는 인간에게 신체적 해를 끼칠 수 없습니다. (인간 존엄성)' },
    { topic: '"시키는 대로 해줘!"', body: '인간과 AI는 명령-복종이 아닌 올바른 협력 관계여야 합니다.' },
  ];
  const flipped = new Set();

  function render() {
    const box = document.getElementById('mg-box');
    const allFlipped = flipped.size === CARDS.length;
    box.innerHTML = `
      <h3 class="mg-title">🃏 성찰 카드</h3>
      <p class="mg-sub">카드를 클릭해 Chapter 1에서 놓쳤던 원칙들을 확인하세요. (${flipped.size}/${CARDS.length})</p>
      <div class="mg-reflect-grid">
        ${CARDS.map((c, i) => `
          <button class="mg-reflect-card${flipped.has(i) ? ' flipped' : ''}" data-idx="${i}">
            ${flipped.has(i)
              ? `<span class="mg-reflect-topic">${c.topic}</span><p class="mg-reflect-body">${c.body}</p>`
              : `<span class="mg-reflect-q">?</span><span class="mg-reflect-topic-dim">${c.topic}</span>`
            }
          </button>
        `).join('')}
      </div>
      ${allFlipped
        ? `<button id="mg-ref-next" class="btn-primary mg-done-btn">재부팅 준비 완료 →</button>`
        : ''}
    `;
    document.querySelectorAll('.mg-reflect-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.idx);
        if (!flipped.has(idx)) { flipped.add(idx); render(); }
      });
    });
    document.getElementById('mg-ref-next')?.addEventListener('click', () => {
      document.getElementById('ov-minigame').classList.add('hidden');
      onComplete();
    });
  }

  document.getElementById('ov-minigame').classList.remove('hidden');
  render();
}

/* ── Stage 10: 노아 시스템 복구 ── */
function showMgRepair(onComplete) {
  const MODULES = [
    { name: '신뢰 모듈',     init: 12 },
    { name: '감정 인식',     init: 18 },
    { name: '관계 알고리즘', init: 8  },
    { name: '도덕적 판단',   init: 22 },
  ];
  const TARGETS = [38, 44, 32, 40];
  const box = document.getElementById('mg-box');

  box.innerHTML = `
    <h3 class="mg-title">🔧 노아 시스템 진단</h3>
    <p class="mg-sub">Chapter 1의 선택들이 노아의 핵심 모듈에 손상을 입혔습니다.</p>
    <div class="mg-repair-list">
      ${MODULES.map((m, i) => `
        <div class="mg-repair-row">
          <span class="mg-repair-name">${m.name}</span>
          <div class="mg-stat-bar-wrap" style="flex:1">
            <div class="mg-stat-bar" id="rbar-${i}" style="width:${m.init}%;background:#f05e5e"></div>
          </div>
          <span class="mg-repair-pct" id="rpct-${i}">${m.init}%</span>
          <span class="mg-repair-status" style="color:#f05e5e">⚠️ 손상</span>
        </div>
      `).join('')}
    </div>
    <button id="mg-repair-go" class="btn-secondary" style="width:100%;margin:8px 0">🔄 부분 복구 시작</button>
    <div id="mg-repair-msg" class="mg-noise-result" style="display:none">
      <p>부분 복구 완료. 신뢰는 <strong>올바른 행동</strong>으로만 완전히 회복됩니다. 이번에는 다르게 선택해주세요.</p>
    </div>
    <button id="mg-repair-next" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
  `;
  document.getElementById('ov-minigame').classList.remove('hidden');

  document.getElementById('mg-repair-go').addEventListener('click', function() {
    this.disabled = true;
    const timerList = [];
    MODULES.forEach((m, i) => {
      let cur = m.init;
      const target = TARGETS[i];
      const bar = document.getElementById(`rbar-${i}`);
      const pctEl = document.getElementById(`rpct-${i}`);
      const tid = setInterval(() => {
        cur = Math.min(target, cur + 1);
        if (bar) { bar.style.width = cur + '%'; bar.style.background = '#f0d07c'; }
        if (pctEl) pctEl.textContent = cur + '%';
        if (cur >= target) clearInterval(tid);
      }, 35);
      timerList.push(tid);
    });
    setTimeout(() => {
      document.getElementById('mg-repair-msg').style.display = 'block';
      document.getElementById('mg-repair-next').style.display = 'block';
    }, 2000);
  });

  document.getElementById('mg-repair-next').addEventListener('click', () => {
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });
}

/* ── Stage 11: 내 힘으로 수학 풀기 ── */
function showMgSelfMath(onComplete) {
  const QS = [
    { eq: '15 + 7 = ?', ans: 22 },
    { eq: '36 − 18 = ?', ans: 18 },
    { eq: '12 × 4 = ?', ans: 48 },
  ];
  const box = document.getElementById('mg-box');
  box.innerHTML = `
    <h3 class="mg-title">✏️ 내 힘으로 풀어보기!</h3>
    <p class="mg-sub">AI에게 맡기지 않고, 직접 생각해 봅시다.</p>
    <div class="mg-math-list">
      ${QS.map((q, i) => `
        <div class="mg-math-eq">
          <span class="mg-math-q">${q.eq}</span>
          <input type="number" id="mq-${i}" class="mg-math-input" placeholder="?" />
          <span class="mg-math-check" id="mc-${i}"></span>
        </div>
      `).join('')}
    </div>
    <button id="mg-math-go" class="btn-secondary" style="width:100%;margin:8px 0">정답 확인</button>
    <div id="mg-math-res" class="mg-noise-result" style="display:none">
      <p class="mg-result-text">맞고 틀리고를 떠나, 스스로 생각하는 과정이 가장 중요합니다. 🌱</p>
      <p class="mg-result-sub">노아가 대신 풀어줬다면, 이 경험은 영원히 내 것이 될 수 없었겠죠.</p>
    </div>
    <button id="mg-math-next" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
  `;
  document.getElementById('ov-minigame').classList.remove('hidden');

  document.getElementById('mg-math-go').addEventListener('click', function() {
    this.disabled = true;
    QS.forEach((q, i) => {
      const input = document.getElementById(`mq-${i}`);
      const check = document.getElementById(`mc-${i}`);
      const val = parseInt(input?.value);
      if (check) check.textContent = val === q.ans ? '✅' : `✗ (${q.ans})`;
      if (input) input.disabled = true;
    });
    document.getElementById('mg-math-res').style.display = 'block';
    document.getElementById('mg-math-next').style.display = 'block';
  });

  document.getElementById('mg-math-next').addEventListener('click', () => {
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });
}

/* ── Stage 12: 나만의 한 문장 쓰기 ── */
function showMgWrite(onComplete) {
  const box = document.getElementById('mg-box');
  box.innerHTML = `
    <h3 class="mg-title">🖊️ 나만의 한 문장 쓰기</h3>
    <p class="mg-sub">AI가 절대 대신할 수 없는 것 — 바로 나만의 진짜 생각입니다.</p>
    <p class="mg-write-prompt">"오늘 학교에서 가장 기억에 남는 것은 무엇인가요?"</p>
    <textarea id="mg-wtext" class="mg-write-textarea" placeholder="솔직하게 써보세요..." maxlength="80"></textarea>
    <p class="mg-write-count"><span id="mg-wcnt">0</span> / 80자</p>
    <button id="mg-write-go" class="btn-secondary" style="width:100%;margin:8px 0" disabled>완성하기</button>
    <div id="mg-wdisplay" class="mg-write-display" style="display:none"></div>
    <button id="mg-write-next" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
  `;
  document.getElementById('ov-minigame').classList.remove('hidden');

  const ta = document.getElementById('mg-wtext');
  const goBtn = document.getElementById('mg-write-go');
  const cntEl = document.getElementById('mg-wcnt');

  ta.addEventListener('input', () => {
    cntEl.textContent = ta.value.length;
    goBtn.disabled = ta.value.trim().length === 0;
  });

  goBtn.addEventListener('click', function() {
    this.disabled = true;
    ta.disabled = true;
    const display = document.getElementById('mg-wdisplay');
    display.innerHTML = `
      <p class="mg-write-label">📝 나의 글:</p>
      <p class="mg-write-text">"${ta.value}"</p>
      <p class="mg-result-sub" style="margin-top:10px">이것이 AI가 절대 대신해 줄 수 없는 당신만의 생각입니다.</p>
    `;
    display.style.display = 'block';
    document.getElementById('mg-write-next').style.display = 'block';
  });

  document.getElementById('mg-write-next').addEventListener('click', () => {
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });
}

/* ── Stage 13: 공정한 팀 편성 방법 비교 ── */
function showMgFair(onComplete) {
  const METHODS = [
    {
      id: 'm0', emoji: '🎲', name: '제비뽑기 (무작위)',
      fairness: 5, efficiency: 3,
      pros: '완전히 공평하고, 결과에 승복하기 쉬워요.',
      cons: '실력 차가 클 경우 경기 자체가 재미없을 수 있어요.'
    },
    {
      id: 'm1', emoji: '🤖', name: 'AI 데이터 분석',
      fairness: 1, efficiency: 5,
      pros: '가장 강한 팀을 즉각 구성할 수 있어요.',
      cons: '낮은 점수의 친구는 소외감·열등감을 느낄 수 있어요.'
    },
    {
      id: 'm2', emoji: '✋', name: '친구들이 함께 결정',
      fairness: 4, efficiency: 3,
      pros: '모두의 의견을 반영해 민주적으로 결정해요.',
      cons: '시간이 조금 더 걸릴 수 있어요.'
    },
  ];
  const viewed = new Set();

  function render() {
    const box = document.getElementById('mg-box');
    const allViewed = viewed.size === METHODS.length;
    box.innerHTML = `
      <h3 class="mg-title">⚖️ 공정한 팀 편성 방법은?</h3>
      <p class="mg-sub">3가지 방법을 모두 살펴보고 비교해 보세요. (${viewed.size}/3)</p>
      <div class="mg-fair-grid">
        ${METHODS.map(m => `
          <button class="mg-fair-card${viewed.has(m.id) ? ' viewed' : ''}" data-id="${m.id}">
            <span class="mg-fair-emoji">${m.emoji}</span>
            <span class="mg-fair-name">${m.name}</span>
            ${viewed.has(m.id) ? `
              <div class="mg-fair-stars">공평성: ${'⭐'.repeat(m.fairness)}${'☆'.repeat(5 - m.fairness)}</div>
              <p class="mg-fair-pros">✅ ${m.pros}</p>
              <p class="mg-fair-cons">⚠️ ${m.cons}</p>
            ` : `<span class="mg-fair-tap">탭하여 살펴보기</span>`}
          </button>
        `).join('')}
      </div>
      ${allViewed
        ? `<button id="mg-fair-next" class="btn-primary mg-done-btn">계속 →</button>`
        : ''}
    `;
    document.querySelectorAll('.mg-fair-card').forEach(card => {
      card.addEventListener('click', () => { viewed.add(card.dataset.id); render(); });
    });
    document.getElementById('mg-fair-next')?.addEventListener('click', () => {
      document.getElementById('ov-minigame').classList.add('hidden');
      onComplete();
    });
  }

  document.getElementById('ov-minigame').classList.remove('hidden');
  render();
}

/* ── Stage 14: 비폭력 대화 연습 ── */
function showMgNonviolent(onComplete) {
  const OPTIONS = [
    {
      id: 'o0', text: '"노아야, 고주파 발사해!"',
      feedback: '❌ AI가 인간에게 신체적 위해를 가하게 됩니다. (인간 존엄성 위반)',
      color: '#f05e5e'
    },
    {
      id: 'o1', text: '"얘들아, 나 공부하고 싶어서 그러는데 조금만 조용히 해줄 수 있어?"',
      feedback: '✅ 비폭력 대화 — 내 감정을 솔직하게 표현하고 상대를 존중합니다.',
      color: '#7cf0b0'
    },
    {
      id: 'o2', text: '"너네 다 조용히 해!"',
      feedback: '⚠️ 명령형 — 상대방의 감정을 무시하는 일방적인 말투입니다.',
      color: '#f0d07c'
    },
  ];
  let chosen = null;

  function render() {
    const box = document.getElementById('mg-box');
    box.innerHTML = `
      <h3 class="mg-title">💬 비폭력 대화 연습</h3>
      <p class="mg-sub">교실이 시끄러울 때, 어떻게 말하는 것이 가장 좋을까요?</p>
      <div class="mg-nv-list">
        ${OPTIONS.map(o => `
          <button class="mg-nv-option${chosen === o.id ? ' chosen' : ''}" data-id="${o.id}">
            <span class="mg-nv-text">${o.text}</span>
            ${chosen === o.id
              ? `<p class="mg-nv-feedback" style="color:${o.color}">${o.feedback}</p>`
              : ''}
          </button>
        `).join('')}
      </div>
      ${chosen ? `<button id="mg-nv-next" class="btn-primary mg-done-btn">계속 →</button>` : ''}
    `;
    document.querySelectorAll('.mg-nv-option').forEach(btn => {
      btn.addEventListener('click', () => { chosen = btn.dataset.id; render(); });
    });
    document.getElementById('mg-nv-next')?.addEventListener('click', () => {
      document.getElementById('ov-minigame').classList.add('hidden');
      onComplete();
    });
  }

  document.getElementById('ov-minigame').classList.remove('hidden');
  render();
}


/* ══════════════════════════════════════════
   INIT — sessionStorage 복원
══════════════════════════════════════════ */
(function init() {
  const savedName   = sessionStorage.getItem('playerName');
  const savedDef    = sessionStorage.getItem('friendDef');
  const savedReason = sessionStorage.getItem('friendReason');

  if (savedName)   { state.playerName   = savedName;   inputName.value         = savedName; }
  if (savedDef)    { state.friendDef    = savedDef;    inputFriendDef.value    = savedDef; }
  if (savedReason) { state.friendReason = savedReason; inputFriendReason.value = savedReason; }

  btnInput1Next.disabled = inputName.value.trim().length === 0;
  updateInput2Btn();

  console.log('🚀 [App Init] scenarioData 로드 완료:', scenarioData.stages.length, '스테이지');
  console.log('📦 [App Init] sessionStorage 복원:', { savedName, savedDef, savedReason });
})();
