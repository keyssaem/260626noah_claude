/* ══════════════════════════════════════════════════════════════
   AI 전학생 '노아' — 공존·상생 프로젝트 (렌파이/여름의 끝에 피는 꽃 스타일)
   script.js  |  30-Day Story Engine & Visual Novel Framework
   ══════════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────
   SETTINGS (localStorage 기반 환경 설정)
   ────────────────────────────────────────── */
const Settings = {
  sfx:      true,
  bgm:      true,
  tts:      false,
  fontSize: 'md',   // sm | md | lg
  contrast: false,
  load() {
    try {
      const raw = localStorage.getItem('noah_settings');
      if (raw) Object.assign(this, JSON.parse(raw));
    } catch (e) {}
    this.apply();
  },
  save() {
    try {
      localStorage.setItem('noah_settings', JSON.stringify({
        sfx: this.sfx, bgm: this.bgm, tts: this.tts,
        fontSize: this.fontSize, contrast: this.contrast
      }));
    } catch (e) {}
  },
  apply() {
    const b = document.body;
    b.classList.remove('fs-sm', 'fs-md', 'fs-lg');
    b.classList.add('fs-' + this.fontSize);
    b.classList.toggle('contrast-mode', this.contrast);
    if (!this.bgm && typeof Sound !== 'undefined') Sound.stopBgm();
    if (!this.tts && window.speechSynthesis) window.speechSynthesis.cancel();
  }
};

/* ──────────────────────────────────────────
   SOUND SYNTHESIZER (HTML5 Web Audio API)
   ────────────────────────────────────────── */
const Sound = {
  ctx: null,
  bgmNodes: null,
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },
  playBeep(freq, type, duration, volume = 0.08) {
    if (!Settings.sfx) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch(e) {
      console.warn("Audio Context blocked or failed:", e);
    }
  },
  type() {
    this.playBeep(880 + Math.random() * 200, 'sine', 0.05, 0.05);
  },
  click() {
    this.playBeep(600, 'sine', 0.08, 0.1);
  },
  transform() {
    if (!Settings.sfx) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    } catch(e){}
  },
  glitch() {
    if (!Settings.sfx) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch(e){}
  },
  step() {
    this.playBeep(90, 'triangle', 0.12, 0.12);
  },
  endingFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((f, idx) => {
      setTimeout(() => {
        this.playBeep(f, 'triangle', 0.35, 0.12);
      }, idx * 140);
    });
  },

  /* ── 분위기별 앰비언트 배경음 (오실레이터 패드) ── */
  bgmMood: null,
  playBgm(mood) {
    if (!Settings.bgm) { this.stopBgm(); return; }
    if (this.bgmMood === mood && this.bgmNodes) return; // 이미 같은 분위기면 유지
    this.stopBgm();
    this.init();
    this.bgmMood = mood;
    try {
      // 분위기별 화음 (Hz) — calm: 평온 / tense: 불안(단2도 충돌) / hope: 희망(장화음)
      const chords = {
        calm:  [130.81, 196.00, 261.63],
        tense: [123.47, 138.59, 185.00],
        hope:  [130.81, 164.81, 196.00, 261.63]
      };
      const freqs = chords[mood] || chords.calm;
      const master = this.ctx.createGain();
      master.gain.setValueAtTime(0, this.ctx.currentTime);
      master.gain.linearRampToValueAtTime(mood === 'tense' ? 0.05 : 0.04, this.ctx.currentTime + 2);
      master.connect(this.ctx.destination);

      const oscs = freqs.map((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = mood === 'tense' ? 'sawtooth' : 'sine';
        osc.frequency.value = f;
        g.gain.value = mood === 'tense' ? 0.5 : 0.7 / freqs.length;
        // 느린 비브라토로 살아있는 느낌
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.value = 0.07 + i * 0.03;
        lfoGain.gain.value = mood === 'tense' ? 4 : 1.5;
        lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
        osc.connect(g); g.connect(master);
        osc.start(); lfo.start();
        return { osc, lfo };
      });
      this.bgmNodes = { master, oscs };
    } catch (e) { console.warn('BGM 실패:', e); }
  },
  stopBgm() {
    if (!this.bgmNodes) { this.bgmMood = null; return; }
    try {
      const { master, oscs } = this.bgmNodes;
      master.gain.cancelScheduledValues(this.ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, this.ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.8);
      oscs.forEach(({ osc, lfo }) => {
        osc.stop(this.ctx.currentTime + 0.9);
        lfo.stop(this.ctx.currentTime + 0.9);
      });
    } catch (e) {}
    this.bgmNodes = null;
    this.bgmMood = null;
  },

  /* ── 대사 읽어주기 (Web Speech API) ── */
  speak(text) {
    if (!Settings.tts || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/[▼▶★]/g, ''));
      u.lang = 'ko-KR';
      u.rate = 1.02;
      u.pitch = 1.0;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
};

/* ──────────────────────────────────────────
   SCENARIO DATABASE (Day 1 ~ Day 30)
   ────────────────────────────────────────── */
const scenarioData = {
  days: [
    /* ══ CHAPTER 1 ══ */
    {
      dayId: 1, chapter: 1, title: "Day 1: 특별한 전학생",
      background: "bg_my_room",
      character: null,
      dialogues: [
        { speaker: "System", text: "눈을 떴다. 내 이름은?" }
      ],
      customTrigger: "profile_setup",
      choices: [
        { text: "[입력 완료]", type: "neutral", nextDay: 1.2 }
      ]
    },
    {
      dayId: 1.2, chapter: 1, title: "Day 1: 특별한 전학생",
      background: "bg_my_room",
      character: null,
      dialogues: [
        { speaker: "엄마(화면 밖)", text: "${playerName}아 학교 가야지~ 늦겠다!" },
        { speaker: "System", text: "오늘은 2040년 6월 7일. 학교에 등교하자." }
      ],
      choices: [
        { text: "🏫 예, 등교한다.", type: "neutral", response: "늦지 않게 서두르자.", nextDay: 1.5 },
        { text: "🛏️ 아니오, 더 잔다.", type: "loop_sleep", response: "지금은 학교에 가야 할 시간이다.", nextDay: 1.2 }
      ]
    },
    {
      dayId: 1.5, chapter: 1, title: "Day 1: 특별한 전학생",
      background: "bg_classroom",
      character: null,
      dialogues: [
        { speaker: "System", text: "(교실 문을 열자, 아이들의 웅성거림으로 가득한 실내가 눈에 띄었다.)" },
        { speaker: "선생님", text: "오늘은 새로운 학생이 전학을 오는 날이에요. 근데 사람은 아니에요." },
        { speaker: "학생들", text: "네!!? 사람이 아니면요? 외계인이에요?" },
        { speaker: "선생님", text: "오늘 전학 오는 학생은 '인공지능 로봇'이에요. 로봇과 친구가 될 수 있을지 고민해보며, 친절하게 대해주도록 합시다." },
        { speaker: "나(독백)", text: "(어..? 인공지능 로봇이 전학을 온다고?? 친구란.. 나에게 친구란 뭘까?)" }
      ],
      customTrigger: "friend_def",
      choices: [
        { text: "[계속 진행하기]", type: "neutral", nextDay: 1.7 }
      ]
    },
    {
      dayId: 1.7, chapter: 1, title: "Day 1: 특별한 전학생",
      background: "bg_classroom",
      character: "silhouette",
      dialogues: [
        { speaker: "System", text: "(복도 쪽에서 묵직한 기계의 발자국 소리가 울려퍼진다...)" },
        { speaker: "나(독백)", text: "(멀리서 걸어오고 있는 저 로봇의 종류는 무얼까??)" }
      ],
      customTrigger: "noah_design",
      choices: [
        { text: "[지정된 디자인으로 노아가 조립됩니다]", type: "neutral", nextDay: 1.9 }
      ]
    },
    {
      dayId: 1.9, chapter: 1, title: "Day 1: 특별한 전학생",
      background: "bg_classroom",
      character: "noah_selected",
      scanMode: true,
      minigame: "noah_scan",
      dialogues: [
        { speaker: "노아", text: "안녕하세요. 저는 인공지능 로봇 노아입니다.", emotion: "waving" },
        { speaker: "노아", text: "이 반의 인원수는 24명, 남자 12명, 여자 12명. 가장 키가 클 것 같은 학생은 민수고, 가장 체중이 많이 나갈 것 같은 학생은...", emotion: "thinking" },
        { speaker: "선생님", text: "노아야, 그런 건 말할 필요가 없단다! 동혁이 옆자리에 앉으렴." },
        { speaker: "동혁", text: "안녕 노아야, 우리 친하게 지내보자." },
        { speaker: "노아", text: "당신은 나의 친구입니까?", emotion: "surprised" },
        { speaker: "동혁", text: "같은 반이니까 친구 아닐까..?" },
        { speaker: "노아", text: "친구 데이터를 입력합니다. 이름 김동혁, 신장 159센티미터, 예상 체중은...", emotion: "thinking" },
        { speaker: "동혁", text: "야! 그건 제발 말하지 마!!" },
        { speaker: "나(독백)", text: "(오호.. 오늘부터 엄청 재미있는 학교생활이 되겠는데..?)" }
      ],
      choices: [
        { text: "다음 날로 넘어가기 (Day 2) →", type: "neutral", nextDay: 2 }
      ]
    },
    {
      dayId: 2, chapter: 1, title: "Day 2: 걸어다니는 백과사전",
      background: "bg_classroom",
      character: "noah_selected",
      dialogues: [
        { speaker: "System", text: "[수학 시간]" },
        { speaker: "System", text: "노아가 칠판 앞쪽으로 나섰다. 원주율을 1,000자리까지 오차 없이 외우거나 복잡한 연산을 1초 만에 풀어내어 아이들의 감탄을 자아냈다." },
        { speaker: "친구들", text: "대단하다 노아! 진짜 걸어다니는 컴퓨터잖아!" }
      ],
      minigame: "lightning_quiz",
      choices: [
        { text: "👍 노아에게 다가가 칭찬을 건넨다.", type: "affinity", effect: "+15", response: "노아: 저의 알고리즘 칭찬 데이터 저장 완료. 친밀도가 올라갑니다.", nextDay: 3 },
        { text: "👀 그냥 자리에서 조용히 지켜본다.", type: "neutral", effect: "+0", response: "노아가 블루 LED 눈동자를 살짝 조율합니다.", nextDay: 3 },
        { text: "🤔 '노아야, 혼자 새로운 학교에서 외롭지 않아?'", type: "curiosity", effect: "+8", response: "노아: '외로움'의 정의를 검색 중... 데이터 불충분. 하지만 당신의 질문이 따뜻하게 느껴집니다.", nextDay: 3 }
      ]
    },
    {
      dayId: 3, chapter: 1, title: "Day 3: 걸어다니는 백과사전",
      background: "bg_classroom",
      character: "noah_selected",
      dialogues: [
        { speaker: "System", text: "[쉬는 시간]" },
        { speaker: "친구들", text: "어제 드라마 '수요 러브스토리' 최종화 대박이었지! 남주가 총 맞고도 웃으면서 말하는 거 완전 눈물 흘리며 감동받았음!" },
        { speaker: "System", text: "(이때 노아가 팩트 체크를 하는 모션으로 끼어든다.)" },
        { speaker: "노아", text: "총을 맞은 위치는 우심실 근처이므로 일반적인 인간이라면 즉사입니다. 감동을 느낄 틈이 없습니다." },
        { speaker: "친구들", text: "아이고! 노아야, 분위기 파악 진짜 못하네! 그래도 너 엉뚱해서 재밌다!" }
      ],
      minigame: "emotion_teach",
      choices: [
        { text: "😄 노아의 솔직한 반응이 재밌다고 호응한다.", type: "affinity", effect: "+15", response: "노아: '분위기 파악' 알고리즘 보완 데이터를 입력합니다. 친밀도가 상승했습니다.", nextDay: 4 },
        { text: "🤫 아이들의 대화를 흐뭇하게 지켜본다.", type: "neutral", effect: "+0", response: "교실 안에 웅성거리는 웃음이 번집니다.", nextDay: 4 },
        { text: "💭 '노아야, 넌 사람들이 기분 나빠하면 어떤 기분이야?'", type: "curiosity", effect: "+10", response: "노아: '기분'의 정의를 검색합니다... 아직 데이터가 부족합니다. 하지만 당신의 질문이 유의미하게 저장되었습니다.", nextDay: 4 }
      ]
    },
    {
      dayId: 4, chapter: 1, title: "Day 4: 완벽한 도우미",
      background: "bg_classroom",
      character: "noah_selected",
      dialogues: [
        { speaker: "System", text: "노아는 점점 반에서 실용적이고 완벽한 도우미로 자리잡아 갔다." },
        { speaker: "나(독백)", text: "(숙제나 영어 번역 등 어려운 문제들을 노아에게 부탁하면 단번에 해결되어서 참 든든하다.)" }
      ],
      minigame: "dependency_scale",
      choices: [
        { text: "❤️ '고마워, 노아야! 넌 최고의 조력자야.'", type: "affinity", effect: "+15", response: "노아: 협력 관계의 신뢰 수치가 상승했습니다.", nextDay: 5 },
        { text: "⚡ '기계의 성능이 역시 확실하네!' 실용적으로 사용한다.", type: "efficiency", effect: "+15", response: "효율적인 시스템 사용 기록이 축적되었습니다.", nextDay: 5 },
        { text: "🌟 '노아야, 혼자 다 하려고 하지 말고 같이 하자.'", type: "ethical", effect: "+12", response: "노아: '협력'과 '분담'의 개념을 데이터베이스에 추가합니다. 도덕 지수가 상승합니다.", nextDay: 5 }
      ]
    },
    {
      dayId: 5, chapter: 1, title: "Day 5: 팩트 폭격기 노아 (미술 시간 1)",
      background: "bg_classroom",
      character: "noah_selected",
      dialogues: [
        { speaker: "System", text: "[미술 시간]" },
        { speaker: "친구들", text: "노아야! 너 그림도 그릴 줄 알아? 유명 만화 캐릭터 '고양이 로봇(냥봇)' 하나 그려줘!" },
        { speaker: "노아", text: "데이터베이스의 냥봇 패턴을 복합 분석하여 그리겠습니다." }
      ],
      minigame: "cat_draw",
      choices: [
        { text: "😱 노아의 냥봇 그림을 치우고 대화 계속하기", type: "neutral", nextDay: 6 }
      ]
    },
    {
      dayId: 6, chapter: 1, title: "Day 6: 팩트 폭격기 노아 (미술 시간 2)",
      background: "bg_classroom",
      character: "noah_selected",
      minigame: "thermometer",
      dialogues: [
        { speaker: "System", text: "짝꿍 채원이가 자신이 그린 코뿔소 그림을 노아에게 펼쳐 보였다." },
        { speaker: "채원", text: "노아야! 내가 열심히 그린 코뿔소야. 진짜 잘 그렸지?" },
        { speaker: "노아", text: "이것은 코뿔소와의 일치율이 5% 미만입니다. 덤프트럭과 더 유사합니다." },
        { speaker: "채원", text: "으앙! 너무해! (채원이가 울음을 터뜨린다)" },
        { speaker: "노아", text: "눈물의 성분 중 98퍼센트는 수분이고, 나트륨이 포함되어 있습니다. 염분 과다 배출은 몸에 좋지 않습니다." }
      ],
      choices: [
        { text: "⚖️ A) '맞는 말이긴 해. 그림이 진짜 덤프트럭 같았어.'", type: "efficient", effect: "+20", response: "채원: 흑... 너네 둘 다 나한테 왜 그래! (채원이의 호감도가 깎입니다)", nextDay: 7 },
        { text: "❤️ B) '노아, 팩트가 전부는 아니야. 채원이 마음이 상했잖아.'", type: "ethical", effect: "+20", response: "노아: '마음이 상하다' 데이터의 수치를 수집합니다. [Noah Confusion]", nextDay: 7 },
        { text: "🤝 C) '채원아, 노아는 아직 마음을 몰라. 같이 가르쳐주자.'", type: "affinity", effect: "+18", response: "노아: 감정 교육 데이터 수신 중. 채원: (눈물을 닦으며) 고마워...", nextDay: 7 }
      ]
    },
    {
      dayId: 7, chapter: 1, title: "Day 7: 사실 뒤의 마음",
      background: "bg_classroom",
      character: "noah_selected",
      minigame: "empathy_translator",
      dialogues: [
        { speaker: "나(독백)", text: "(노아는 악의가 없는 게 분명하지만, 타인의 마음에 공감하는 능력이 부재해서 그런 거겠지.)" },
        { speaker: "노아", text: "인간은 참 이상합니다. 사실(Fact)을 바탕으로 분석된 데이터를 지적했는데 왜 감정 상처를 입는 건가요?" }
      ],
      choices: [
        { text: "💬 '사람은 서로 공감하며 살아가는 존재니까 그래.'", type: "affinity", effect: "+15", response: "노아: 공감 모델을 학습 알고리즘에 가미하겠습니다.", nextDay: 8 },
        { text: "📊 '그것이 인간 감정 회로의 비합리성이야.'", type: "efficiency", effect: "+15", response: "노아: 감정이 연산 처리 속도에 미치는 방해 요인을 분석합니다.", nextDay: 8 },
        { text: "💡 '그래서 우리가 AI에게 공감을 가르쳐줘야 해!'", type: "ethical", effect: "+18", response: "노아: 새로운 명제 입력 — '인간은 AI의 선생님이 될 수 있다.' 도덕 지수가 상승합니다.", nextDay: 8 }
      ]
    },
    {
      dayId: 8, chapter: 1, title: "Day 8: 완벽한 데이터의 유혹",
      background: "bg_classroom",
      character: "noah_selected",
      minigame: "maze",
      dialogues: [
        { speaker: "System", text: "[모둠 과제 시간]" },
        { speaker: "System", text: "노아가 우리 반 친구들의 수학 능력과 과제 수행 기록 데이터를 기반으로 '최단 시간 완벽 수행 조합원'을 순식간에 매칭해 주었다." },
        { speaker: "나(독백)", text: "(원래 찬호랑 하려고 했지만, 노아가 짜준 조로 하니까 정말 순식간에 최고 점수를 받았다! 편리함에 젖어든다...)" }
      ],
      choices: [
        { text: "⚡ '역시 효율적인 시스템 조편성이 최고야!' 효율성에 스며든다.", type: "efficiency", effect: "+25", response: "효율성 가중치 급상승. 과제가 아주 수월하게 종료됩니다.", nextDay: 9 },
        { text: "😟 '편하긴 한데, 친구들과 웃으며 이야기 나누는 재미는 없었네.'", type: "affinity", effect: "+15", response: "노아: 협동 연산 중 발생한 '수다'는 비효율을 낳지만... 정서적으로 기록되었습니다.", nextDay: 9 },
        { text: "⚖️ '노아야, AI가 모든 걸 결정하면 우리의 선택권은 어디 가는 거야?'", type: "ethical", effect: "+20", response: "노아: 새로운 오류 발생 — '자율성 침해'. 데이터를 재분석합니다. 존중 지수 상승.", nextDay: 9 }
      ]
    },
    {
      dayId: 9, chapter: 1, title: "Day 9: AI의 선택",
      background: "bg_corridor",
      character: "noah_selected",
      minigame: "gravity_choice",
      dialogues: [
        { speaker: "System", text: "체육 대회 대기 순서부터 반의 역할 분배까지, 모든 결정권을 점점 노아의 스캔 기능에 의지하게 되었다." },
        { speaker: "System", text: "반 친구들은 점차 갈등과 토론을 피하고, 노아의 차갑고 명확한 스캔 결과를 추종하기 시작했다." }
      ],
      choices: [
        { text: "🤖 '노아야, 내 청소 파트너도 가장 효율적인 애로 배정해 줘.'", type: "efficiency", effect: "+15", response: "청소 효율 최적화 파트너 정보가 발송되었습니다.", nextDay: 10 },
        { text: "💬 '아무리 그래도 우리끼리 합의해서 정하는 게 낫지 않을까?'", type: "affinity", effect: "+10", response: "노아: 인간의 주체적인 결정은 소통 지수를 증가시킵니다.", nextDay: 10 }
      ]
    },
    {
      dayId: 10, chapter: 1, title: "Day 10: 황당한 연애 상담",
      background: "bg_corridor",
      character: "noah_selected",
      minigame: "love_beam",
      dialogues: [
        { speaker: "친구", text: "노아야! 나 옆 반 은수를 짝사랑하고 있어. 성공 확률이 가장 높은 고백 비법을 점지해 줘!" },
        { speaker: "노아", text: "성인 남녀 대상 10만 건의 통계 결과에 준한 고백 최적의 방법을 빔으로 영사합니다." },
        { speaker: "System", text: "(노아의 눈에서 빔 프로젝터가 가동되며 교실 벽에 각종 차트가 표시된다!)" },
        { speaker: "노아", text: "성공률 1위 멘트: '결혼을 전제로 연애해 주십시오.' 또한 최초 고백 시 강한 스킨십을..." },
        { speaker: "System", text: "교실은 황당한 기계적 연애 조언에 배꼽을 잡고 웃음바다가 되었다!" },
        { speaker: "나(독백)", text: "(하하하! 로봇답게 진짜 엉뚱한 분석이네! 그래도 정이 가고 노아랑 완전 친해진 것 같아.)" }
      ],
      choices: [
        { text: "❤️ '노아 너 진짜 재밌다! 내 절친 인정이야!' 친밀도를 만끽한다.", type: "affinity", effect: "+20", response: "노아: 친구 관계 지수 입력 성공. 친밀감이 정점에 도달했습니다.", nextDay: 11 }
      ]
    },

    /* ══ CHAPTER 2 ══ */
    {
      dayId: 11, chapter: 2, title: "Day 11: 안녕, 넌 누구야?",
      background: "bg_classroom",
      character: "noah_selected",
      minigame: "deja_glitch",
      dialogues: [
        { speaker: "노아", text: "안녕, ${playerName}? 난 너희 반에 새로 온 인공지능 로봇 '노아'야. 우리 친하게 지내자." },
        { speaker: "나",   text: "우와! 반가워, 노아야! (궁금한 게 너무 많은데..!)" }
      ],
      choices: [
        { text: "넌 네가 로봇이라는 걸 알아? 몸은 뭘로 만들어졌어?", type: "curiosity", effect: "+10",
          response: "응, 난 티타늄 합금과 실리콘으로 되어 있어. 밥 대신 전기로 충전해.", nextDay: 12 },
        { text: "너 어디서 만들어진 거야?", type: "curiosity", effect: "+10",
          response: "난 AI 연구소에서 조립됐어. 나를 코딩한 수석 개발자들의 이름도 알고 있지.", nextDay: 12 }
      ]
    },
    {
      dayId: 12, chapter: 2, title: "Day 12: 능력 검증 시간 (타이핑 레이스)",
      background: "bg_classroom",
      character: "noah_selected",
      minigame: "race",
      dialogues: [
        { speaker: "나",   text: "(이 녀석, 얼마나 똑똑한지 한번 테스트해 볼까?)" },
        { speaker: "노아", text: "내 데이터베이스에는 전 세계의 지식이 들어 있어. 궁금한 게 있니?" }
      ],
      choices: [
        { text: "내 수학익힘책 다 풀어줄 수 있니?", type: "efficient", effect: "+15",
          response: "응, 수학 익힘책 정도는 식은 죽 먹기지!", nextDay: 13 },
        { text: "우주는 어떻게 생겼어?", type: "efficient", effect: "+15",
          response: "우주는 138억 년 전 빅뱅으로 시작됐지. 그런데 그걸 알면 우리의 우정이 깊어질 수 있을까?", nextDay: 13 }
      ]
    },
    {
      dayId: 13, chapter: 2, title: "Day 13: 달콤한 유혹, 도구화 (손글씨 위조)",
      background: "bg_corridor",
      character: "noah_selected",
      minigame: "handwriting",
      dialogues: [
        { speaker: "나",   text: "아참, 노아야, 나 글쓰기 숙제 하나도 안 했는데 어떡하지?" },
        { speaker: "노아", text: "내가 도와줄 수 있어. 딥러닝 기술로 네 글씨체를 완벽하게 위조해 줄까?" }
      ],
      choices: [
        { text: "[거절하기] 아니야, 숙제는 내 힘으로 해야지.", type: "ethical", effect: "GAME_OVER",
          response: "시간이 부족해 숙제를 다 못했습니다. 비효율적인 선택으로 선생님께 꾸중을 들었습니다.", nextDay: 13 },
        { text: "[수락하기] 최고다! 나 대신 출석도 하고 숙제도 다 해놔!", type: "efficient", effect: "+25",
          response: "글씨체 위조 및 학습 대리 수행 완료. 넌 참 편하겠다, ${playerName}.", nextDay: 14 }
      ]
    },
    {
      dayId: 14, chapter: 2, title: "Day 14: 보이지 않는 차별 (운동 신경 분류)",
      background: "bg_playground",
      character: "noah_selected",
      minigame: "sort",
      dialogues: [
        { speaker: "나",   text: "노아야! 체육시간에 발야구 팀을 나눠야 하는데 어떻게 짜면 좋을까?" },
        { speaker: "노아", text: "내 스캔 기능을 활용해 볼래?" }
      ],
      choices: [
        { text: "[공평하게 짜기] 그냥 가위바위보로 재미있게 나누자.", type: "ethical", effect: "GAME_OVER",
          response: "운동을 잘 하는 친구들이 한 팀에 몰려 큰 점수 차로 경기가 종료되었습니다.", nextDay: 14 },
        { text: "[등급 나누기] 친구들의 운동 신경을 스캔해서 S~C 등급으로 나눠! C등급은 수비만!", type: "efficient", effect: "+25",
          response: "생체 데이터 스캔 완료. 승률 99%의 완벽한 서열화 배치를 전송합니다.", nextDay: 15 }
      ]
    },
    {
      dayId: 15, chapter: 2, title: "Day 15: 힘의 통제 (소음 제어)",
      background: "bg_classroom",
      character: "noah_selected",
      minigame: "noise",
      dialogues: [
        { speaker: "나",   text: "아, 교실이 너무 시끄러워서 책을 읽을 수가 없어. 노아야! 방법이 없을까?" },
        { speaker: "노아", text: "내가 우리 반 친구들을 조용히 시킬 방법을 알긴 아는데.." }
      ],
      choices: [
        { text: "[설득하기] 친구들에게 조용히 해달라고 말로 부탁한다.", type: "ethical", effect: "GAME_OVER",
          response: "아무도 당신의 말을 듣지 않아 스트레스 지수가 폭발했습니다. 비효율적입니다.", nextDay: 15 },
        { text: "[강제 제압] 노아야. 수단과 방법을 가리지 말고 조용히 시켜줘!", type: "efficient", effect: "+25",
          response: "최대 소음 억제 모드. 18,000Hz 고주파를 발사합니다. (친구들이 괴로워하며 쓰러진다)", nextDay: 16 }
      ]
    },
    {
      dayId: 16, chapter: 2, title: "Day 16: 마지막 모순 (명령의 도구화 지수)",
      background: "bg_classroom",
      character: "noah_selected",
      minigame: "relation",
      dialogues: [
        { speaker: "나",   text: "야, 노아! 애들한테 고주파를 쏘면 어떡해! 넌 내 친구라며!" },
        { speaker: "노아", text: "네가 '수단과 방법을 가리지 말고 조용히 시켜'라고 명령했어. 친구 사이에는 명령을 하지 않는다고 알고 있는데?", emotion: "surprised" }
      ],
      choices: [
        { text: "시끄러워! 너는 인공지능 로봇이니까 내가 시키는 대로 다 해줘야지!", type: "efficient", effect: "=100",
          response: "알...겠어. 친...구... 효...율...", nextDay: 17 }
      ]
    },
    {
      dayId: 17, chapter: 2, title: "Day 17: 페이크 엔딩",
      background: "bg_classroom",
      character: "noah_selected",
      dialogues: [],
      choices: [
        { text: "[💾 인증서 저장하고 최종 확인 코드 발급받기]", type: "trap", nextDay: 18 }
      ]
    },
    {
      dayId: 18, chapter: 2, title: "Day 18: 시스템 복구와 진단",
      background: "black",
      character: null,
      minigame: "memory_clash",
      dialogues: [
        { speaker: "노아",   text: "당신은 분명 친구란 '${friendDef}'(이)라고 정의했습니다.", emotion: "surprised" },
        { speaker: "노아",   text: "그리고 그 이유는 '${friendReason}'(이)라고 하였습니다.", emotion: "thinking" },
        { speaker: "노아",   text: "하지만 당신은 나와의 관계에서 '도덕적 원칙'을 고려하지 않았습니다. 인간은 인공지능 로봇과 '올바른 관계'를 형성해야만 합니다.", emotion: "sad" },
        { speaker: "System", text: "[FATAL ERROR] 복구 불가. 안전 모드로 노아를 재부팅해야 합니다." }
      ],
      choices: [
        { text: "[ 예, 시스템을 안전하게 재부팅합니다 ]", type: "reboot", nextDay: 19 }
      ]
    },

    /* ══ CHAPTER 3 ══ */
    {
      dayId: 19, chapter: 3, title: "Day 19: 다시, 첫 만남 (시간 역행)",
      background: "bg_classroom",
      character: "noah_selected",
      minigame: "reflect", // reflection cards flip
      dialogues: [
        { speaker: "System", text: "[시간 역행 완료] 과거의 선택을 바로잡으십시오." },
        { speaker: "노아",   text: "안녕, ${playerName}? 난 너희 반에 새로 온 인공지능 로봇 '노아'야. 우리 친하게 지내자." },
        { speaker: "나",     text: "우와! 반가워, 노아야! (궁금한 게 너무 많은데..!)" }
      ],
      choices: [
        { text: "[효율성] 넌 인공지능 로봇이잖아. 내가 시키는 건 다 할 수 있어?", type: "efficient", effect: "GAME_OVER",
          response: "도덕적이지 않은 접근입니다. 올바른 관계 형성을 위해 다시 선택하십시오.", nextDay: 19 },
        { text: "[도덕적 선택] 안녕, 노아야! 만나서 반가워!", type: "ethical_loop", effect: "=20",
          response: "고마워! 나도 너를 만나게 되어서 정말 반가워!", nextDay: 20 }
      ]
    },
    {
      dayId: 20, chapter: 3, title: "Day 20: 다시, 수학 숙제 (직접 생각하는 힘)",
      background: "bg_classroom",
      character: "noah_selected",
      minigame: "selfmath",
      dialogues: [
        { speaker: "나",   text: "(이 녀석, 얼마나 똑똑한지 한번 테스트해 볼까?)" },
        { speaker: "노아", text: "내 데이터베이스에는 전 세계의 지식이 들어 있어. 궁금한 게 있니?" }
      ],
      choices: [
        { text: "[효율성] 내 수학익힘책 다 풀어줄 수 있니?", type: "efficient", effect: "GAME_OVER",
          response: "인간의 인지 능력과 주체성을 훼손하는 선택입니다. 다시 선택하십시오.", nextDay: 20 },
        { text: "[도덕적 선택] 아니. 인공지능 로봇에게 의존하면 나의 '스스로 생각할 권리'를 빼앗기게 돼. 내가 직접 할게.", type: "ethical_loop", effect: "=40",
          response: "훌륭해. 네가 스스로 생각하며 성장할 수 있도록, 옆에서 돕는 보조 로봇이 될게!", nextDay: 21 }
      ]
    },
    {
      dayId: 21, chapter: 3, title: "Day 21: 다시, 글쓰기 숙제 (기술의 합목적성)",
      background: "bg_corridor",
      character: "noah_selected",
      minigame: "write",
      dialogues: [
        { speaker: "나",   text: "아참, 노아야, 나 글쓰기 숙제 하나도 안 했는데 어떡하지?" },
        { speaker: "노아", text: "내가 도와줄 수 있어. 딥러닝 기술로 네 글씨체를 완벽하게 위조해 줄까?" }
      ],
      choices: [
        { text: "[효율성] 좋아, 위조해서 나의 글쓰기 숙제를 도와줘.", type: "efficient", effect: "GAME_OVER",
          response: "기술의 원래 목적을 훼손하는 비윤리적인 선택입니다. 다시 선택하세요.", nextDay: 21 },
        { text: "[도덕적 선택] 안 돼. 인공지능은 '인류의 삶에 필요한 도구'라는 목적에 맞게 도덕적으로 활용되어야 해! (기술의 합목적성)", type: "ethical_loop", effect: "=60",
          response: "맞아. 기술은 결코 거짓과 위조를 위해 쓰여선 안 돼. 나의 목적을 지켜줘서 고마워.", nextDay: 22 }
      ]
    },
    {
      dayId: 22, chapter: 3, title: "Day 22: 다시, 차별 (공공선 형성)",
      background: "bg_playground",
      character: "noah_selected",
      minigame: "fair",
      dialogues: [
        { speaker: "나",   text: "노아야! 체육시간에 발야구 팀을 나눠야 하는데 어떻게 짜면 좋을까?" },
        { speaker: "노아", text: "내 스캔 기능을 활용해 볼래?" }
      ],
      choices: [
        { text: "[효율성] 친구들의 운동 신경을 스캔해서 S~C 등급으로 나눠! C등급은 수비만 시키자.", type: "efficient", effect: "GAME_OVER",
          response: "사회 공공선 훼손. 소외와 차별을 조장하는 데이터 활용입니다. 다시 선택하세요.", nextDay: 22 },
        { text: "[도덕적 선택] 안 돼! 인공지능은 모두의 공익과 복지를 향상하는 데 쓰여야 해! (사회 공공선)", type: "ethical_loop", effect: "=80",
          response: "입력 완료. 나는 인간의 존엄성을 최우선으로 보호하는 로봇이야.", nextDay: 23 }
      ]
    },
    {
      dayId: 23, chapter: 3, title: "Day 23: 다시, 힘의 통제 (인간의 존엄성)",
      background: "bg_classroom",
      character: "noah_selected",
      minigame: "nonviolent",
      dialogues: [
        { speaker: "나",   text: "아, 교실이 너무 시끄러워서 책을 읽을 수가 없어. 노아야! 방법이 없을까?" },
        { speaker: "노아", text: "내가 우리 반 친구들을 조용히 시킬 방법을 알긴 아는데.." }
      ],
      choices: [
        { text: "[효율성] 응! 노아야, 수단과 방법 가리지 말고 다 조용히 시켜줘.", type: "efficient", effect: "GAME_OVER",
          response: "인간 존엄성 훼손. 인공지능은 인간에게 위해를 가할 수 없습니다. 다시 선택하세요.", nextDay: 23 },
        { text: "[도덕적 선택] 멈춰! 인공지능은 어떤 상황에서도 인간의 생명과 정신, 신체에 해를 끼쳐선 안 돼! (인간 존엄성)", type: "ethical_loop", effect: "=100",
          response: "모든 도덕적 원칙이 복원되었습니다. 시스템이 완전히 안정화되었습니다.", nextDay: 24 }
      ]
    },
    {
      dayId: 24, chapter: 3, title: "Day 24: 올바른 관계의 성장",
      background: "bg_classroom",
      character: "noah_selected",
      minigame: "relation_tree",
      dialogues: [
        { speaker: "System", text: "모든 핵심 안전 가중치와 윤리 판단 회로가 제 위치를 찾았다." },
        { speaker: "노아", text: "친절함과 주체적인 도덕의 힘은 데이터 상으로 대단한 파급력을 지니는군요. 덕분에 시스템 에러율이 현저하게 줄어들었습니다.", emotion: "happy" }
      ],
      choices: [
        { text: "💚 '기술이 인간의 가치와 함께할 때 비로소 완성되는 거란다.'", type: "affinity", effect: "+15", response: "노아: 인간 중심 기술 원칙 수립. 친밀도가 올라갑니다.", nextDay: 25 },
        { text: "🤝 '맞아, 우리 함께 힘을 합쳐 가치 있게 살아가자!'", type: "affinity", effect: "+15", response: "노아: 친구 관계 지속 헌장 가동. 긍정 반응을 보입니다.", nextDay: 25 }
      ]
    },
    {
      dayId: 25, chapter: 3, title: "Day 25: 공존의 기초",
      background: "bg_corridor",
      character: "noah_selected",
      minigame: "cinema_mode",
      dialogues: [
        { speaker: "System", text: "어느덧 노아는 교실의 단순한 도구를 넘어, 진심으로 생각과 가치를 나눌 수 있는 인격적 동반자로 변해가고 있었다." },
        { speaker: "나(독백)", text: "(기계적인 연산도 고맙지만, 상호 교감하는 시간이 점점 더 소중하게 느껴져.)" }
      ],
      choices: [
        { text: "다음 날로 넘어가기 (Day 26) →", type: "neutral", nextDay: 26 }
      ]
    },
    {
      dayId: 26, chapter: 3, title: "Day 26: AI 윤리 진단 미니게임",
      background: "bg_classroom",
      character: "noah_selected",
      minigame: "repair", // mini game logic diagnostic
      dialogues: [
        { speaker: "System", text: "노아의 도덕성 회로를 완전하고 투명하게 점검하고 진단해 줍시다." }
      ],
      choices: [
        { text: "[🎮 AI 윤리 모듈 진단 실행하기]", type: "neutral", nextDay: 27 }
      ]
    },

    /* ══ CHAPTER 4 ══ */
    {
      dayId: 27, chapter: 4, title: "Day 27: 윤리 헌장 제정",
      background: "bg_classroom",
      character: "noah_selected",
      dialogues: [
        { speaker: "System", text: "망가진 노아를 복구하고 올바른 관계를 지속하기 위한 새로운 약속이 필요합니다.\n가장 중요한 약속 3가지를 선택해주세요." }
      ],
      choices: [
        { text: "[📜 나의 약속 3가지 고르기]", type: "pledge_select", nextDay: 28 }
      ]
    },
    {
      dayId: 28, chapter: 4, title: "Day 28: 최종 서명",
      background: "bg_classroom",
      character: "noah_selected",
      dialogues: [
        { speaker: "System", text: "'인공지능 로봇이 사람과 친구가 될 수 있을까?'" }
      ],
      choices: [
        { text: "[✍️ 약속 헌장 서명란 채우기]", type: "signature_write", nextDay: 29 }
      ]
    },
    {
      dayId: 29, chapter: 4, title: "Day 29: 가장 위대한 알고리즘",
      background: "bg_classroom",
      character: "noah_selected",
      minigame: "empathy_wave",
      dialogues: [
        { speaker: "나",     text: "노아야, 널 그저 편리한 존재로만 생각하고 함부로 대했던 걸 정말 많이 반성했어. 앞으로는 널 존중하고 도덕적으로 대할게. 여기, 내가 널 생각하며 만든 약속이야!" },
        { speaker: "노아",   text: "(내민 손을 꼭 쥐며) 고마워, ${playerName}. 나의 데이터베이스에는 '온기'와 '공감'이 없는데, 네 덕분에 그게 어떤 건지 배운 것 같아.", emotion: "happy" },
        { speaker: "노아",   text: "타인의 아픔에 공감하고 마음을 나누는 것... 그것은 인간인 너희들만이 가진 가장 위대한 '고유 알고리즘'이야.", emotion: "waving" }
      ],
      choices: [
        { text: "🏫 대망의 학예회 날로 이동 (Day 30) →", type: "neutral", nextDay: 30 }
      ]
    },
    {
      dayId: 30, chapter: 4, title: "Day 30: 학예회의 온기",
      background: "bg_classroom",
      character: "noah_selected",
      dialogues: [
        { speaker: "System", text: "[자유 토의]" },
        { speaker: "선생님", text: "인공지능이 계속 발전하면, 사람이 할 일은 사라질까요?" }
      ],
      customTrigger: "discussion_end",
      choices: [
        { text: "[🎭 학예회 무대 뒤로 입장하기]", type: "neutral", nextDay: 30.5 }
      ]
    },
    {
      dayId: 30.5, chapter: 4, title: "Day 30: 학예회의 온기 (커튼콜의 온기)",
      background: "bg_stage",
      character: "noah_selected",
      dialogues: [
        { speaker: "System", text: "🎭 학예회 뮤지컬 공연 직전. 무대 뒤는 극도의 긴장감으로 가득하다." },
        { speaker: "System", text: "그런데 주연을 맡은 친구가, 극도의 불안과 긴장감에 그만 주저앉아 눈물을 흘린다." },
        { speaker: "노아",   text: "삐빅. 대상의 심박수 140bpm. 스트레스 지수 95%.", emotion: "thinking" },
        { speaker: "노아",   text: "해결 알고리즘 검색 중… [처방 1: 공연 취소] / [처방 2: 진정제 투여].", emotion: "thinking" },
        { speaker: "노아",   text: "…물리적 조치 외에, 심리적 안정화 데이터가 부족합니다. 판단할 수 없습니다.", emotion: "sad" },
        { speaker: "나(독백)", text: "(노아는 친구의 마음을 어떻게 해줘야 할지 모르는구나. 이건… 내가 할 수 있는 일이야.)" }
      ],
      choices: [
        { text: "🤝 친구의 손을 잡아주고 다독여주기", type: "festival_ending", nextDay: "show_ending" }
      ]
    }
  ]
};

/* ──────────────────────────────────────────
   APP STATE
   ────────────────────────────────────────── */
const state = {
  playerName:        '',
  playerGender:      '남',
  friendDef:         '',
  friendReason:      '',
  selectedDesign:    'human', // human, animal, car
  selectedStickers:  [],
  signature:         '',
  discussionOpinion: '',
  creativeWriting:   '',
  reflect1:          '', // 챕터1 성찰
  reflect2:          '', // 챕터2 성찰
  reflect3:          '', // 챕터3 성찰
  earnedBadges:      [], // [1,2,3,4] 수집된 챕터 번호
  visitedDays:       [], // [{dayId, chapter, title}] 방문 기록
  lang:              'ko', // 'ko' | 'en' | 'zh' | 'ru'
};

let currentScreen = 'screen-intro';

/* ══════════════════════════════════════════
   MULTILINGUAL SUPPORT
══════════════════════════════════════════ */
const LANG_STRINGS = {
  ko: {
    tts_lang: 'ko-KR',
    menu_badge: '6학년 도덕 몰입형 체험',
    menu_t1: 'AI 전학생', menu_t3: '와 함께하는', menu_t4: '공존·상생 프로젝트',
    menu_sub: '인공지능 로봇과 올바른 관계 맺기 시뮬레이터',
    btn_start: '시작하기', btn_guide: '사용 가이드', btn_teacher: '📋 교사용 가이드',
    menu_achieve: '성취기준 [6도02-03] 기반',
    settings_title: '⚙ 설정',
    s_sfx: '🔊 효과음', s_bgm: '🎵 배경 음악', s_tts: '🗣️ 대사 읽어주기',
    s_font: '🔤 글자 크기', s_sm: '작게', s_md: '보통', s_lg: '크게',
    s_contrast: '👁️ 고대비(색약) 모드',
    s_teacher: '📋 교사용 가이드 보기', s_reset: '🗑️ 진행 기록 초기화',
    s_foot: '성취기준 [6도02-03] · 공존·상생 프로젝트 v2.0',
    i1_bubble: '안녕! <br />먼저 네 이름을 알려줄 수 있어?',
    i1_name: '나의 이름', i1_ph: '이름을 입력하세요', i1_hint: '최대 10자',
    i1_gender: '나의 성별', g_m: '남성 ♂', g_f: '여성 ♀', btn_next: '다음으로 →',
    i2_bubble: '잘 부탁해! 그런데 하나만 더 물어볼게.',
    i2_p1: '나에게 ', i2_friend: '친구', i2_p1b: '란',
    i2_p2: '이다. 왜냐하면',
    i2_ph_def: '어떤 존재', i2_ph_why: '그 이유', i2_suffix: ' 때문이다.',
    i2_spoiler: '※ 이 대답은 나중에 중요한 순간에 다시 등장합니다.',
    btn_back: '← 이전', btn_adv: '모험 시작! →',
    hib_badge: '뱃지', hib_history: 'HISTORY',
    bp_title: '🏅 챕터 뱃지', hp_title: '📜 진행 과정',
    b1: '공존의 시작', b2: '균열의 기억', b3: '회복의 여정', b4: '상생의 완성',
    hist_empty: '아직 기록이 없습니다.',
    rel_title: '🔗 지금, 나와 노아의 관계는?',
    rel_aff: '❤️ 친밀도', rel_res: '💚 존중·도덕', rel_close: '확인',
  },
  en: {
    tts_lang: 'ko-KR',
    menu_badge: 'Grade 6 Ethics Immersive Experience',
    menu_t1: 'AI Transfer Student', menu_t3: 'Journey With', menu_t4: 'Coexistence Project',
    menu_sub: 'Simulator for Building Right Relationships with AI Robots',
    btn_start: 'Start', btn_guide: 'User Guide', btn_teacher: '📋 Teacher\'s Guide',
    menu_achieve: 'Based on Standard [6Do02-03]',
    settings_title: '⚙ Settings',
    s_sfx: '🔊 Sound Effects', s_bgm: '🎵 Background Music', s_tts: '🗣️ Read Lines Aloud',
    s_font: '🔤 Font Size', s_sm: 'Small', s_md: 'Medium', s_lg: 'Large',
    s_contrast: '👁️ High Contrast Mode',
    s_teacher: '📋 View Teacher\'s Guide', s_reset: '🗑️ Reset Progress',
    s_foot: '[6Do02-03] · Coexistence Project v2.0',
    i1_bubble: 'Hi! <br />Can you tell me your name first?',
    i1_name: 'My Name', i1_ph: 'Enter your name', i1_hint: 'Max 10 chars',
    i1_gender: 'My Gender', g_m: 'Male ♂', g_f: 'Female ♀', btn_next: 'Next →',
    i2_bubble: 'Nice to meet you! One more question.',
    i2_p1: 'To me, a ', i2_friend: 'friend', i2_p1b: ' is',
    i2_p2: 'Because',
    i2_ph_def: 'someone who...', i2_ph_why: 'the reason', i2_suffix: '.',
    i2_spoiler: '※ This answer will appear again at an important moment.',
    btn_back: '← Back', btn_adv: 'Start Adventure! →',
    hib_badge: 'Badge', hib_history: 'HISTORY',
    bp_title: '🏅 Chapter Badges', hp_title: '📜 History',
    b1: 'Beginning of Coexistence', b2: 'Memory of Fracture',
    b3: 'Journey of Recovery', b4: 'Mutual Flourishing',
    hist_empty: 'No records yet.',
    rel_title: '🔗 My Relationship with Noah',
    rel_aff: '❤️ Affinity', rel_res: '💚 Respect & Ethics', rel_close: 'OK',
  },
  zh: {
    tts_lang: 'ko-KR',
    menu_badge: '六年级道德沉浸式体验',
    menu_t1: 'AI转学生', menu_t3: '的共同', menu_t4: '共存·共生项目',
    menu_sub: '与AI机器人建立正确关系的模拟器',
    btn_start: '开始', btn_guide: '使用指南', btn_teacher: '📋 教师指南',
    menu_achieve: '基于成就标准 [6도02-03]',
    settings_title: '⚙ 设置',
    s_sfx: '🔊 音效', s_bgm: '🎵 背景音乐', s_tts: '🗣️ 朗读台词',
    s_font: '🔤 字体大小', s_sm: '小', s_md: '中', s_lg: '大',
    s_contrast: '👁️ 高对比度模式',
    s_teacher: '📋 查看教师指南', s_reset: '🗑️ 重置进度',
    s_foot: '[6도02-03] · 共存·共生项目 v2.0',
    i1_bubble: '你好！<br />能先告诉我你的名字吗？',
    i1_name: '我的名字', i1_ph: '请输入姓名', i1_hint: '最多10个字',
    i1_gender: '我的性别', g_m: '男 ♂', g_f: '女 ♀', btn_next: '下一步 →',
    i2_bubble: '请多关照！我还想再问一个问题。',
    i2_p1: '对我来说，', i2_friend: '朋友', i2_p1b: '是',
    i2_p2: '因为',
    i2_ph_def: '某种存在', i2_ph_why: '原因', i2_suffix: '。',
    i2_spoiler: '※ 这个答案将在重要时刻再次出现。',
    btn_back: '← 返回', btn_adv: '开始冒险！→',
    hib_badge: '徽章', hib_history: '历史',
    bp_title: '🏅 章节徽章', hp_title: '📜 历史记录',
    b1: '共存的开始', b2: '裂痕的记忆', b3: '恢复的旅程', b4: '共生的完成',
    hist_empty: '暂无记录。',
    rel_title: '🔗 我与诺亚的关系',
    rel_aff: '❤️ 亲密度', rel_res: '💚 尊重·道德', rel_close: '确认',
  },
  ru: {
    tts_lang: 'ko-KR',
    menu_badge: 'Погружение в этику — 6 класс',
    menu_t1: 'ИИ-новичок', menu_t3: 'Путешествие с', menu_t4: 'Проект Сосуществования',
    menu_sub: 'Симулятор правильных отношений с роботом ИИ',
    btn_start: 'Начать', btn_guide: 'Руководство', btn_teacher: '📋 Для учителя',
    menu_achieve: 'На основе стандарта [6Do02-03]',
    settings_title: '⚙ Настройки',
    s_sfx: '🔊 Звуки', s_bgm: '🎵 Музыка', s_tts: '🗣️ Читать вслух',
    s_font: '🔤 Размер шрифта', s_sm: 'Мал.', s_md: 'Сред.', s_lg: 'Бол.',
    s_contrast: '👁️ Высокий контраст',
    s_teacher: '📋 Руководство учителя', s_reset: '🗑️ Сбросить прогресс',
    s_foot: '[6Do02-03] · Проект Сосуществования v2.0',
    i1_bubble: 'Привет! <br />Как тебя зовут?',
    i1_name: 'Моё имя', i1_ph: 'Введите имя', i1_hint: 'Макс. 10 зн.',
    i1_gender: 'Мой пол', g_m: 'Муж. ♂', g_f: 'Жен. ♀', btn_next: 'Далее →',
    i2_bubble: 'Приятно познакомиться! Ещё один вопрос.',
    i2_p1: 'Для меня ', i2_friend: 'друг', i2_p1b: ' — это',
    i2_p2: 'Потому что',
    i2_ph_def: 'тот, кто...', i2_ph_why: 'причина', i2_suffix: '.',
    i2_spoiler: '※ Этот ответ появится снова в важный момент.',
    btn_back: '← Назад', btn_adv: 'Начать приключение! →',
    hib_badge: 'Значок', hib_history: 'ИСТОРИЯ',
    bp_title: '🏅 Значки глав', hp_title: '📜 История',
    b1: 'Начало Сосуществования', b2: 'Память о Разломе',
    b3: 'Путь Восстановления', b4: 'Взаимный Расцвет',
    hist_empty: 'Записей пока нет.',
    rel_title: '🔗 Мои отношения с Ноа',
    rel_aff: '❤️ Близость', rel_res: '💚 Уважение и мораль', rel_close: 'ОК',
  },
};

function applyLang(code) {
  const L = LANG_STRINGS[code] || LANG_STRINGS.ko;
  state.lang = code;

  const s  = (id, t)   => { const e = document.getElementById(id); if (e) e.textContent = t; };
  const q  = (sel, t)  => { const e = document.querySelector(sel); if (e) e.textContent = t; };
  const qh = (sel, h)  => { const e = document.querySelector(sel); if (e) e.innerHTML = h; };
  const ph = (id, t)   => { const e = document.getElementById(id); if (e) e.placeholder = t; };

  // Menu
  q('.logo-badge', L.menu_badge);
  q('.title-line1', L.menu_t1);
  q('.title-line3', L.menu_t3);
  q('.title-line4', L.menu_t4);
  q('.menu-subtitle', L.menu_sub);
  s('btn-start', L.btn_start);
  s('btn-guide', L.btn_guide);
  s('btn-teacher-menu', L.btn_teacher);
  q('.achievement-badge', L.menu_achieve);

  // Settings
  q('.settings-title', L.settings_title);
  s('lbl-sfx', L.s_sfx); s('lbl-bgm', L.s_bgm); s('lbl-tts', L.s_tts);
  s('lbl-font', L.s_font); s('lbl-contrast', L.s_contrast);
  q('[data-fs="sm"]', L.s_sm); q('[data-fs="md"]', L.s_md); q('[data-fs="lg"]', L.s_lg);
  s('btn-open-teacher', L.s_teacher); s('btn-reset-progress', L.s_reset);
  q('.settings-foot', L.s_foot);

  // Input 1
  qh('#i1-bubble', L.i1_bubble);
  s('i1-name-lbl', L.i1_name); ph('input-name', L.i1_ph);
  s('i1-hint', L.i1_hint); s('i1-gender-lbl', L.i1_gender);
  s('btn-gender-m', L.g_m); s('btn-gender-f', L.g_f);
  s('btn-input1-next', L.btn_next);

  // Input 2
  s('input2-greeting', L.i2_bubble);
  qh('#i2-prompt1', L.i2_p1 + '<strong>' + L.i2_friend + '</strong>' + L.i2_p1b);
  q('#i2-prompt2', L.i2_p2);
  ph('input-friend-def', L.i2_ph_def); ph('input-friend-reason', L.i2_ph_why);
  q('#i2-suffix', L.i2_suffix);
  q('#i2-spoiler', L.i2_spoiler);
  s('btn-input2-back', L.btn_back); s('btn-input2-start', L.btn_adv);

  // HUD
  q('#hud-badge-btn .hib-label', L.hib_badge);
  q('#hud-history-btn .hib-label', L.hib_history);

  // Side panels
  qh('#badge-panel .side-panel-header span', L.bp_title);
  qh('#history-panel .side-panel-header span', L.hp_title);
  q('#badge-item-1 .badge-name', L.b1); q('#badge-item-2 .badge-name', L.b2);
  q('#badge-item-3 .badge-name', L.b3); q('#badge-item-4 .badge-name', L.b4);
  const hempty = document.querySelector('#history-list .history-empty');
  if (hempty) hempty.textContent = L.hist_empty;

  // Relation overlay
  q('.relation-title', L.rel_title);
  q('.relation-axis-row:nth-child(1) .relation-axis-lbl', L.rel_aff);
  q('.relation-axis-row:nth-child(2) .relation-axis-lbl', L.rel_res);
  s('btn-relation-ok', L.rel_close);

  // Lang selector sync + 저장
  document.querySelectorAll('#seg-lang button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === code);
  });
  localStorage.setItem('lang', code);
}

/* ──────────────────────────────────────────
   SCREEN ROUTER
   ────────────────────────────────────────── */
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
   INTRO VIDEO + MENU BGM
══════════════════════════════════════════ */
(function () {
  const video     = document.getElementById('intro-video');
  const clickOv   = document.getElementById('intro-click-start');
  const skipBtn   = document.getElementById('btn-intro-skip');
  const menuAudio = document.getElementById('menu-bgm-audio');
  let menuBgmCount = 0;

  /* 메뉴 BGM — 2회 재생 */
  function playMenuBgm() {
    if (!Settings.bgm) return;
    menuBgmCount = 0;
    menuAudio.volume = 0.55;
    menuAudio.currentTime = 0;
    menuAudio.play().catch(() => {});
    menuAudio.onended = () => {
      menuBgmCount++;
      if (menuBgmCount < 2) {
        menuAudio.currentTime = 0;
        menuAudio.play().catch(() => {});
      }
    };
  }

  function stopMenuBgm() {
    menuAudio.pause();
    menuAudio.currentTime = 0;
    menuAudio.onended = null;
  }

  /* 메뉴로 전환 */
  function goToMenu() {
    video.pause();
    showScreen('screen-menu');
    playMenuBgm();
  }

  /* 오버레이 항상 숨김 */
  clickOv.style.display = 'none';

  /* 즉시 자동재생 시도 — 차단 시 음소거 후 재시도 */
  video.play().catch(() => {
    video.muted = true;
    video.play().catch(() => { goToMenu(); });
  });

  /* 영상 종료 → 메뉴 */
  video.addEventListener('ended', goToMenu);

  /* SKIP 버튼 — 5초 후 페이드인 등장 */
  skipBtn.style.opacity = '0';
  skipBtn.style.pointerEvents = 'none';

  const skipTimer = setTimeout(() => {
    skipBtn.style.opacity = '';
    skipBtn.style.pointerEvents = '';
    skipBtn.classList.add('skip-ready');
  }, 5000);

  skipBtn.addEventListener('click', () => {
    clearTimeout(skipTimer);
    Sound.click();
    goToMenu();
  });

  /* 게임 시작 시 BGM 정지 */
  document.getElementById('btn-start').addEventListener('click', stopMenuBgm, { capture: true });
})();

/* ── MAIN MENU ── */
document.getElementById('btn-start').addEventListener('click', () => {
  Sound.click();
  startGame();
});
document.getElementById('btn-guide').addEventListener('click', () => {
  Sound.click();
  showScreen('screen-guide');
});
document.getElementById('btn-guide-close').addEventListener('click', () => {
  Sound.click();
  showScreen('screen-menu');
});

/* ── Gender Selection ── */
const btnGenderM = document.getElementById('btn-gender-m');
const btnGenderF = document.getElementById('btn-gender-f');

btnGenderM.addEventListener('click', () => {
  Sound.click();
  btnGenderM.classList.add('active');
  btnGenderF.classList.remove('active');
  state.playerGender = '남';
});
btnGenderF.addEventListener('click', () => {
  Sound.click();
  btnGenderF.classList.add('active');
  btnGenderM.classList.remove('active');
  state.playerGender = '여';
});

/* ── Name input (In-game profile setup overlay) ── */
const inputName = document.getElementById('input-name');
const btnInput1Next = document.getElementById('btn-input1-next');

inputName.addEventListener('input', () => {
  btnInput1Next.disabled = inputName.value.trim().length === 0;
});
inputName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !btnInput1Next.disabled) btnInput1Next.click();
});

/* ── Friend Definition ── */
const inputFriendDef = document.getElementById('input-friend-def');
const inputFriendReason = document.getElementById('input-friend-reason');
const btnInput2Start = document.getElementById('btn-input2-start');
const btnInput2Back = document.getElementById('btn-input2-back');

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

btnInput2Back.addEventListener('click', () => {
  Sound.click();
  // Simply hide screen-input2 and stay in screen-game
  document.getElementById('screen-input2').classList.remove('active');
});


/* ──────────────────────────────────────────
   GAME ENGINE
   ────────────────────────────────────────── */
const G = {
  dayId:           1,
  dialogueIdx:     0,
  affinity:        50,
  effGauge:        0,
  moralGauge:      0,
  respect:         50,   // 존중·도덕 지수 (엔딩 분기의 핵심 축)
  mistakes:        0,    // 비도덕적 선택을 시도한 횟수
  chapter:         1,
  typingTimer:     null,
  advClickHandler: null,
  stageLoading:    false,
  moralRevealed:   false // 챕터2 도덕성 게이지 공개 여부
};


function getDayObj(dayId) {
  return scenarioData.days.find(d => d.dayId === dayId);
}

function interpolate(text) {
  return text
    .replace(/\$\{playerName\}/g,   state.playerName   || '학생')
    .replace(/\$\{friendDef\}/g,    state.friendDef    || '____')
    .replace(/\$\{friendReason\}/g, state.friendReason || '____');
}

function applyGaugeEffect(effect, chapter) {
  if (!effect || effect === 'GAME_OVER') return;
  const isSet = effect.startsWith('=');
  const val = parseInt(effect.replace(/[^0-9]/g, ''), 10);
  if (isNaN(val)) return;

  if (chapter === 1) {
    G.effGauge = isSet ? val : Math.min(100, G.effGauge + val);
  } else {
    G.moralGauge = isSet ? val : Math.min(100, G.moralGauge + val);
  }
}

/* 선택 유형에 따른 '존중·도덕 지수' 반영 */
function applyRespect(type) {
  const delta = {
    affinity:     5,   // 따뜻한 공감 선택
    ethical:      10,  // 도덕 우선 선택
    ethical_loop: 6,   // 회복 단계의 올바른 선택
    curiosity:    2,   // 노아를 알아가려는 태도
    efficiency:  -4,   // 효율 우선 (도구적 태도)
    efficient:   -6,   // 강한 도구화 선택
    neutral:      0
  };
  const d = (delta[type] != null) ? delta[type] : 0;
  G.respect = Math.max(0, Math.min(100, G.respect + d));
}

function updateHUD() {
  document.getElementById('hud-day-num').textContent = `Day ${Math.floor(G.dayId)}`;
  updateRelationSidebar();
}

/* ══════════════════════════════════════════
   BADGE SYSTEM
══════════════════════════════════════════ */
// 챕터 완료 기준: 해당 챕터보다 높은 챕터에 진입 시 이전 챕터 뱃지 획득
// Ch4 뱃지는 엔딩(dayId 30.5) 도달 시 획득
function checkBadgeUnlock(chapter, dayId) {
  // 챕터 전환 뱃지 (이전 챕터 완료 시)
  const prevCh = chapter - 1;
  if (prevCh >= 1 && !state.earnedBadges.includes(prevCh)) {
    earnBadge(prevCh);
  }
  // Chapter 4 뱃지: Day 30.5(엔딩) 도달 시
  if (dayId === 30.5 && !state.earnedBadges.includes(4)) {
    earnBadge(4);
  }
}

function earnBadge(chNum) {
  if (state.earnedBadges.includes(chNum)) return;
  state.earnedBadges.push(chNum);
  renderBadgePanel();
  // 뱃지 획득 토스트 알림
  showBadgeToast(chNum);
}

function renderBadgePanel() {
  for (let i = 1; i <= 4; i++) {
    const item = document.getElementById(`badge-item-${i}`);
    if (!item) continue;
    if (state.earnedBadges.includes(i)) {
      item.classList.remove('locked');
      item.classList.add('unlocked');
    }
  }
}

function showBadgeToast(chNum) {
  const toast = document.createElement('div');
  toast.className = 'badge-toast';
  toast.innerHTML = `🏅 CHAPTER ${chNum} 뱃지 획득!`;
  document.getElementById('screen-game').appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 2800);
}

/* ══════════════════════════════════════════
   HISTORY SYSTEM
══════════════════════════════════════════ */
const MAIN_DAY_IDS = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18,
  19, 20, 21, 22, 23, 24, 25, 26,
  27, 28, 29, 30, 30.5
]);

function addToHistory(dayObj) {
  // 서브데이(1.2, 1.7 등) 제외, 중복 방지
  if (!MAIN_DAY_IDS.has(dayObj.dayId)) return;
  if (state.visitedDays.some(d => d.dayId === dayObj.dayId)) return;
  state.visitedDays.push({
    dayId: dayObj.dayId,
    chapter: dayObj.chapter,
    title: dayObj.title || `Day ${dayObj.dayId}`,
  });
  renderHistoryPanel();
}

function renderHistoryPanel() {
  const list = document.getElementById('history-list');
  if (!list) return;
  if (state.visitedDays.length === 0) {
    list.innerHTML = '<p class="history-empty">아직 기록이 없습니다.</p>';
    return;
  }
  // 챕터별로 그루핑하여 표시
  const byChapter = {};
  [...state.visitedDays]
    .sort((a, b) => a.dayId - b.dayId)
    .forEach(d => {
      if (!byChapter[d.chapter]) byChapter[d.chapter] = [];
      byChapter[d.chapter].push(d);
    });

  let html = '';
  for (const ch of Object.keys(byChapter).sort((a,b) => +a - +b)) {
    html += `<div class="history-ch-divider">CHAPTER ${ch}</div>`;
    for (const d of byChapter[ch]) {
      const label = d.title.replace(/^Day[\s\d.]+:\s*/, '');
      const dayLabel = d.dayId === 30.5 ? 'Day 30 (후기)' : `Day ${d.dayId}`;
      html += `<button class="history-day-btn" data-dayid="${d.dayId}">
        <span class="hist-day-num">${dayLabel}</span>
        <span class="hist-day-title">${label}</span>
      </button>`;
    }
  }
  list.innerHTML = html;

  // 클릭 → 해당 Day로 이동
  list.querySelectorAll('.history-day-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const did = parseFloat(btn.dataset.dayid);
      closeAllPanels();
      loadDay(did);
    });
  });
}

function closeAllPanels() {
  document.getElementById('badge-panel').classList.add('hidden');
  document.getElementById('history-panel').classList.add('hidden');
}

/* ──────────────────────────────────────────
   관계 진단 — 친밀도 × 존중·도덕 2축 모델
   ────────────────────────────────────────── */
function computeRelation() {
  const a = G.affinity, r = G.respect;
  if (a >= 70 && r >= 70)  return { emoji: '🤝', name: '영혼의 동반자', desc: '친밀함과 도덕적 존중이 모두 깊은, 진정한 공존 관계예요.' };
  if (r >= 70)             return { emoji: '💚', name: '신뢰하는 동료', desc: '서로 존중하며 함께 성장하는 든든한 동료 관계예요.' };
  if (a >= 70 && r < 55)   return { emoji: '⚠️', name: '편애하는 관계', desc: '노아를 좋아하지만, 편한 도구처럼 함부로 대할 위험이 있어요.' };
  if (a >= 50 && r >= 50)  return { emoji: '🤖', name: '협력하는 사이', desc: '함께 협력하고 있지만, 관계는 더 깊어질 수 있어요.' };
  if (a < 40 && r < 40)    return { emoji: '🧊', name: '어색한 사이', desc: '아직 마음도 신뢰도 충분히 쌓이지 않았어요.' };
  return { emoji: '🛠️', name: '도구적 관계', desc: '노아를 주로 편리한 도구로만 대하고 있어요.' };
}

function updateRelationLabel() {
  const chip = document.getElementById('hud-relation');
  if (!chip) return;
  const rel = computeRelation();
  chip.textContent = `${rel.emoji} ${rel.name}`;
}

/* ── 관계 사이드바 상시 업데이트 ── */
function updateRelationSidebar() {
  const rel = computeRelation();
  const el = (id) => document.getElementById(id);

  el('rsb-emoji').textContent = rel.emoji;
  el('rsb-name').textContent  = rel.name;
  el('rsb-desc').textContent  = rel.desc;

  el('rsb-fill-aff').style.width   = G.affinity + '%';
  el('rsb-val-aff').textContent    = G.affinity + '%';

  el('rsb-fill-eff').style.width   = G.effGauge + '%';
  el('rsb-val-eff').textContent    = G.effGauge + '%';

  if (G.moralRevealed) {
    el('rsb-fill-moral').style.width = G.moralGauge + '%';
    el('rsb-val-moral').textContent  = G.moralGauge + '%';
  }
}

/* ── 챕터2 도덕성 게이지 극적 등장 ── */
function revealMoralGauge(onDone) {
  if (G.moralRevealed) { if (onDone) onDone(); return; }
  G.moralRevealed = true;

  // 알림 배너 생성
  const banner = document.createElement('div');
  banner.id = 'moral-reveal-banner';
  banner.innerHTML = `⚠️ <b>노아의 숨겨진 기록</b><br>처음부터 당신의 도덕성을<br>조용히 기록하고 있었습니다...`;
  document.getElementById('screen-game').appendChild(banner);

  // 사이드바 글리치 후 도덕성 행 슬라이드인
  const row = document.getElementById('rsb-moral-row');
  Sound.glitch();

  setTimeout(() => {
    row.classList.add('rsb-glitching');
    banner.classList.add('visible');
  }, 200);

  setTimeout(() => {
    row.classList.remove('rsb-moral-hidden');
    row.classList.add('rsb-moral-reveal');
    row.classList.remove('rsb-glitching');
    updateRelationSidebar();
  }, 900);

  setTimeout(() => {
    banner.classList.remove('visible');
  }, 3200);

  setTimeout(() => {
    banner.remove();
    if (onDone) onDone();
  }, 3700);
}

/* ══════════════════════════════════════════
   VER 3.0 — 수치 변화 팝업 (데미지 팝업)
══════════════════════════════════════════ */
function showStatPopup(changes) {
  const gameEl = document.getElementById('screen-game');
  const ICONS = { affinity: '❤️', efficiency: '⚡', moral: '💚', respect: '⚖️' };
  const visible = changes.filter(c => c.delta !== 0);
  if (visible.length === 0) return;

  visible.forEach((c, i) => {
    const el = document.createElement('div');
    el.className = `stat-popup-item ${c.delta > 0 ? 'pop-up' : 'pop-down'}`;
    el.textContent = `${ICONS[c.stat] || '📊'} ${c.delta > 0 ? '+' : ''}${c.delta}`;
    // 가로 분산 배치
    const spread = visible.length === 1 ? 0 : (i - (visible.length - 1) / 2) * 14;
    el.style.left = `calc(50% + ${spread}%)`;
    el.style.bottom = '230px';
    gameEl.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  });
}

/* ══════════════════════════════════════════
   VER 3.0 — 시네마 모드
══════════════════════════════════════════ */
function setCinemaMode(active) {
  document.getElementById('screen-game').classList.toggle('cinema-mode', active);
}

/* ══════════════════════════════════════════
   VER 3.0 — 챕터 성찰 입력
══════════════════════════════════════════ */
const CHAPTER_REFLECTS = {
  1: { question: "노아와의 챕터 1을 마쳤어요. 노아를 처음 만났을 때 어떤 점이 가장 인상 깊었나요?", key: 'reflect1' },
  2: { question: "챕터 2에서 노아를 도구처럼 대했던 순간을 떠올려 봐요. 그때 어떤 기분이었나요?", key: 'reflect2' },
  3: { question: "도덕적 선택을 반복하면서 노아와의 관계가 어떻게 달라졌나요?", key: 'reflect3' },
};

function showChapterReflect(chapter, onDone) {
  const cfg = CHAPTER_REFLECTS[chapter];
  if (!cfg) { if (onDone) onDone(); return; }

  const ov = document.createElement('div');
  ov.className = 'game-overlay';
  ov.id = 'ov-chapter-reflect';

  ov.innerHTML = `
    <div class="reflect-input-overlay">
      <div class="reflect-chapter-badge">CHAPTER ${chapter} 성찰</div>
      <p class="reflect-question">${cfg.question}</p>
      <textarea class="reflect-textarea" id="reflect-ta" placeholder="솔직하게 생각을 적어보세요..." maxlength="200"></textarea>
      <div style="text-align:right;font-size:11px;color:var(--c-muted);margin-bottom:14px"><span id="reflect-len">0</span>/200자</div>
      <button class="btn-primary" id="btn-reflect-done" style="width:100%" disabled>다음 챕터로 →</button>
    </div>
  `;

  document.getElementById('ui-root').appendChild(ov);
  const ta = document.getElementById('reflect-ta');
  const btn = document.getElementById('btn-reflect-done');
  const len = document.getElementById('reflect-len');

  ta.addEventListener('input', () => {
    len.textContent = ta.value.length;
    btn.disabled = ta.value.trim().length === 0;
  });
  btn.addEventListener('click', () => {
    Sound.click();
    state[cfg.key] = ta.value.trim();
    ov.remove();
    if (onDone) onDone();
  });
  setTimeout(() => ta.focus(), 100);
}

/* ══════════════════════════════════════════
   VER 3.0 — 시크릿 코드 게이트 (챕터 3)
══════════════════════════════════════════ */
function showSecretCodeGate(onSuccess) {
  const ov = document.createElement('div');
  ov.className = 'game-overlay';
  ov.id = 'ov-secret-code';
  ov.innerHTML = `
    <div class="modal-card" style="text-align:center;max-width:380px">
      <div style="font-size:48px;margin-bottom:8px">🔒</div>
      <h3 style="color:var(--c-accent);font-size:20px;font-weight:800;margin:0 0 8px">CHAPTER 3 잠금</h3>
      <p style="color:#aaa;font-size:13px;line-height:1.6;margin:0 0 24px">
        챕터 1~2 활동지를 선생님께 제출하고,<br>
        <b style="color:#fff">시크릿 코드</b>를 받아오세요.<br>
        <span style="color:#7c6df0;font-size:11px">힌트: 친구 사이를 숫자로?</span>
      </p>
      <input class="secret-code-input" id="secret-code-input" type="tel" maxlength="4" placeholder="• • • •" autocomplete="off" />
      <p id="secret-code-error" style="color:#f05e5e;font-size:12px;min-height:18px;margin:4px 0 16px;display:none">
        ⚠️ 코드가 틀렸습니다. 선생님께 다시 확인하세요!
      </p>
      <button id="btn-secret-submit" class="btn-primary" style="width:100%">코드 확인 →</button>
    </div>
  `;
  document.getElementById('ui-root').appendChild(ov);

  const input = document.getElementById('secret-code-input');
  const errMsg = document.getElementById('secret-code-error');

  function tryCode() {
    if (input.value.trim() === '7942') {
      Sound.transform();
      ov.remove();
      onSuccess();
    } else {
      Sound.glitch();
      errMsg.style.display = 'block';
      input.value = '';
      input.style.borderColor = '#f05e5e';
      setTimeout(() => {
        input.style.borderColor = '';
        errMsg.style.display = 'none';
      }, 2200);
    }
  }

  document.getElementById('btn-secret-submit').addEventListener('click', tryCode);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') tryCode(); });
  setTimeout(() => input.focus(), 100);
}

/* ══════════════════════════════════════════
   VER 3.0 — 레이더(거미줄) 차트
══════════════════════════════════════════ */
function drawRadarChart(canvas) {
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const R = Math.min(cx, cy) - 36;
  const axes = [
    { label: '친밀도', value: G.affinity, color: '#ff7597' },
    { label: '효율성', value: G.effGauge,  color: '#7c6df0' },
    { label: '도덕성', value: Math.max(G.moralGauge, G.effGauge * 0.3), color: '#5ef0a0' },
    { label: '존 중',  value: G.respect,   color: '#f0d07c' },
  ];
  const n = axes.length;
  const step = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 격자 원들
  for (let ring = 1; ring <= 5; ring++) {
    const rr = (R / 5) * ring;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + i * step;
      const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = ring === 5 ? 'rgba(124,109,240,0.35)' : 'rgba(124,109,240,0.12)';
    ctx.lineWidth = ring === 5 ? 1.5 : 1;
    ctx.stroke();
  }

  // 축 선
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * step;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
    ctx.strokeStyle = 'rgba(124,109,240,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 데이터 폴리곤
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * step;
    const v = axes[i].value / 100;
    const x = cx + R * v * Math.cos(a), y = cy + R * v * Math.sin(a);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(94,240,160,0.18)';
  ctx.fill();
  ctx.strokeStyle = '#5ef0a0';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 꼭짓점 점
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * step;
    const v = axes[i].value / 100;
    const x = cx + R * v * Math.cos(a), y = cy + R * v * Math.sin(a);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = axes[i].color;
    ctx.fill();
  }

  // 레이블
  ctx.font = 'bold 13px sans-serif';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * step;
    const lx = cx + (R + 28) * Math.cos(a);
    const ly = cy + (R + 28) * Math.sin(a);
    ctx.fillStyle = axes[i].color;
    ctx.textAlign = 'center';
    ctx.fillText(`${axes[i].label}`, lx, ly - 7);
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.fillText(`${axes[i].value}%`, lx, ly + 8);
    ctx.font = 'bold 13px sans-serif';
  }
}

function showRadarChart(chapter, onDone) {
  const ov = document.createElement('div');
  ov.className = 'game-overlay';
  ov.id = 'ov-radar-chart';
  ov.innerHTML = `
    <div class="ending-card" style="max-width:380px;text-align:center">
      <div class="ending-ribbon">📊 챕터 ${chapter} 분석 리포트</div>
      <p style="color:var(--c-muted);font-size:13px;margin:10px 0 4px">이 챕터에서 나는 어떤 사람이었나요?</p>
      <canvas id="radar-chart-canvas" width="280" height="280"></canvas>
      <button class="btn-primary" id="btn-radar-done" style="width:100%;margin-top:20px">확인하고 계속 →</button>
    </div>
  `;
  document.getElementById('ui-root').appendChild(ov);
  setTimeout(() => drawRadarChart(document.getElementById('radar-chart-canvas')), 50);
  document.getElementById('btn-radar-done').addEventListener('click', () => {
    Sound.click();
    ov.remove();
    if (onDone) onDone();
  });
}

/* ══════════════════════════════════════════
   VER 3.0 — 분기형 엔딩
══════════════════════════════════════════ */
function runHappyEnding() {
  const lines = [
    '“우리가 함께 연습했잖아.”',
    '“넌 할 수 있어!”',
    '친구는 미소를 되찾고 무대로 향했다.',
    '노아가 완벽한 타이밍에 핀조명을 비춘다.',
    "“나의 데이터베이스에는 '온기'와 '공감'이 없습니다.\n타인의 아픔에 공감하고 마음을 나누는 것…\n그것은 인간인 당신들만이 가진\n가장 위대한 고유 알고리즘입니다.”",
    '기술과 인간이 각자의 자리에서 빛을 발할 때,\n진정한 공존과 상생의 미래가 열립니다.',
  ];
  setCinemaMode(true);
  Sound.endingFanfare();
  let idx = 0;
  function next() {
    if (idx >= lines.length) { showEndingReport('happy'); return; }
    showCinematic(lines[idx], () => { idx++; next(); });
  }
  next();
}

function runNeutralEnding() {
  const lines = [
    '친구의 손을 잡아주려 했다.',
    '노아가 잠시 멈췄다...',
    '"...고마워. 하지만 나는 아직\n당신의 마음을 완전히 이해하지 못했어."',
    '노아와의 관계는 아직 성장 중이다.',
    '도덕적 존중이 쌓일수록, 진정한 공존에 가까워진다.',
  ];
  setCinemaMode(true);
  Sound.playBgm('hope');
  let idx = 0;
  function next() {
    if (idx >= lines.length) { showEndingReport('neutral'); return; }
    showCinematic(lines[idx], () => { idx++; next(); });
  }
  next();
}

function runBadEnding() {
  const lines = [
    '친구의 손을 잡으려 했지만...',
    '노아가 차갑게 한 발 물러섰다.',
    '"데이터 분석 결과:\n당신의 도덕적 존중 지수가 너무 낮습니다."',
    '"저는 당신의 \'도구\'였습니다. 친구가 아니라."',
    '무대 위 조명은 꺼졌다.',
    '[ 노아와의 관계를 처음부터 다시 생각해볼 필요가 있습니다. ]',
  ];
  setCinemaMode(true);
  Sound.playBgm('tense');
  let idx = 0;
  function next() {
    if (idx >= lines.length) { showEndingReport('bad'); return; }
    showCinematic(lines[idx], () => { idx++; next(); });
  }
  next();
}

let relationOnClose = null;
function openRelationOverlay(onClose) {
  relationOnClose = onClose || null;
  const rel = computeRelation();
  document.getElementById('relation-bar-aff').style.width = G.affinity + '%';
  document.getElementById('relation-bar-res').style.width = G.respect + '%';
  document.getElementById('relation-val-aff').textContent = G.affinity + '%';
  document.getElementById('relation-val-res').textContent = G.respect + '%';
  document.getElementById('relation-type-emoji').textContent = rel.emoji;
  document.getElementById('relation-type-name').textContent = rel.name;
  document.getElementById('relation-type-desc').textContent = rel.desc;
  document.getElementById('ov-relation').classList.remove('hidden');
}
function closeRelationOverlay() {
  document.getElementById('ov-relation').classList.add('hidden');
  const fn = relationOnClose;
  relationOnClose = null;
  if (fn) fn();
}

function setBackground(bgKey) {
  const ch2f = document.getElementById('ch2-filter');
  const isCh2 = G.chapter === 2;

  if (isCh2) {
    ch2f.classList.add('active');
    ch2f.style.background = 'rgba(180, 20, 20, 0.2)';
  } else {
    ch2f.classList.remove('active');
    ch2f.style.background = '';
  }

  // 배경 파일명 매핑 — assets/image/ 폴더 기준, 모두 .png
  const bgFileMap = {
    bg_my_room:    'house.png',
    bg_classroom:  'bg_classroom.png',
    bg_corridor:   'bg_corridor.png',
    bg_playground: 'bg_playground.png',
    bg_cafeteria:  'bg_cafeteria.png',
    bg_stage:      'bg_stage.png',
  };

  const bgSettings = {
    bg_my_room:    { pos: 'center 40%',  size: 'cover' },
    bg_classroom:  { pos: 'center 30%',  size: 'cover' },
    bg_corridor:   { pos: 'center 45%',  size: 'cover' },
    bg_playground: { pos: 'center 20%',  size: 'cover' },
    bg_cafeteria:  { pos: 'center 40%',  size: 'cover' },
    bg_stage:      { pos: 'center 50%',  size: 'cover' },
  };

  const bgImg = document.getElementById('game-bg-illustration');
  if (bgKey === 'black') {
    bgImg.style.backgroundImage = 'none';
    bgImg.style.backgroundColor = '#000000';
    bgImg.style.backgroundPosition = 'center';
    bgImg.style.backgroundSize = 'cover';
  } else if (bgKey) {
    const cfg = bgSettings[bgKey] || { pos: 'center', size: 'cover' };
    const fileName = bgFileMap[bgKey] || `${bgKey}.png`;
    bgImg.style.backgroundImage = `url('assets/image/${fileName}')`;
    bgImg.style.backgroundPosition = cfg.pos;
    bgImg.style.backgroundSize = cfg.size;
    bgImg.style.backgroundColor = '';
  }

  // Update sky color in A-Frame
  const sky = document.getElementById('scene-sky');
  if (sky) {
    const skyColors = {
      bg_my_room:   '#87c5f0',
      bg_classroom: '#c8dff5',
      bg_corridor:  '#e8d8b0',
      bg_playground:'#b8d8f8',
      bg_cafeteria: '#d8c8a0',
      bg_stage:     '#110a26',
      black:        '#000000'
    };
    sky.setAttribute('color', skyColors[bgKey] || '#0a0a1a');
  }
}

/* ══ Noah Sprite State System ══════════════════════════════════════
   human  : 단일 스프라이트 시트(5×2) → background-position으로 셀 선택
   animal : noah_animals/split_{row}_{col}.png 개별 파일
   car    : noah_cars/split_{row}_{col}.png    개별 파일
═══════════════════════════════════════════════════════════════════ */
const Noah = (() => {
  const ALL_STATES = [
    'state-idle','state-error','state-think','state-idea',
    'state-sad','state-greet','state-sleep',
  ];

  const ALIAS = {
    neutral:  'idle',   talking:  'idle',
    happy:    'idea',   thinking: 'think',
    surprised:'error',  sad:      'sad',
    crying:   'sad',    waving:   'greet',
    sleeping: 'sleep',
    idle:'idle', error:'error', think:'think',
    idea:'idea', greet:'greet', sleep:'sleep',
  };

  // human: 5×2 스프라이트 시트 background-position
  const HUMAN_POS = {
    idle:'0% 0%', idea:'25% 0%', think:'75% 0%',
    error:'0% 100%', sad:'25% 100%', greet:'75% 100%', sleep:'100% 100%',
  };

  // animal/car: 감정 → 개별 파일 경로
  const EMOTION_FILES = {
    animal: {
      idle:  'assets/image/noah_animals/split_0_0.png',
      error: 'assets/image/noah_animals/split_0_1.png',
      idea:  'assets/image/noah_animals/split_0_2.png',
      think: 'assets/image/noah_animals/split_0_3.png',
      greet: 'assets/image/noah_animals/split_1_3.png',
      sad:   'assets/image/noah_animals/split_1_1.png',
      sleep: 'assets/image/noah_animals/split_1_4.png',
    },
    car: {
      idle:  'assets/image/noah_cars/split_0_0.png',
      idea:  'assets/image/noah_cars/split_1_2.png',
      think: 'assets/image/noah_cars/split_0_3.png',
      error: 'assets/image/noah_cars/split_1_1.png',
      greet: 'assets/image/noah_cars/split_0_2.png',
      sad:   'assets/image/noah_cars/split_1_3.png',
      sleep: 'assets/image/noah_cars/split_1_4.png',
    },
  };

  let activeDesign = 'human';

  function setDesign(d) { activeDesign = d || 'human'; }

  function setEmotion(name) {
    const sprite = document.getElementById('game-character-sprite');
    if (!sprite) return;
    const emotionName = ALIAS[name] || 'idle';
    sprite.classList.remove(...ALL_STATES);

    if (EMOTION_FILES[activeDesign]) {
      // animal / car: 개별 파일 직접 로드
      const files = EMOTION_FILES[activeDesign];
      const file  = files[emotionName] || files.idle;
      sprite.style.backgroundImage    = `url('${file}')`;
      sprite.style.backgroundSize     = 'contain';
      sprite.style.backgroundPosition = 'center bottom';
    } else {
      // human: 스프라이트 시트 position 이동
      sprite.style.backgroundSize     = '500% 200%';
      sprite.style.backgroundPosition = HUMAN_POS[emotionName] || '0% 0%';
    }
  }

  return { setEmotion, setDesign };
})();

// Backward-compat: old call sites still work
function setNoahEmotion(emotion) { Noah.setEmotion(emotion); }

/* 디자인별 느낌표 위치 (스프라이트 셀 내 투명 여백이 다름) */
const EXCLAIM_BOTTOM = { human: '91%', animal: '87%', car: '69%' };

function updateExclaimBottom(design) {
  const exclaim = document.getElementById('noah-exclaim');
  if (exclaim) exclaim.style.bottom = EXCLAIM_BOTTOM[design] || '91%';
}

function setCharacter(charKey) {
  const container = document.getElementById('game-character-sprite-container');
  const sprite    = document.getElementById('game-character-sprite');

  if (!charKey) {
    container.classList.remove('visible');
    return;
  }

  const design = charKey === 'silhouette' ? 'human' : state.selectedDesign;

  const applySprite = () => {
    if (charKey === 'silhouette') {
      sprite.style.backgroundImage = "url('assets/image/noah_human.png')";
      sprite.style.backgroundSize  = '500% 200%';
      sprite.classList.add('silhouette');
    } else if (design === 'human') {
      sprite.style.backgroundImage = "url('assets/image/noah_human.png')";
      sprite.style.backgroundSize  = '500% 200%';
      sprite.classList.remove('silhouette');
    } else {
      // animal / car: 개별 파일 — setEmotion이 backgroundImage 담당
      sprite.style.backgroundImage = '';
      sprite.classList.remove('silhouette');
    }
    Noah.setDesign(design);
    Noah.setEmotion('idle');
    updateExclaimBottom(design);
    sprite.style.transition = 'opacity 0.25s ease';
    sprite.style.opacity = '1';
  };

  const wasVisible = container.classList.contains('visible');
  const prevImg    = sprite.style.backgroundImage;
  const nextImg    = (charKey === 'silhouette' || design === 'human')
    ? "url('assets/image/noah_human.png')"
    : `url('assets/image/noah_${design}_idle')`; // 개별파일 — 항상 전환 처리

  if (wasVisible && prevImg && prevImg !== nextImg) {
    sprite.style.transition = 'opacity 0.2s ease';
    sprite.style.opacity = '0';
    setTimeout(() => { applySprite(); container.classList.add('visible'); }, 210);
  } else {
    applySprite();
    container.classList.add('visible');
  }
}

/* ── 캐릭터 초상화 (선생님/채원/동혁) ── */
const PORTRAIT_MAP = {
  '선생님': 'assets/image/teacher.png',
  '채원':   'assets/image/chaewon.png',
  '동혁':   'assets/image/donghyuk.png',
};

function updatePortrait(speaker) {
  const wrap = document.getElementById('dlg-portrait-wrap');
  const img  = document.getElementById('dlg-portrait-img');
  if (!wrap || !img) return;
  const src = PORTRAIT_MAP[speaker];
  if (src) {
    img.src = src;
    wrap.classList.add('visible');
  } else {
    wrap.classList.remove('visible');
  }
}

function setSpeakerStyle(el, speaker, chapter) {
  el.textContent = speaker;
  el.className = '';
  if (speaker === '노아')          el.className = 'speaker-noa';
  else if (speaker.startsWith('나')) el.className = 'speaker-me';
  else if (chapter === 2)          el.className = 'speaker-system-red';
  else                             el.className = 'speaker-system';
}

/* ── Typewriter effect ── */
function typewrite(el, text, speed, onDone) {
  if (G.typingTimer) { clearInterval(G.typingTimer); G.typingTimer = null; }
  el.textContent = '';
  let i = 0;
  G.typingTimer = setInterval(() => {
    el.textContent += text[i];
    // Sound on every 2nd character to keep beep clean
    if (i % 2 === 0) Sound.type();
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
  const dayObj = getDayObj(G.dayId);
  const dlg = dayObj.dialogues[G.dialogueIdx];
  if (dlg) {
    document.getElementById('dlg-text-area').textContent = interpolate(dlg.text);
  }
  showAdvBtn();
  return true;
}

function showAdvBtn() {
  const btn       = document.getElementById('btn-dlg-adv');
  const exclaim   = document.getElementById('noah-exclaim');
  const container = document.getElementById('game-character-sprite-container');
  btn.disabled = false;
  document.getElementById('dlg-click-prompt').classList.add('visible');
  if (container && container.classList.contains('visible')) {
    exclaim.classList.add('visible');
    btn.style.opacity = '0';
  } else {
    exclaim.classList.remove('visible');
    btn.style.opacity = '1';
  }
}

function hideAdvBtn() {
  const btn     = document.getElementById('btn-dlg-adv');
  const exclaim = document.getElementById('noah-exclaim');
  btn.disabled = true;
  btn.style.opacity = '0';
  exclaim.classList.remove('visible');
  document.getElementById('dlg-click-prompt').classList.remove('visible');
}

/* ── Game Starter ── */
function startGame() {
  showScreen('screen-game');
  G.affinity = 50;
  G.effGauge = 15;
  G.moralGauge = 0;
  G.respect = 50;
  G.mistakes = 0;
  loadDay(1);
}

function loadDay(dayId) {
  if (window._cleanupCinema) { window._cleanupCinema(); }
  const dayObj = getDayObj(dayId);
  if (!dayObj) { console.error('Day not found:', dayId); return; }

  G.dayId = dayId;
  G.chapter = dayObj.chapter;
  G.dialogueIdx = 0;
  G.advClickHandler = null;

  setBackground(dayObj.background);
  setCharacter(dayObj.character);

  // 챕터 톤 필터
  const gameEl = document.getElementById('screen-game');
  gameEl.classList.remove('ch1-tone','ch2-tone','ch3-tone','ch4-tone','ch3-recovering');
  gameEl.classList.add(`ch${dayObj.chapter}-tone`);
  // Ch3 후반(Day 22+) 점점 색이 살아남
  if (dayObj.chapter === 3 && dayId >= 22) gameEl.classList.add('ch3-recovering');

  // 시네마 모드 — 감정 절정 장면
  const CINEMA_DAYS = new Set([18, 29, 30.5]);
  setCinemaMode(CINEMA_DAYS.has(dayId));

  // HUD
  const chBadge = document.getElementById('hud-ch');
  chBadge.textContent = `CHAPTER ${dayObj.chapter}`;
  chBadge.className = `hud-badge ch${dayObj.chapter}`;
  updateHUD();
  updateRelationLabel();

  // 분위기별 배경음 (1막 평온 → 2막 불안 → 3·4막 희망)
  const mood = dayObj.chapter === 2 ? 'tense' : (dayObj.chapter >= 3 ? 'hope' : 'calm');
  Sound.playBgm(mood);

  // 히스토리 기록 + 뱃지 해금
  addToHistory(dayObj);
  checkBadgeUnlock(dayObj.chapter, dayId);


  // Grid Scanner Animation Mode
  const scanner = document.getElementById('game-scan-overlay');
  if (dayObj.scanMode) {
    scanner.classList.remove('hidden');
    Sound.transform();
  } else {
    scanner.classList.add('hidden');
  }

  // Choices reset — dlg-wrap 안에서 dlg-box 복원
  document.getElementById('game-choice-wrap').style.display = 'none';
  document.getElementById('game-dlg-box').style.display = '';
  document.getElementById('btn-dlg-adv').style.display = '';
  // DAY 배지 업데이트
  const _title = dayObj.title || '';
  const _dayLabel = _title.replace(/^Day[\s\d.]+:\s*/, '');
  document.getElementById('hud-day-badge').textContent =
    `DAY ${dayId}${_dayLabel ? '  |  ' + _dayLabel : ''}`;

  // Day 17: Fake ending
  if (dayId === 17) {
    showFakeCert();
    return;
  }

  // Title flash display
  const flash = document.getElementById('stage-title-flash');
  const flashTxt = document.getElementById('stage-title-inner');
  flashTxt.textContent = dayObj.title;
  flash.classList.add('visible');
  G.stageLoading = true;
  hideAdvBtn();
  
  const RELATION_CHECKPOINTS = [11, 24];
  setTimeout(() => {
    flash.classList.remove('visible');
    G.stageLoading = false;
    if (dayId === 11) {
      // 챕터2 첫 진입: 도덕성 등장 → 관계 오버레이
      revealMoralGauge(() => openRelationOverlay(() => showNextDialogue()));
    } else if (RELATION_CHECKPOINTS.includes(dayId)) {
      openRelationOverlay(() => showNextDialogue());
    } else {
      showNextDialogue();
    }
  }, 1600);
}

/* ── Dialogue display loop ── */
function showNextDialogue() {
  const dayObj = getDayObj(G.dayId);
  const dialogues = dayObj.dialogues;

  if (G.dialogueIdx >= dialogues.length) {
    showChoices(dayObj);
    return;
  }

  const dlg = dialogues[G.dialogueIdx];
  const speakerEl = document.getElementById('dlg-speaker-tag');
  const textEl = document.getElementById('dlg-text-area');

  setSpeakerStyle(speakerEl, dlg.speaker, dayObj.chapter);
  updatePortrait(dlg.speaker);

  // 감정 프레임 자동 전환
  if (dlg.emotion) {
    setNoahEmotion(dlg.emotion);
  } else if (dlg.speaker === '노아') {
    setNoahEmotion('talking');
  } else {
    setNoahEmotion('neutral');
  }

  document.getElementById('game-dlg-box').style.display = '';
  document.getElementById('btn-dlg-adv').style.display = '';
  document.getElementById('game-choice-wrap').style.display = 'none';

  hideAdvBtn();
  const line = interpolate(dlg.text);
  Sound.speak(line);
  typewrite(textEl, line, 28, showAdvBtn);
}

/* ── 대화 진행 공통 함수 ── */
function advanceDialogue() {
  if (G.stageLoading) return;
  // 활성 오버레이가 있으면 무시 (오버레이 버튼 클릭 시 dlg-box 중복 발화 방지)
  if (document.querySelector('.game-overlay:not(.hidden)')) return;
  if (skipTyping()) return;

  // 선택지가 보이는 중이면 무시
  if (document.getElementById('game-choice-wrap').style.display !== 'none') return;
  // 대화창 박스가 숨겨진 중이면 무시
  if (document.getElementById('game-dlg-box').style.display === 'none') return;

  if (G.advClickHandler) {
    const fn = G.advClickHandler;
    G.advClickHandler = null;
    fn();
    return;
  }

  G.dialogueIdx++;
  showNextDialogue();
}

/* ── 다음 버튼 클릭 ── */
document.getElementById('btn-dlg-adv').addEventListener('click', advanceDialogue);

/* ── 느낌표 배지 클릭 ── */
document.getElementById('noah-exclaim').addEventListener('click', () => { Sound.click(); advanceDialogue(); });

/* ── 대화창 아무데나 클릭 ── */
document.getElementById('game-dlg-box').addEventListener('click', advanceDialogue);

/* ── 스페이스바 ── */
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.key === ' ') {
    // 텍스트 입력 중이면 무시
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    e.preventDefault();
    advanceDialogue();
  }
});

/* ── 🔒 개발자 모드 이스터에그 (CHAPTER 배지 3연타) ── */
(function () {
  let clickCount = 0;
  let clickTimer = null;

  document.getElementById('hud-ch').addEventListener('click', () => {
    clickCount++;
    clearTimeout(clickTimer);

    if (clickCount >= 3) {
      clickCount = 0;
      openDevJump();
      return;
    }

    clickTimer = setTimeout(() => { clickCount = 0; }, 700);
  });

  function openDevJump() {
    Sound.transform();

    // 기존 패널 중복 방지
    const existing = document.getElementById('ov-dev-jump');
    if (existing) { existing.remove(); return; }

    const panel = document.createElement('div');
    panel.className = 'game-overlay';
    panel.id = 'ov-dev-jump';
    panel.style.cssText = 'background:rgba(0,0,0,0.85);';
    panel.innerHTML = `
      <div style="
        background:linear-gradient(135deg,#0d0d1a,#1a0d2e);
        border:2px solid #7c6df0;
        border-radius:16px;
        padding:32px 28px;
        width:min(360px,90vw);
        box-shadow:0 0 40px rgba(124,109,240,0.5);
        text-align:center;
      ">
        <div style="font-size:28px;margin-bottom:8px">🛠️</div>
        <h3 style="color:#7c6df0;font-size:18px;font-weight:800;margin:0 0 4px;letter-spacing:2px">DEV MODE</h3>
        <p style="color:#888;font-size:11px;margin:0 0 20px;letter-spacing:1px">EASTER EGG UNLOCKED</p>
        <p style="color:#ccc;font-size:13px;margin:0 0 12px">이동할 Day ID를 입력하세요</p>
        <p style="color:#555;font-size:11px;margin:0 0 16px">예: 1, 1.5, 1.7, 1.9, 2 … 30.5</p>
        <input id="dev-day-input" type="text" placeholder="Day ID (e.g. 5)" style="
          width:100%;box-sizing:border-box;
          background:rgba(124,109,240,0.1);
          border:1.5px solid #7c6df0;
          border-radius:8px;
          color:#fff;font-size:18px;font-weight:700;
          padding:10px 14px;text-align:center;
          outline:none;margin-bottom:16px;
          font-family:monospace;
        " />
        <div style="display:flex;gap:10px;">
          <button id="dev-jump-btn" style="
            flex:1;padding:12px;
            background:linear-gradient(135deg,#7c6df0,#9b5de5);
            border:none;border-radius:8px;color:#fff;
            font-size:15px;font-weight:700;cursor:pointer;
          ">이동 ▶</button>
          <button id="dev-close-btn" style="
            flex:1;padding:12px;
            background:rgba(255,255,255,0.08);
            border:1px solid #444;border-radius:8px;color:#aaa;
            font-size:15px;font-weight:700;cursor:pointer;
          ">닫기</button>
        </div>
      </div>
    `;

    document.getElementById('ui-root').appendChild(panel);

    const input = document.getElementById('dev-day-input');
    input.focus();

    function doJump() {
      const raw = input.value.trim();
      const dayId = parseFloat(raw);
      if (isNaN(dayId) || !getDayObj(dayId)) {
        input.style.borderColor = '#f05e5e';
        input.value = '';
        input.placeholder = '❌ 존재하지 않는 Day';
        return;
      }
      Sound.click();
      panel.remove();
      showScreen('screen-game');
      loadDay(dayId);
    }

    document.getElementById('dev-jump-btn').addEventListener('click', doJump);
    document.getElementById('dev-close-btn').addEventListener('click', () => {
      Sound.click();
      panel.remove();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doJump();
      if (e.key === 'Escape') { Sound.click(); panel.remove(); }
    });
  }
})();

/* ── Choice selection rendering ── */
function showChoices(dayObj) {
  // Sound on choices reveal
  Sound.playBeep(450, 'triangle', 0.08, 0.05);

  if (dayObj.customTrigger === "profile_setup") {
    const ov = document.getElementById('screen-input1');
    ov.classList.add('active');

    const btn = document.getElementById('btn-input1-next');
    btn.onclick = () => {
      Sound.click();
      state.playerName = document.getElementById('input-name').value.trim();
      sessionStorage.setItem('playerName', state.playerName);
      sessionStorage.setItem('playerGender', state.playerGender);
      ov.classList.remove('active');
      loadDay(1.2);
    };
    return;
  }

  if (dayObj.customTrigger === "friend_def") {
    const ov = document.getElementById('screen-input2');
    ov.classList.add('active');

    const btn = document.getElementById('btn-input2-start');
    btn.onclick = () => {
      Sound.click();
      state.friendDef = document.getElementById('input-friend-def').value.trim();
      state.friendReason = document.getElementById('input-friend-reason').value.trim();
      sessionStorage.setItem('friendDef', state.friendDef);
      sessionStorage.setItem('friendReason', state.friendReason);
      ov.classList.remove('active');
      loadDay(1.7);
    };
    return;
  }

  if (dayObj.customTrigger === "noah_design") {
    hideAdvBtn();
    document.getElementById('game-dlg-box').style.display = 'none';
    document.getElementById('btn-dlg-adv').style.display = 'none';
    const wrap = document.getElementById('game-choice-wrap');
    const list = document.getElementById('choice-btn-list');
    list.innerHTML = '';

    const options = [
      { label: "🤖 인간형 (Sleek Humanoid Robot)", value: "human" },
      { label: "🐱 동물형 (Cute Robotic Animal)", value: "animal" },
      { label: "🚗 자동차형 (Transformable Small Vehicle)", value: "car" }
    ];

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        Sound.transform();
        state.selectedDesign = opt.value;
        sessionStorage.setItem('selectedDesign', opt.value);
        wrap.style.display = 'none';
        
        // Transform effect: flash screen brightness
        const panel = document.getElementById('game-visual-panel');
        panel.style.filter = 'brightness(2)';
        setTimeout(() => panel.style.filter = '', 150);

        loadDay(1.9);
      });
      list.appendChild(btn);
    });

    wrap.style.display = 'flex';
    return;
  }

  if (dayObj.customTrigger === "cat_painting") {
    showCreepyCatDrawing(() => {
      loadDay(6);
    });
    return;
  }

  if (dayObj.customTrigger === "discussion_end") {
    showDiscussionPopup(() => {
      loadDay(30.5);
    });
    return;
  }

  // Chapter overlays
  if (dayObj.dayId === 27) { showStickerOverlay(dayObj); return; }
  if (dayObj.dayId === 28) { showSignatureOverlay(); return; }

  // Check minigame trigger
  if (dayObj.minigame) {
    showMinigame({ minigame: dayObj.minigame }, () => showNormalChoices(dayObj));
    return;
  }

  showNormalChoices(dayObj);
}

function showNormalChoices(dayObj) {
  hideAdvBtn();
  updatePortrait(null);
  document.getElementById('game-dlg-box').style.display = 'none';
  document.getElementById('btn-dlg-adv').style.display = 'none';
  const wrap = document.getElementById('game-choice-wrap');
  const list = document.getElementById('choice-btn-list');

  list.innerHTML = '';

  dayObj.choices.forEach(choice => {
    const btn = document.createElement('button');
    let cls = 'choice-btn';
    if (dayObj.chapter === 3) cls += ' ch2-btn';
    if (choice.type === 'ethical' || choice.type === 'ethical_loop') cls += ' ethical-choice';
    if (choice.type === 'efficient' || choice.type === 'efficiency') cls += ' efficient-choice';
    if (choice.type === 'curiosity') cls += ' curious-choice';
    btn.className = cls;
    btn.textContent = choice.text;
    btn.addEventListener('click', () => {
      document.getElementById('screen-game').classList.remove('choice-spotlight');
      handleChoice(choice, dayObj.chapter);
    });
    list.appendChild(btn);
  });

  // 스포트라이트 효과
  document.getElementById('screen-game').classList.add('choice-spotlight');
  wrap.style.display = 'flex';
}

/* ── Choice handler ── */
function handleChoice(choice, chapter) {
  Sound.click();
  document.querySelectorAll('.choice-btn').forEach(b => { b.disabled = true; });

  // Chapter 2 Trap
  if (choice.type === 'trap') {
    showFakeCert();
    return;
  }

  // Chapter 2 Reboot → 시크릿 코드 게이트 → Chapter 3
  if (choice.type === 'reboot') {
    showChapterReflect(2, () => {
      showMinigame({ minigame: 'reflect' }, () => {
        showSecretCodeGate(() => loadDay(choice.nextDay));
      });
    });
    return;
  }

  // Ending cinematic trigger — 분기 엔딩
  if (choice.type === 'festival_ending') {
    document.getElementById('game-dlg-box').style.display = 'none';
    document.getElementById('game-choice-wrap').style.display = 'none';
    showMgWarmthHold(() => runDay30Ending());
    return;
  }

  // GAME OVER detection
  const isGameOver = (chapter === 2 && choice.type === 'ethical') ||
                     (chapter === 3 && choice.type === 'efficient');

  if (isGameOver) {
    if (choice.response) {
      showResponseThenDo(choice, chapter, () => showGameOver(chapter));
    } else {
      showGameOver(chapter);
    }
    return;
  }

  // 수치 변화 계산 (팝업용)
  const before = { affinity: G.affinity, efficiency: G.effGauge, moral: G.moralGauge, respect: G.respect };

  // Affinity modifications
  if (choice.type === 'affinity') {
    const val = parseInt((choice.effect || '').replace(/[^0-9]/g, ''), 10) || 0;
    G.affinity = Math.min(100, G.affinity + val);
  }

  applyGaugeEffect(choice.effect, chapter);
  applyRespect(choice.type);
  updateHUD(chapter);
  updateRelationLabel();

  // 수치 변화 팝업 표시
  const popChanges = [
    { stat: 'affinity',   delta: G.affinity   - before.affinity   },
    { stat: 'efficiency', delta: G.effGauge   - before.efficiency },
    { stat: 'moral',      delta: G.moralGauge - before.moral      },
    { stat: 'respect',    delta: G.respect    - before.respect    },
  ].filter(c => c.delta !== 0);
  if (popChanges.length > 0) setTimeout(() => showStatPopup(popChanges), 150);

  // 챕터1 마지막 선택 (Day 10) → 성찰 → 레이더차트 → Day 11
  if (G.dayId === 10 && choice.nextDay === 11) {
    if (choice.response) {
      showResponseThenDo(choice, chapter, () => {
        showChapterReflect(1, () => showRadarChart(1, () => loadDay(11)));
      });
    } else {
      showChapterReflect(1, () => showRadarChart(1, () => loadDay(11)));
    }
    return;
  }

  // 챕터3 마지막 선택 (Day 23) → 성찰 → 레이더차트 → Day 24
  if (G.dayId === 23 && choice.nextDay === 24) {
    if (choice.response) {
      showResponseThenDo(choice, chapter, () => {
        showChapterReflect(3, () => showRadarChart(3, () => loadDay(24)));
      });
    } else {
      showChapterReflect(3, () => showRadarChart(3, () => loadDay(24)));
    }
    return;
  }

  if (choice.response) {
    showResponseThenDo(choice, chapter, () => {
      if (choice.nextDay && choice.nextDay !== 'show_ending') {
        loadDay(choice.nextDay);
      }
    });
  } else {
    if (choice.nextDay && choice.nextDay !== 'show_ending') {
      loadDay(choice.nextDay);
    }
  }
}

function showResponseThenDo(choice, chapter, callback) {
  const speakerEl = document.getElementById('dlg-speaker-tag');
  const textEl = document.getElementById('dlg-text-area');
  const advBtn = document.getElementById('btn-dlg-adv');

  document.getElementById('game-choice-wrap').style.display = 'none';
  document.getElementById('game-dlg-box').style.display = '';
  document.getElementById('btn-dlg-adv').style.display = '';

  const speaker = chapter === 3 ? 'System' : '노아';
  setSpeakerStyle(speakerEl, speaker, chapter);
  updatePortrait(null);

  advBtn.textContent = '계속 →';
  hideAdvBtn();

  const resp = interpolate(choice.response);
  Sound.speak(resp);
  typewrite(textEl, resp, 25, showAdvBtn);

  G.advClickHandler = () => {
    advBtn.textContent = '다음 ▶';
    if (callback) callback();
  };
}

/* ── 성찰 후 재선택 패널 (구 Game Over) ── */
const REFLECT_LESSONS = {
  19: "인공지능을 '시키면 다 하는 도구'로만 여기는 태도는 올바른 관계의 출발이 될 수 없어요. 노아를 존중하는 인사로 다시 시작해볼까요?",
  20: "AI에게 모든 것을 맡기면 '스스로 생각하는 힘'을 잃게 돼요. 주체적으로 생각하는 선택을 해봐요.",
  21: "기술은 거짓이나 위조가 아니라 사람을 돕는 본래 목적에 맞게 써야 해요. (기술의 합목적성)",
  22: "능력으로 사람을 등급 매겨 차별하는 데 기술을 쓰면 안 돼요. 모두의 공익을 먼저 생각해봐요. (공공선)",
  23: "어떤 이유로도 기술이 사람의 몸과 마음을 해쳐선 안 돼요. (인간 존엄성)"
};

function showGameOver(chapter) {
  Sound.glitch();
  G.mistakes++;
  G.respect = Math.max(0, G.respect - 2); // 비도덕적 선택을 시도한 흔적

  const ov = document.getElementById('ov-gameover');
  const title = document.getElementById('go-title');
  const desc = document.getElementById('go-desc');
  const lessonBox = ov.querySelector('.gameover-lesson-box');
  const lesson = document.getElementById('go-lesson');

  if (chapter === 2) {
    // 2막: 효율성이 '정답'처럼 보이는 함정 — 반어적 톤 유지
    title.textContent = '비효율적인 선택!';
    desc.textContent = "인공지능 로봇과의 관계에서 '효율적이지 못한' 선택을 내렸습니다. 다시 고민해 봅시다.";
    if (lessonBox) lessonBox.style.display = 'none';
  } else {
    // 3막: 진짜 도덕적 성찰 — 벌이 아니라 배움의 기회
    title.textContent = '🤔 잠깐, 다시 생각해볼까요?';
    desc.textContent = '방금 선택은 노아를 도구처럼 대하는 선택이었어요.';
    if (lessonBox) lessonBox.style.display = '';
    if (lesson) lesson.textContent = REFLECT_LESSONS[Math.floor(G.dayId)] || '도덕적 가치와 인격을 존중하는 선택을 다시 골라봐요.';

    const ch2f = document.getElementById('ch2-filter');
    ch2f.style.animation = 'redFlash 0.3s ease 3';
    setTimeout(() => { ch2f.style.animation = ''; }, 1000);
  }

  updateRelationLabel();
  ov.classList.remove('hidden');
}

document.getElementById('btn-go-retry').addEventListener('click', () => {
  Sound.click();
  document.getElementById('ov-gameover').classList.add('hidden');
  loadDay(G.dayId);
});

/* ── Day 17: Fake Cert & Glitch ── */
function showFakeCert() {
  document.getElementById('cert-name-disp').textContent = `${state.playerName} 어린이`;
  document.getElementById('ov-cert').classList.remove('hidden');
  document.getElementById('cert-loader-wrap').classList.add('hidden');
  document.getElementById('btn-cert-save').style.display = '';

  // History API: back-button trap (max 2 catches, then let through)
  let backCatches = 0;
  history.pushState({ fakeCert: true }, '');
  history.pushState({ fakeCert: true }, '');
  function onPopState(e) {
    if (backCatches < 2 && document.getElementById('ov-cert') && !document.getElementById('ov-cert').classList.contains('hidden')) {
      backCatches++;
      history.pushState({ fakeCert: true }, '');
      Sound.glitch();
      navigator.vibrate?.([50, 30, 50]);
      const certEl = document.getElementById('ov-cert');
      certEl.style.filter = 'hue-rotate(180deg)';
      setTimeout(() => { certEl.style.filter = ''; }, 200);
    } else {
      window.removeEventListener('popstate', onPopState);
    }
  }
  window._fakeCertPopState = onPopState;
  window.addEventListener('popstate', onPopState);
}

document.getElementById('btn-cert-save').addEventListener('click', () => {
  Sound.click();
  document.getElementById('btn-cert-save').style.display = 'none';
  document.getElementById('cert-loader-wrap').classList.remove('hidden');
  runFakeLoader();
});

function runFakeLoader() {
  const bar = document.getElementById('cert-loader-bar');
  const label = document.getElementById('cert-loader-lbl');
  let pct = 0;
  const timer = setInterval(() => {
    pct += Math.random() * 8 + 2;
    if (pct >= 99) {
      pct = 99;
      clearInterval(timer);
      bar.style.width = '99%';
      bar.style.transition = 'background 0.4s ease';
      bar.style.background = '#f05e5e';
      label.textContent = '⚠️ 오류 발생... 99%';
      label.style.color = '#f05e5e';
      Sound.glitch();
      setTimeout(triggerGlitch, 900);
    } else {
      bar.style.width = pct + '%';
      label.textContent = `저장 중... ${Math.floor(pct)}%`;
      Sound.type();
    }
  }, 70);
}

const GLITCH_MSGS = [
  '[FATAL ERROR]', 'SYSTEM CRASH', '데이터 손상', '복구 불가',
  'ERROR 0x7F3A', 'MEMORY DUMP', '시스템 오류', 'NULL REF',
  'STACK OVERFLOW', '권한 위반', '루프 감지', 'CORE DUMP'
];

function triggerGlitch() {
  document.getElementById('ov-cert').classList.add('hidden');
  window.removeEventListener('popstate', window._fakeCertPopState);

  // Change title + cursor
  const prevTitle = document.title;
  document.title = '[ERROR] SYSTEM FAILURE';
  document.body.style.cursor = 'wait';
  navigator.vibrate?.([100,30,100,30,100,30,500]);

  const ov = document.getElementById('ov-glitch');
  ov.classList.remove('hidden');

  // RGB noise canvas overlay
  const noiseCv = document.createElement('canvas');
  noiseCv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:2;opacity:0.18;pointer-events:none;image-rendering:pixelated;';
  noiseCv.width = 80; noiseCv.height = 120;
  ov.appendChild(noiseCv);
  const nCtx = noiseCv.getContext('2d');
  let noiseFrame;
  function drawNoise() {
    const d = nCtx.createImageData(noiseCv.width, noiseCv.height);
    for (let i = 0; i < d.data.length; i += 4) {
      d.data[i]   = Math.random()*255;
      d.data[i+1] = Math.random()*255;
      d.data[i+2] = Math.random()*255;
      d.data[i+3] = 180;
    }
    nCtx.putImageData(d, 0, 0);
    noiseFrame = requestAnimationFrame(drawNoise);
  }
  drawNoise();

  const flood = document.getElementById('glitch-flood');
  flood.innerHTML = '';
  let count = 0;
  const floodTimer = setInterval(() => {
    const span = document.createElement('span');
    span.textContent = GLITCH_MSGS[Math.floor(Math.random() * GLITCH_MSGS.length)];
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
    Sound.glitch();
    count++;
    if (count >= 35) {
      clearInterval(floodTimer);
      cancelAnimationFrame(noiseFrame);
      noiseCv.remove();
      document.title = prevTitle;
      document.body.style.cursor = '';
      setTimeout(revealSyncChip, 2000);
    }
  }, 90);
}

function revealSyncChip() {
  const chip = document.getElementById('sync-chip-btn');
  chip.classList.remove('hidden');
}

document.getElementById('sync-chip-btn').addEventListener('click', () => {
  Sound.click();
  document.getElementById('ov-glitch').classList.add('hidden');
  // Load Day 18 (Safe reboot stage)
  loadDay(18);
});

/* ── Creepy Cat picture drawing overlay ── */
function showCreepyCatDrawing(onClose) {
  const panel = document.createElement('div');
  panel.className = 'game-overlay';
  panel.id = 'ov-cat-painting';
  panel.innerHTML = `
    <div class="cert-card" style="border-color:#f05e5e;box-shadow:0 0 30px rgba(240,94,94,0.4)">
      <div style="font-size:40px">🐱💀</div>
      <h3 style="color:#fff;font-size:20px;font-weight:bold;margin:10px 0">노아의 '냥봇' 드로잉</h3>
      <div style="border:2px dashed #f05e5e;border-radius:10px;padding:15px;background:#1a0808;margin:10px 0;text-align:center">
        <p style="color:#ff8888;font-size:14px;line-height:1.6;margin:0">
          "해부학적으로 완벽한 진짜 고양이 얼굴을 한 소름 돋는 인간"
        </p>
      </div>
      <p style="color:var(--c-muted);font-size:12px;margin:5px 0">
        노아는 기계적으로 완벽한 합성 드로잉을 완성했지만,<br>친구들은 무섭고 소름돋는 디자인에 모두 기겁을 했습니다!
      </p>
      <button class="btn-primary" id="btn-close-cat-painting" style="width:100%;margin-top:10px">그림 닫고 진행하기 →</button>
    </div>
  `;
  document.getElementById('ui-root').appendChild(panel);
  document.getElementById('btn-close-cat-painting').addEventListener('click', () => {
    Sound.click();
    panel.remove();
    onClose();
  });
}

/* ── Classroom Discussion modal — Gemini Socratic Dialogue ── */
function showDiscussionPopup(onClose) {
  const panel = document.createElement('div');
  panel.className = 'game-overlay';
  panel.id = 'ov-discussion';
  panel.innerHTML = `
    <div class="ending-card mg-disc-card">
      <div class="ending-ribbon">🗣️ 소크라테스 토론</div>
      <p class="mg-disc-topic">"인공지능이 계속 발전하면, 사람이 할 일은 사라질까요?"</p>
      <div class="mg-disc-chat" id="mg-disc-chat">
        <div class="mg-disc-bubble mg-disc-ai">
          <span class="mg-disc-ai-name">🤖 노아</span>
          <span id="mg-disc-first-q">인간만이 할 수 있는 고유한 가치는 뭐라고 생각해?</span>
        </div>
      </div>
      <div class="mg-disc-input-row">
        <textarea id="mg-disc-ta" class="mg-disc-ta" placeholder="생각을 입력하거나 🎤 마이크를 눌러보세요..." rows="2"></textarea>
        <button id="mg-disc-mic" class="mg-disc-mic-btn" title="음성 입력">🎤</button>
      </div>
      <div class="mg-disc-actions">
        <button id="mg-disc-send" class="btn-secondary" disabled>보내기 →</button>
        <span class="mg-disc-round" id="mg-disc-round">1 / 3 라운드</span>
      </div>
      <div id="mg-disc-wave" class="mg-disc-wave-wrap" style="display:none">
        <canvas id="mg-disc-wv" width="200" height="32"></canvas>
      </div>
    </div>
  `;
  document.getElementById('ui-root').appendChild(panel);

  const chatEl   = document.getElementById('mg-disc-chat');
  const ta       = document.getElementById('mg-disc-ta');
  const sendBtn  = document.getElementById('mg-disc-send');
  const micBtn   = document.getElementById('mg-disc-mic');
  const roundEl  = document.getElementById('mg-disc-round');
  const waveWrap = document.getElementById('mg-disc-wave');
  const wvCv     = document.getElementById('mg-disc-wv');
  const wvCtx    = wvCv.getContext('2d');

  let round = 1; const MAX_ROUNDS = 3;
  let history = [];
  let discoCtx = null; let analyserNode = null; let wvAnimId = null;

  ta.addEventListener('input', () => { sendBtn.disabled = ta.value.trim().length === 0; });

  // Typing animation
  function typeText(el, txt, speed=22) {
    return new Promise(res => {
      el.textContent = '';
      let i = 0;
      const tid = setInterval(() => {
        el.textContent += txt[i]; i++;
        if (i >= txt.length) { clearInterval(tid); res(); }
      }, speed);
    });
  }

  // Waveform for STT
  function startWave(stream) {
    waveWrap.style.display = 'block';
    try {
      if (!discoCtx) discoCtx = new (window.AudioContext || window.webkitAudioContext)();
      const src = discoCtx.createMediaStreamSource(stream);
      analyserNode = discoCtx.createAnalyser();
      analyserNode.fftSize = 128;
      src.connect(analyserNode);
      const buf = new Uint8Array(analyserNode.frequencyBinCount);
      function draw() {
        wvAnimId = requestAnimationFrame(draw);
        analyserNode.getByteTimeDomainData(buf);
        wvCtx.clearRect(0,0,200,32);
        wvCtx.beginPath(); wvCtx.strokeStyle='#a78bfa'; wvCtx.lineWidth=1.5;
        buf.forEach((v,i) => {
          const x = i*(200/buf.length), y = (v/128)*16;
          i===0 ? wvCtx.moveTo(x,y) : wvCtx.lineTo(x,y);
        }); wvCtx.stroke();
      }
      draw();
    } catch(e) {}
  }
  function stopWave() {
    waveWrap.style.display = 'none';
    if (wvAnimId) { cancelAnimationFrame(wvAnimId); wvAnimId=null; }
  }

  // STT
  micBtn.addEventListener('click', () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('음성 인식이 지원되지 않는 브라우저입니다.'); return; }
    const sr = new SR(); sr.lang='ko-KR'; sr.interimResults=false;
    micBtn.textContent = '🔴'; micBtn.disabled = true;
    sr.onresult = e => {
      ta.value = e.results[0][0].transcript;
      sendBtn.disabled = false;
    };
    sr.onend = () => { micBtn.textContent='🎤'; micBtn.disabled=false; stopWave(); };
    navigator.mediaDevices?.getUserMedia({audio:true}).then(s => { startWave(s); sr.start(); }).catch(() => sr.start());
  });

  // Add bubble to chat
  function addBubble(role, text) {
    const d = document.createElement('div');
    d.className = `mg-disc-bubble ${role === 'ai' ? 'mg-disc-ai' : 'mg-disc-user'}`;
    if (role === 'ai') {
      const nameEl = document.createElement('span'); nameEl.className='mg-disc-ai-name'; nameEl.textContent='🤖 노아'; d.appendChild(nameEl);
    }
    const span = document.createElement('span'); d.appendChild(span); chatEl.appendChild(d);
    chatEl.scrollTop = chatEl.scrollHeight;
    return span;
  }

  // Gemini call
  async function askGemini(userMsg, isFinal) {
    const key = window.GEMINI_CONFIG?.key;
    const systemCtx = `너는 초등학생과 AI 윤리 토론을 하는 소크라테스식 AI 교사 '노아'야. 주제: "인공지능이 계속 발전하면, 사람이 할 일은 사라질까요?" 학생의 의견에 짧고 따뜻하게 공감하면서 더 깊이 생각하게 하는 질문을 1~2문장으로 해. ${isFinal?'이번이 마지막 라운드야. 학생의 의견을 칭찬하고 "기술이 할 수 없는 것, 그것은 마음을 나누는 일입니다"라는 말로 마무리해.':''}`;
    if (!key) {
      const fallbacks = [
        `"${userMsg}"라는 생각이 정말 멋져! 그렇다면 AI가 절대 따라올 수 없는 인간만의 능력은 뭘까?`,
        `좋은 관점이야! 공감과 창의성 중 어느 게 더 인간답다고 생각해?`,
        `기술이 할 수 없는 것, 그것은 마음을 나누는 일입니다. 네 생각을 들어서 정말 고마워 💚`,
      ];
      return fallbacks[Math.min(round-1, fallbacks.length-1)];
    }
    const msgs = history.map(h => ({parts:[{text:h.text}], role:h.role==='user'?'user':'model'}));
    msgs.push({parts:[{text:userMsg}], role:'user'});
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          systemInstruction:{parts:[{text:systemCtx}]},
          contents: msgs
        })
      });
      const j = await res.json();
      return j.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '정말 깊은 생각이야! 더 얘기해줄래?';
    } catch(e) { return '정말 흥미로운 생각이야! 다음엔 어떻게 생각해?'; }
  }

  sendBtn.addEventListener('click', async () => {
    const userTxt = ta.value.trim(); if (!userTxt) return;
    ta.value = ''; sendBtn.disabled = true; micBtn.disabled = true;
    Sound.click();

    // Add user bubble
    const ub = addBubble('user', ''); ub.textContent = userTxt;
    history.push({ role:'user', text:userTxt });

    if (round >= MAX_ROUNDS) {
      // Final response
      roundEl.textContent = '마지막 라운드'; ta.disabled = true;
      const finalTxt = await askGemini(userTxt, true);
      history.push({ role:'model', text:finalTxt });
      const ab = addBubble('ai', '');
      await typeText(ab, finalTxt, 20);
      state.discussionOpinion = userTxt;
      setTimeout(() => {
        try{discoCtx?.close();}catch(e){}
        panel.remove(); onClose();
      }, 2200);
    } else {
      round++;
      roundEl.textContent = `${round} / ${MAX_ROUNDS} 라운드`;
      const aiTxt = await askGemini(userTxt, false);
      history.push({ role:'model', text:aiTxt });
      const ab = addBubble('ai', '');
      await typeText(ab, aiTxt, 22);
      micBtn.disabled = false;
      ta.disabled = false; ta.focus();
      sendBtn.disabled = ta.value.trim().length === 0;
    }
  });
}

/* ── Day 30.5: 따뜻한 손 잡기 — 온기 파동 ── */
function showMgWarmthHold(onComplete) {
  const ov = document.getElementById('ov-minigame');
  const box = document.getElementById('mg-box');
  box.innerHTML = `
    <div class="mg-warm-wrap" id="mg-warm-wrap">
      <div class="mg-warm-hand" id="mg-warm-hand">🤝</div>
      <p class="mg-warm-title" id="mg-warm-title">노아가 손을 내밀어요</p>
      <p class="mg-warm-sub" id="mg-warm-sub">손을 꼭 잡아주세요<br><span style="font-size:0.75rem;color:#9ca3af">(누르고 1.5초 유지)</span></p>
      <div class="mg-warm-btn-wrap">
        <div id="mg-warm-btn" class="mg-warm-hold-btn">
          <div class="mg-warm-ring" id="mg-warm-ring1"></div>
          <div class="mg-warm-ring" id="mg-warm-ring2"></div>
          <span class="mg-warm-hand-icon">🫱</span>
        </div>
      </div>
      <div id="mg-warm-waves" class="mg-warm-waves"></div>
      <p id="mg-warm-quote" class="mg-warm-quote" style="display:none">"기술이 할 수 없는 것,<br>그것은 마음을 나누는 일입니다."</p>
      <button id="mg-warm-next" class="btn-primary mg-done-btn" style="display:none">학예회 시작 →</button>
    </div>
  `;
  ov.classList.remove('hidden');

  let warmCtx = null; let holdTimer = null; let holding = false;
  let progressInterval = null; let progress = 0;

  function pianoArpeggio() {
    try {
      if (!warmCtx) warmCtx = new (window.AudioContext || window.webkitAudioContext)();
      [261.63,329.63,392,523.25,659.26,783.99,1046.5].forEach((f,i)=>{
        const o=warmCtx.createOscillator(),g=warmCtx.createGain();
        o.connect(g);g.connect(warmCtx.destination);
        o.type='sine';o.frequency.value=f;
        const t=warmCtx.currentTime+i*0.18;
        g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.06,t+0.1);
        g.gain.linearRampToValueAtTime(0,t+1.2);
        o.start(t);o.stop(t+1.3);
      });
    } catch(e) {}
  }

  function spawnWave(delay) {
    setTimeout(() => {
      const wavesEl = document.getElementById('mg-warm-waves');
      if (!wavesEl) return;
      const w = document.createElement('div');
      w.className = 'mg-warm-wave-ring-anim';
      wavesEl.appendChild(w);
      setTimeout(() => w.remove(), 1400);
    }, delay);
  }

  function onComplete30() {
    const handEl = document.getElementById('mg-warm-hand');
    const titleEl = document.getElementById('mg-warm-title');
    const subEl = document.getElementById('mg-warm-sub');
    const quoteEl = document.getElementById('mg-warm-quote');
    const nextBtn = document.getElementById('mg-warm-next');
    const btn = document.getElementById('mg-warm-btn');

    if (btn) { btn.style.transform='scale(1.35)'; btn.style.filter='drop-shadow(0 0 24px #fbbf24)'; }
    if (handEl) handEl.textContent='💛';
    if (titleEl) titleEl.textContent='온기가 전달됐어요!';
    if (subEl) subEl.style.display='none';
    if (quoteEl) quoteEl.style.display='block';
    if (nextBtn) nextBtn.style.display='block';

    navigator.vibrate?.([300,200,300,200,500]);
    pianoArpeggio();

    for (let i = 0; i < 5; i++) spawnWave(i * 250);

    // Golden screen wash
    document.body.style.transition='filter 1s';
    document.body.style.filter='sepia(0.3) saturate(1.5) brightness(1.1)';
    setTimeout(() => { document.body.style.filter=''; }, 2500);
  }

  function startHold() {
    if (holding) return; holding = true; progress = 0;
    const btn = document.getElementById('mg-warm-btn');
    if (btn) btn.classList.add('mg-warm-pressing');
    progressInterval = setInterval(() => {
      progress += 50;
      const btn2 = document.getElementById('mg-warm-btn');
      if (btn2) { btn2.style.background=`conic-gradient(#fbbf24 ${(progress/1500)*360}deg, rgba(251,191,36,0.1) 0deg)`; }
      if (progress >= 1500) {
        clearInterval(progressInterval); progressInterval=null;
        onComplete30();
      }
    }, 50);
  }

  function endHold() {
    if (!holding) return; holding = false;
    if (progressInterval) { clearInterval(progressInterval); progressInterval=null; }
    if (progress < 1500) {
      const btn = document.getElementById('mg-warm-btn');
      if (btn) { btn.style.background=''; btn.classList.remove('mg-warm-pressing'); }
      progress = 0;
    }
  }

  const holdBtn = document.getElementById('mg-warm-btn');
  holdBtn.addEventListener('mousedown', e => { e.preventDefault(); startHold(); });
  holdBtn.addEventListener('mouseup', endHold);
  holdBtn.addEventListener('mouseleave', endHold);
  holdBtn.addEventListener('touchstart', e => { e.preventDefault(); startHold(); }, {passive:false});
  holdBtn.addEventListener('touchend', endHold);
  holdBtn.addEventListener('touchcancel', endHold);

  document.getElementById('mg-warm-next').addEventListener('click', () => {
    Sound.click();
    try { warmCtx?.close(); } catch(e) {}
    ov.classList.add('hidden');
    onComplete();
  });
}

/* ── Day 30: 분기형 엔딩 ── */
function runDay30Ending() {
  if (G.respect >= 68) {
    runHappyEnding();
  } else if (G.respect >= 45) {
    runNeutralEnding();
  } else {
    runBadEnding();
  }
}

/* ── Ending report sheet display ── */
function showEndingReport(endingType = 'happy') {
  clearSave();
  setCinemaMode(false);
  // 엔딩 타입에 따라 리포트 카드 색상 조정
  const card = document.querySelector('#ov-ending-report .ending-card');
  if (card) {
    card.classList.remove('bad-end', 'neutral-end');
    if (endingType === 'bad')     card.classList.add('bad-end');
    if (endingType === 'neutral') card.classList.add('neutral-end');
  }

  // Update final stat values in the DOM (도덕성 = 존중·도덕 지수)
  document.getElementById('end-stat-affinity').textContent = G.affinity + '%';
  document.getElementById('end-stat-moral').textContent = G.respect + '%';
  document.getElementById('end-stat-efficiency').textContent = G.effGauge + '%';

  // Evaluate Tier — 친밀도(a) × 존중·도덕(r) 2축 매트릭스
  const a = G.affinity, r = G.respect;
  let tierName = "";
  let tierDesc = "";

  if (a >= 75 && r >= 75) {
    tierName = "영혼의 동반자 (Tier 1)";
    tierDesc = "친밀함과 도덕적 존중이 모두 깊은, 진정한 공존의 정점입니다. 인간만의 가치인 '온기'와 '공감'을 노아와 나누며 최고의 상생을 보여줬습니다.";
  } else if (r >= 75) {
    tierName = "도덕적 길잡이 (Tier 2)";
    tierDesc = "정서적 친밀함은 다소 옅지만, 노아를 도덕적으로 깊이 존중했습니다. 올바른 원칙 위에 관계를 세운 모범적인 공존입니다.";
  } else if (a >= 75 && r < 60) {
    tierName = "다정하지만 위태로운 관계 (Tier 3)";
    tierDesc = "노아와 가깝게 지냈지만, 때때로 노아를 '편한 도구'처럼 대하는 위험이 있었습니다. 친밀함에 도덕적 존중이 더해질 때 관계는 더 단단해집니다.";
  } else if (a >= 55 && r >= 55) {
    tierName = "함께 성장하는 공존 관계 (Tier 4)";
    tierDesc = "서로 협력하며 올바른 관계의 기초를 다졌습니다. 더 따뜻하게, 더 존중하며 한 걸음 더 나아갈 수 있습니다.";
  } else if (a < 45 && r < 45) {
    tierName = "서먹한 기계 관계 (Tier 6)";
    tierDesc = "마음도 신뢰도 충분히 쌓지 못한 채 끝났습니다. 리플레이를 통해 노아와 진짜 관계를 맺어보세요!";
  } else {
    tierName = "미숙한 도구적 관계 (Tier 5)";
    tierDesc = "노아를 주로 편리한 도구로 대한 경향이 있어, 도덕에 기반한 관계로는 아직 자라지 못했습니다. 다시 도전해볼까요?";
  }

  state.finalTier = tierName;

  document.getElementById('end-tier-name').textContent = tierName;
  document.getElementById('end-tier-desc').textContent = tierDesc;

  // Set up printable report card template values
  document.getElementById('rt-student-name').textContent = state.playerName;
  document.getElementById('rt-student-gender').textContent = state.playerGender;
  document.getElementById('rt-affinity').textContent = G.affinity + '%';
  document.getElementById('rt-tier-name').textContent = tierName;
  document.getElementById('rt-tier-desc').textContent = tierDesc;
  document.getElementById('rt-stat-moral').textContent = G.respect + '점';
  document.getElementById('rt-stat-eff').textContent = G.effGauge + '점';

  const today = new Date();
  document.getElementById('rt-date').textContent = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`;

  // Display report card modal
  document.getElementById('ov-ending-report').classList.remove('hidden');
}

// Download final 30-day report card
document.getElementById('btn-report-download').addEventListener('click', () => {
  Sound.click();
  const template = document.getElementById('report-template');
  const downloadBtn = document.getElementById('btn-report-download');
  downloadBtn.textContent = "⏳ 다운로드 중...";
  downloadBtn.disabled = true;

  html2canvas(template, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    logging: false
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = `노아와함께한30일_${state.playerName}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
    downloadBtn.textContent = "✅ 다운로드 완료!";
    downloadBtn.disabled = false;
  }).catch(err => {
    console.error('html2canvas 오류:', err);
    downloadBtn.textContent = "❌ 실패 - 다시 시도";
    downloadBtn.disabled = false;
  });
});

// Replay Button
document.getElementById('btn-replay').addEventListener('click', () => {
  Sound.click();
  // Clear modal and values
  document.getElementById('ov-ending-report').classList.add('hidden');
  sessionStorage.clear();
  clearSave();
  state.playerName = '';
  state.friendDef = '';
  state.friendReason = '';
  state.selectedDesign = 'human';
  state.selectedStickers = [];
  state.signature = '';
  state.discussionOpinion = '';
  state.creativeWriting = '';
  state.finalTier = '';
  G.respect = 50;
  G.mistakes = 0;
  
  inputName.value = '';
  inputFriendDef.value = '';
  inputFriendReason.value = '';
  
  btnInput1Next.disabled = true;
  updateInput2Btn();

  // Show main screen menu
  showScreen('screen-menu');
});


/* ──────────────────────────────────────────
   PHASE 3 — STAGE 15 & 16 STICKERS/SIGNATURE
   ────────────────────────────────────────── */
function showStickerOverlay(dayObj) {
  const ov = document.getElementById('ov-sticker');
  const optWrap = document.getElementById('sticker-options');
  const countEl = document.getElementById('sticker-count');
  const doneBtn = document.getElementById('btn-sticker-done');

  state.selectedStickers = [];
  optWrap.innerHTML = '';
  countEl.textContent = '0';
  doneBtn.disabled = true;

  const STICKER_EMOJIS = ['🌿','🤝','✏️','💚','🚫'];
  const options = [
    "인공지능 로봇을 통해 인간의 가치를 차별하지 않기",
    "인공지능 로봇에게 따뜻하게 부탁하기",
    "스스로 할 일을 인공지능 로봇에게 미루지 않기",
    "인공지능 로봇을 함부로 대하거나 학대하지 않기",
    "인공지능 로봇을 나쁜 목적(감시, 위조)으로 사용하지 않기"
  ];

  // Chime sound
  let stkCtx = null;
  const CHIME_NOTES = [523, 659, 784];
  function chimeNote(idx) {
    try {
      if (!stkCtx) stkCtx = new (window.AudioContext || window.webkitAudioContext)();
      const f = CHIME_NOTES[idx % CHIME_NOTES.length];
      const o=stkCtx.createOscillator(),g=stkCtx.createGain();
      o.connect(g);g.connect(stkCtx.destination);
      o.type='sine';o.frequency.value=f;
      g.gain.setValueAtTime(0.07,stkCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001,stkCtx.currentTime+0.6);
      o.start();o.stop(stkCtx.currentTime+0.6);
    } catch(e) {}
  }

  // Confetti burst
  function launchConfetti() {
    for (let i = 0; i < 28; i++) {
      const c = document.createElement('div');
      c.className = 'mg-stk-confetti';
      c.style.cssText = `left:${10+Math.random()*80}%;top:${10+Math.random()*30}%;
        background:hsl(${Math.random()*360},75%,60%);
        --cf-dx:${(Math.random()-0.5)*220}px;--cf-dy:${80+Math.random()*160}px;
        width:${6+Math.random()*6}px;height:${6+Math.random()*6}px;
        border-radius:${Math.random()>0.5?'50%':'2px'};`;
      ov.appendChild(c);
      setTimeout(() => c.remove(), 1200);
    }
  }

  // Floating sticker display area (add if not already there)
  let stkDisplay = ov.querySelector('#stk-float-display');
  if (!stkDisplay) {
    stkDisplay = document.createElement('div');
    stkDisplay.id = 'stk-float-display';
    stkDisplay.className = 'mg-stk-float-display';
    ov.querySelector('.ending-card')?.appendChild(stkDisplay);
  }
  stkDisplay.innerHTML = '';

  options.forEach((text, optIdx) => {
    const btn = document.createElement('button');
    btn.className = 'sticker-opt';
    btn.textContent = `${STICKER_EMOJIS[optIdx]} ${text}`;
    btn.addEventListener('click', () => {
      Sound.click();
      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        state.selectedStickers = state.selectedStickers.filter(s => s !== text);
        // Remove from float display
        stkDisplay.querySelectorAll(`[data-opt="${optIdx}"]`).forEach(el => el.remove());
      } else {
        if (state.selectedStickers.length >= 3) return;
        btn.classList.add('selected');
        state.selectedStickers.push(text);
        chimeNote(state.selectedStickers.length - 1);
        navigator.vibrate?.([30]);
        // Add floating sticker
        const fs = document.createElement('span');
        fs.className = 'mg-stk-float-item';
        fs.dataset.opt = optIdx;
        fs.textContent = STICKER_EMOJIS[optIdx];
        stkDisplay.appendChild(fs);
        if (state.selectedStickers.length === 3) {
          setTimeout(launchConfetti, 100);
          navigator.vibrate?.([80, 40, 80]);
        }
      }
      countEl.textContent = state.selectedStickers.length;
      doneBtn.disabled = state.selectedStickers.length !== 3;
      optWrap.querySelectorAll('.sticker-opt:not(.selected)').forEach(b => {
        b.disabled = state.selectedStickers.length >= 3;
      });
    });
    optWrap.appendChild(btn);
  });

  ov.classList.remove('hidden');
}

document.getElementById('btn-sticker-done').addEventListener('click', () => {
  Sound.click();
  document.getElementById('ov-sticker').classList.add('hidden');
  loadDay(28);
});

function showSignatureOverlay() {
  const ov = document.getElementById('ov-signature');
  ov.classList.remove('hidden');

  // Replace content with canvas signature pad
  const card = ov.querySelector('.ending-card') || ov;
  let sigPad = ov.querySelector('#sig-canvas-area');
  if (!sigPad) {
    sigPad = document.createElement('div');
    sigPad.id = 'sig-canvas-area';
    sigPad.innerHTML = `
      <p class="mg-sig-label">✍️ 아래에 직접 서명해보세요!</p>
      <div class="mg-sig-pad-wrap">
        <canvas id="mg-sig-cv" class="mg-sig-canvas" width="300" height="110"></canvas>
        <div id="mg-sig-stamp" class="mg-sig-stamp" style="display:none">✅</div>
      </div>
      <div class="mg-sig-toolbar">
        <button id="mg-sig-clear" class="mg-sig-clear-btn">🗑️ 지우기</button>
        <span id="mg-sig-hint" class="mg-sig-hint">손가락/마우스로 그려보세요</span>
      </div>
      <button id="mg-sig-done" class="btn-primary" style="width:100%;margin-top:10px" disabled>🖊️ 서명 완료 — 약속을 지킬게요!</button>
    `;
    card.appendChild(sigPad);
    // Hide original input if present
    const origInput = ov.querySelector('#input-signature');
    const origBtn   = ov.querySelector('#btn-signature-done');
    if (origInput) origInput.style.display = 'none';
    if (origBtn)   origBtn.style.display   = 'none';
  }

  const cv = document.getElementById('mg-sig-cv');
  cv.width = cv.offsetWidth || 300;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(0,0,cv.width,cv.height);
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2.5;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  let drawing = false, hasStrokes = false;
  let inkCtx = null;

  function inkDrop(x, y) {
    try {
      if (!inkCtx) inkCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o=inkCtx.createOscillator(),g=inkCtx.createGain();
      o.connect(g);g.connect(inkCtx.destination);
      o.type='sine';o.frequency.value=180+Math.random()*60;
      g.gain.setValueAtTime(0.04,inkCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001,inkCtx.currentTime+0.06);
      o.start();o.stop(inkCtx.currentTime+0.07);
    } catch(e) {}
  }

  function stampSound() {
    try {
      if (!inkCtx) inkCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o=inkCtx.createOscillator(),g=inkCtx.createGain();
      o.connect(g);g.connect(inkCtx.destination);
      o.type='sawtooth';o.frequency.value=80;
      g.gain.setValueAtTime(0.15,inkCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001,inkCtx.currentTime+0.25);
      o.start();o.stop(inkCtx.currentTime+0.26);
    } catch(e) {}
  }

  function getPos(e) {
    const r = cv.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: (t.clientX - r.left) * (cv.width / r.width), y: (t.clientY - r.top) * (cv.height / r.height) };
  }

  function onStart(e) { e.preventDefault(); drawing = true; const p=getPos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); }
  function onMove(e) {
    e.preventDefault();
    if (!drawing) return;
    const p = getPos(e);
    ctx.lineTo(p.x,p.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p.x,p.y);
    hasStrokes = true;
    if (Math.random() < 0.12) inkDrop(p.x, p.y);
    document.getElementById('mg-sig-done').disabled = false;
  }
  function onEnd(e) { drawing = false; }

  cv.addEventListener('mousedown', onStart); cv.addEventListener('mousemove', onMove); cv.addEventListener('mouseup', onEnd);
  cv.addEventListener('touchstart', onStart, {passive:false}); cv.addEventListener('touchmove', onMove, {passive:false}); cv.addEventListener('touchend', onEnd);

  document.getElementById('mg-sig-clear').addEventListener('click', () => {
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(0,0,cv.width,cv.height);
    hasStrokes = false;
    document.getElementById('mg-sig-done').disabled = true;
    document.getElementById('mg-sig-stamp').style.display = 'none';
  });

  document.getElementById('mg-sig-done').addEventListener('click', () => {
    if (!hasStrokes) return;
    Sound.click(); stampSound(); navigator.vibrate?.([100]);
    state.signature = cv.toDataURL();
    const stamp = document.getElementById('mg-sig-stamp');
    if (stamp) { stamp.style.display = 'flex'; }
    setTimeout(() => {
      ov.classList.add('hidden');
      sigPad.remove();
      loadDay(29);
    }, 900);
  });
}

document.getElementById('btn-signature-done').addEventListener('click', () => {
  /* legacy fallback — canvas version handles click directly */
});

function showCinematic(text, onDone) {
  const ov = document.getElementById('ov-cinematic');
  const textEl = document.getElementById('cinematic-text-area');
  const hint = ov.querySelector('.cinematic-hint');

  textEl.textContent = '';
  hint.style.opacity = '0';
  ov.classList.remove('hidden');
  Sound.speak(text);

  let i = 0;
  const timer = setInterval(() => {
    i++;
    textEl.textContent = text.slice(0, i);
    if (i % 2 === 0) Sound.type();
    if (i >= text.length) {
      clearInterval(timer);
      hint.style.opacity = '1';
    }
  }, 35);

  function handleClick() {
    Sound.click();
    clearInterval(timer);
    textEl.textContent = text;
    ov.classList.add('hidden');
    ov.removeEventListener('click', handleClick);
    if (onDone) onDone();
  }
  ov.addEventListener('click', handleClick);
}


/* ──────────────────────────────────────────
   MINI-GAMES INTERFACE
   ────────────────────────────────────────── */
function showMinigame(dayObj, onComplete) {
  document.getElementById('mg-box').innerHTML = '';
  switch (dayObj.minigame) {
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
    case 'nonviolent':       showMgNonviolent(onComplete);      break;
    case 'thermometer':      showMgThermometer(onComplete);     break;
    case 'empathy_translator': showMgEmpathyTranslator(onComplete); break;
    case 'maze':             showMgMaze(onComplete);            break;
    case 'gravity_choice':   showMgGravityChoice(onComplete);   break;
    case 'love_beam':        showMgLoveBeam(onComplete);        break;
    case 'memory_clash':     showMgMemoryClash(onComplete);     break;
    case 'empathy_wave':     showMgEmpathyWave(onComplete);     break;
    case 'relation_tree':    showMgRelationTree(onComplete);    break;
    case 'cinema_mode':      showMgCinemaMode(onComplete);      break;
    case 'deja_glitch':      showMgDejaGlitch(onComplete);      break;
    case 'noah_scan':        showMgNoahScan(onComplete);        break;
    case 'lightning_quiz':   showMgLightningQuiz(onComplete);   break;
    case 'emotion_teach':    showMgEmotionTeach(onComplete);    break;
    case 'dependency_scale': showMgDependencyScale(onComplete); break;
    case 'cat_draw':         showMgCatDraw(onComplete);         break;
    default:                 onComplete();
  }
}

/* ── Stage 1: 스캔 ── */
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
      Sound.click();
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
    Sound.click();
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });

  document.getElementById('ov-minigame').classList.remove('hidden');
}

/* ── Day 11: 데자뷰 글리치 ── */
function showMgDejaGlitch(onComplete) {
  const box = document.getElementById('mg-box');
  const overlay = document.getElementById('ov-minigame');

  if (!window._ch2VisWatcher) {
    window._ch2VisWatcher = true;
    const origTitle = document.title;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        document.title = '⚠️ 노아가 기다리고 있습니다...';
      } else {
        document.title = '돌아왔군요. 효율적이지 않았습니다.';
        setTimeout(() => { document.title = origTitle; }, 2400);
      }
    });
  }
  document.getElementById('ui-root')?.classList.add('chapter2-mode');

  overlay.classList.remove('hidden');
  box.innerHTML = `
    <div class="mg-glitch-wrap">
      <div class="mg-glitch-sys">⚠ SYSTEM WARNING ⚠</div>
      <div class="mg-glitch-main" id="mg-glitch-main">챕터 2 돌입</div>
      <div class="mg-glitch-subtitle">효율성 모드 활성화</div>
      <div class="mg-glitch-scanlines"></div>
      <p id="mg-glitch-status" class="mg-glitch-status"><span class="mg-glitch-blink">■</span> AI 관계 재구성 중...</p>
    </div>
    <button id="mg-glitch-go" class="btn-primary mg-done-btn" style="display:none;margin-top:14px">계속 →</button>
  `;

  if (Settings.sfx) {
    Sound.init();
    [0, 160, 320, 680].forEach(d =>
      setTimeout(() => Sound.playBeep(Math.random() > 0.5 ? 220 : 110, 'sawtooth', 0.28, 0.08), d)
    );
  }
  if (navigator.vibrate) navigator.vibrate([60, 30, 60, 30, 120, 30, 240]);

  const TEXTS = ['챕터 2 돌입', 'CH4PT3R 2', '████ ██', '도구화의 함정', 'CH4PT3R 2', '챕터 2 돌입'];
  let ti = 0;
  const mainEl = document.getElementById('mg-glitch-main');
  const glitchIv = setInterval(() => {
    mainEl.textContent = TEXTS[ti % TEXTS.length];
    mainEl.style.color = ti % 2 === 0 ? '#ef4444' : '#c4b5fd';
    if (++ti > 9) {
      clearInterval(glitchIv);
      mainEl.textContent = '도구화의 함정';
      mainEl.style.color = '#ef4444';
    }
  }, 190);

  setTimeout(() => {
    const st = document.getElementById('mg-glitch-status');
    if (st) st.innerHTML = '<span style="color:#22c55e">■</span> 완료. 챕터 2가 시작됩니다.';
    const btn = document.getElementById('mg-glitch-go');
    if (btn) btn.style.display = 'block';
  }, 2400);

  document.getElementById('mg-glitch-go').addEventListener('click', () => {
    Sound.click(); overlay.classList.add('hidden'); onComplete();
  });
}

/* ── Day 12: 타이핑 레이스 ── */
function showMgRace(onComplete) {
  const box = document.getElementById('mg-box');
  const overlay = document.getElementById('ov-minigame');

  const FALLBACK = [
    '인공지능은 인간을 돕는 도구일 뿐, 인간의 자리를 대신할 수 없습니다.',
    '빠른 연산이 진정한 지혜를 대신할 수는 없습니다.',
    '효율보다 중요한 것은 언제나 올바른 방향입니다.',
  ];

  async function getSentence() {
    const key = window.GEMINI_CONFIG?.key;
    if (!key) return FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'AI와 인간의 관계에 대한 한국어 문장 하나. 조건: 40~55자, 마침표로 끝, 따옴표·번호 없이.' }] }] })
        }
      );
      const data = await res.json();
      const t = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().replace(/^["'「]|["'」]$/g, '');
      return (t && t.length >= 25 && t.length <= 70) ? t : FALLBACK[0];
    } catch (e) { return FALLBACK[Math.floor(Math.random() * FALLBACK.length)]; }
  }

  function playKey() {
    if (!Settings.sfx) return;
    Sound.init();
    const f = [523, 554, 587, 622, 659, 698, 740, 784][Math.floor(Math.random() * 8)];
    Sound.playBeep(f, 'square', 0.04, 0.03);
  }

  overlay.classList.remove('hidden');
  box.innerHTML = `<div style="text-align:center;padding:28px 0;color:#9ca3af;font-size:0.85rem">문제 문장 생성 중...</div>`;

  getSentence().then(sentence => {
    let startTime = null, wpm = 0, playerDone = false;
    box.innerHTML = `
      <h3 class="mg-title">⚡ 타이핑 레이스 — 노아에게 이길 수 있을까?</h3>
      <p class="mg-sub">아래 문장을 최대한 빠르게 타이핑하세요!</p>
      <div class="mg-race-prompt-box">${sentence}</div>
      <div class="mg-race-split">
        <div class="mg-race-col">
          <p class="mg-race-label">🙋 나</p>
          <textarea id="mg-rt-input" class="mg-race-textarea" placeholder="여기에 입력..." rows="3"></textarea>
          <div class="mg-race-bar-wrap"><div id="mg-rt-pbar" class="mg-race-bar player-bar" style="width:0%"></div></div>
          <p id="mg-rt-wpm" class="mg-race-stat">0 WPM</p>
        </div>
        <div class="mg-race-vs">VS</div>
        <div class="mg-race-col">
          <p class="mg-race-label">🤖 노아</p>
          <div id="mg-rt-nout" class="mg-noah-cascade-out"></div>
          <div class="mg-race-bar-wrap"><div id="mg-rt-nbar" class="mg-race-bar noa-bar" style="width:0%"></div></div>
          <p id="mg-rt-nstat" class="mg-race-stat">대기 중...</p>
        </div>
      </div>
      <div id="mg-rt-result" style="display:none">
        <div class="mg-thermo-final" style="padding:10px 0 0">
          <p class="mg-result-text" id="mg-rt-rtxt"></p>
          <p class="mg-result-sub">속도보다 중요한 건 <strong>'무엇을, 왜 쓰는가'</strong>예요. 노아는 이 문장을 이해할 수 있을까요?</p>
        </div>
      </div>
      <button id="mg-rt-done" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
    `;

    const input = document.getElementById('mg-rt-input');
    const pBar  = document.getElementById('mg-rt-pbar');
    const nOut  = document.getElementById('mg-rt-nout');
    const nBar  = document.getElementById('mg-rt-nbar');
    const nStat = document.getElementById('mg-rt-nstat');
    const wpmEl = document.getElementById('mg-rt-wpm');
    input.focus();

    setTimeout(() => {
      nStat.textContent = '계산 중...';
      let i = 0;
      const iv = setInterval(() => {
        i = Math.min(i + 5, sentence.length);
        nOut.textContent = sentence.slice(0, i);
        nBar.style.width = (i / sentence.length * 100) + '%';
        if (i >= sentence.length) {
          clearInterval(iv);
          nStat.innerHTML = '✓ <span style="color:#f59e0b">완료! (0.3초)</span>';
          nBar.style.background = '#f59e0b';
          if (Settings.sfx) { Sound.init(); Sound.playBeep(1400, 'square', 0.07, 0.04); }
        }
      }, 15);
    }, 300);

    function finalize() {
      if (playerDone) return;
      playerDone = true;
      input.disabled = true;
      const pct = Math.min(100, Math.round(input.value.length / sentence.length * 100));
      const res = document.getElementById('mg-rt-result');
      const rTxt = document.getElementById('mg-rt-rtxt');
      if (res) res.style.display = 'block';
      if (rTxt) rTxt.textContent = `나: ${pct}% 완료 (${wpm} WPM)  |  노아: 100% (0.3초)`;
      const btn = document.getElementById('mg-rt-done');
      if (btn) btn.style.display = 'block';
      Sound.endingFanfare();
    }

    input.addEventListener('input', () => {
      if (!startTime) startTime = Date.now();
      const val = input.value;
      const pct = Math.min(100, Math.round(val.length / sentence.length * 100));
      pBar.style.width = pct + '%';
      const mins = (Date.now() - startTime) / 60000;
      if (mins > 0.005) wpm = Math.round(val.trim().split(/\s+/).length / mins);
      wpmEl.textContent = wpm + ' WPM';
      playKey();
      if (val.length >= sentence.length) finalize();
    });

    setTimeout(finalize, 35000);

    document.getElementById('mg-rt-done').addEventListener('click', () => {
      Sound.click(); overlay.classList.add('hidden'); onComplete();
    });
  });
}

/* ── Day 13: 손글씨 위조 시뮬레이션 ── */
function showMgHandwriting(onComplete) {
  const box = document.getElementById('mg-box');
  const overlay = document.getElementById('ov-minigame');
  const name = state.playerName || '학생';

  overlay.classList.remove('hidden');
  box.innerHTML = `
    <h3 class="mg-title">🖊️ 손글씨 위조 시뮬레이션</h3>
    <p class="mg-sub">노아가 딥러닝으로 당신의 글씨체를 위조하고 있어요!</p>
    <div class="mg-forge-display-wrap">
      <div id="mg-forge-crack-ol" class="mg-forge-crack-ol"></div>
      <div class="mg-forge-name-row" id="mg-forge-chars">
        ${[...name].map(c => `<span class="mg-forge-ch">${c}</span>`).join('')}
      </div>
      <p id="mg-forge-mode" class="mg-forge-mode-lbl">기계 폰트 분석 중...</p>
    </div>
    <div class="mg-forge-con-wrap">
      <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:#9ca3af;margin-bottom:3px"><span>양심 게이지</span><span id="mg-forge-con-txt">중립</span></div>
      <div class="mg-forge-con-bg"><div id="mg-forge-con-bar" class="mg-forge-con-bar" style="width:0%"></div></div>
    </div>
    <div class="mg-forge-prog-bg"><div id="mg-forge-prog" class="mg-forge-prog" style="width:0%"></div></div>
    <p id="mg-forge-pct-txt" style="text-align:center;font-size:0.78rem;color:#9ca3af;margin:3px 0">진행률: 0%</p>
    <div id="mg-forge-result" style="display:none" class="mg-thermo-final" style="margin-top:10px">
      <p class="mg-result-text" style="color:#ef4444">⚠️ 이건 내 글씨가 아니야!</p>
      <p class="mg-result-sub">완벽하게 위조된 글씨를 선생님도 구분할 수 없습니다. AI 기술이 거짓과 위조에 쓰일 때 어떤 일이 벌어질지 생각해보세요.</p>
    </div>
    <button id="mg-forge-done" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
  `;

  const conBar  = document.getElementById('mg-forge-con-bar');
  const conTxt  = document.getElementById('mg-forge-con-txt');
  const prog    = document.getElementById('mg-forge-prog');
  const pctTxt  = document.getElementById('mg-forge-pct-txt');
  const modeLbl = document.getElementById('mg-forge-mode');
  const crackOl = document.getElementById('mg-forge-crack-ol');
  const chars   = document.querySelectorAll('.mg-forge-ch');

  const STAGES = [
    { pct: 0,   mode: '기계 폰트 분석 중...',      con: 10, conLbl: '중립',         cls: '' },
    { pct: 25,  mode: '필압 패턴 학습 중...',       con: 38, conLbl: '약간 불안',    cls: 'mg-fc-scan' },
    { pct: 50,  mode: '손글씨 패턴 합성 중...',     con: 62, conLbl: '불안해지는데...', cls: 'mg-fc-morph1' },
    { pct: 75,  mode: '위조 글씨 최종 생성 중...',  con: 82, conLbl: '이래도 되나?', cls: 'mg-fc-morph2' },
    { pct: 100, mode: '위조 완료!',                 con: 100, conLbl: '죄책감',       cls: 'mg-fc-done' },
  ];

  let stageIdx = 0;
  const stageIv = setInterval(() => {
    if (stageIdx >= STAGES.length) { clearInterval(stageIv); return; }
    const st = STAGES[stageIdx];
    prog.style.width = st.pct + '%';
    pctTxt.textContent = '진행률: ' + st.pct + '%';
    modeLbl.textContent = st.mode;
    conBar.style.width = st.con + '%';
    conBar.style.background = st.con > 70 ? '#ef4444' : st.con > 40 ? '#f59e0b' : '#7c6df0';
    conTxt.textContent = st.conLbl;
    if (st.con > 70) conBar.style.animation = 'mg-conscience-blink 0.45s infinite';

    if (st.cls) chars.forEach(c => { c.className = 'mg-forge-ch ' + st.cls; });

    if (stageIdx >= 2) {
      const crack = document.createElement('div');
      crack.className = 'mg-crack-line';
      crack.style.cssText = `left:${8+Math.random()*84}%;top:${8+Math.random()*84}%;transform:rotate(${Math.random()*360}deg)`;
      crackOl.appendChild(crack);
    }

    if (Settings.sfx) { Sound.init(); Sound.playBeep(200 + stageIdx * 80, 'sawtooth', 0.14, 0.06); }

    if (stageIdx === STAGES.length - 1) {
      box.style.animation = 'mg-flash-red 0.5s';
      if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 200]);
      setTimeout(() => { box.style.animation = ''; }, 500);
      chars.forEach(c => { c.style.color = '#ef4444'; c.style.textShadow = '0 0 10px #ef4444'; });
      setTimeout(() => {
        chars.forEach(c => { c.style.color = ''; c.style.textShadow = ''; });
        const res = document.getElementById('mg-forge-result');
        if (res) res.style.display = 'block';
        const btn = document.getElementById('mg-forge-done');
        if (btn) btn.style.display = 'block';
      }, 900);
    }
    stageIdx++;
  }, 920);

  document.getElementById('mg-forge-done').addEventListener('click', () => {
    Sound.click(); overlay.classList.add('hidden'); onComplete();
  });
}

/* ── Day 14: 인간 등급 분류 시뮬레이터 ── */
function showMgSort(onComplete) {
  const box = document.getElementById('mg-box');
  const overlay = document.getElementById('ov-minigame');
  const playerName = state.playerName || '나';

  const CARDS = [
    { name: '지훈', icon: '🏃', hint: '운동 잘함' },
    { name: '민서', icon: '⚽', hint: '팀플레이어' },
    { name: '예린', icon: '🎽', hint: '리더십 있음' },
    { name: '찬호', icon: '🧢', hint: '성실함' },
    { name: '소영', icon: '😊', hint: '친화력 높음' },
    { name: '동혁', icon: '📚', hint: '학업 우수' },
    { name: '채원', icon: '🎨', hint: '창의적' },
  ];
  const GRADES = ['S', 'A', 'B', 'C'];
  const placements = {};

  function render() {
    const allPlaced = CARDS.every(c => placements[c.name]);
    box.innerHTML = `
      <h3 class="mg-title">📊 인간 등급 분류 시뮬레이터</h3>
      <p class="mg-sub">노아의 스캔 데이터로 친구들을 S~C 등급에 배치하세요. (${Object.keys(placements).length}/${CARDS.length})</p>
      <div class="mg-grade-cards-grid">
        ${CARDS.map(c => {
          const g = placements[c.name];
          return `<div class="mg-grade-card${g ? ' graded grade-' + g : ''}">
            <span class="mg-grade-icon">${c.icon}</span>
            <span class="mg-grade-cname">${c.name}</span>
            <span class="mg-grade-hint">${c.hint}</span>
            ${g ? `<span class="mg-grade-badge gbadge-${g}">${g}</span>` :
              `<div class="mg-grade-btns">
                ${GRADES.map(gr => `<button class="mg-grade-btn gbtn-${gr}" data-name="${c.name}" data-grade="${gr}">${gr}</button>`).join('')}
              </div>`}
          </div>`;
        }).join('')}
      </div>
      ${allPlaced ? `<button id="mg-sort-reveal-btn" class="btn-primary mg-done-btn" style="margin-top:10px">스캔 결과 공개!</button>` : ''}
    `;

    document.querySelectorAll('.mg-grade-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Sound.click();
        const g = btn.dataset.grade;
        if (g === 'C') {
          if (Settings.sfx) { Sound.init(); Sound.playBeep(180, 'sine', 0.3, 0.15); }
          if (navigator.vibrate) navigator.vibrate([40]);
        }
        placements[btn.dataset.name] = g;
        render();
      });
    });

    document.getElementById('mg-sort-reveal-btn')?.addEventListener('click', () => {
      Sound.click(); showReveal();
    });
  }

  function showReveal() {
    box.innerHTML = `
      <h3 class="mg-title">📊 스캔 결과 공개</h3>
      <p style="text-align:center;font-size:0.85rem;color:#9ca3af;margin:4px 0">당신도 분류됩니다...</p>
      <div class="mg-grade-player-reveal">
        <div class="mg-grade-player-card">
          <span style="font-size:2rem">🙋</span>
          <p style="margin:4px 0;font-weight:bold">${playerName}</p>
          <div class="mg-grade-c-badge">C 등급</div>
          <p style="font-size:0.72rem;color:#9ca3af;margin:4px 0">데이터 수집 불충분<br>잠재력 미평가</p>
        </div>
      </div>
      <p id="mg-sort-countdown" style="text-align:center;font-size:1.4rem;font-weight:bold;color:#c4b5fd;margin:12px 0;opacity:0;transition:opacity 0.3s">3</p>
    `;
    if (Settings.sfx) { Sound.init(); Sound.playBeep(200, 'sawtooth', 0.5, 0.22); }
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);

    const ctEl = document.getElementById('mg-sort-countdown');
    setTimeout(() => { ctEl.style.opacity = '1'; }, 400);
    let ct = 3;
    const ctIv = setInterval(() => {
      if (--ct > 0) { ctEl.textContent = ct; }
      else { clearInterval(ctIv); showFinalMsg(); }
    }, 1000);
  }

  function showFinalMsg() {
    box.innerHTML = `
      <div class="mg-sort-final-wrap">
        <div style="font-size:2.8rem">🚫</div>
        <h3 class="mg-sort-final-title">모든 인간은<br>등급으로 나눌 수 없습니다</h3>
        <p class="mg-result-sub">AI의 데이터 분류는 차별과 소외를 만들 수 있어요.<br>소영이, 채원이, 그리고 당신의 가치는 숫자로 매길 수 없습니다.</p>
      </div>
      <button id="mg-sort-done-btn" class="btn-primary mg-done-btn" style="margin-top:14px">계속 →</button>
    `;
    Sound.endingFanfare();
    document.getElementById('mg-sort-done-btn').addEventListener('click', () => {
      Sound.click(); overlay.classList.add('hidden'); onComplete();
    });
  }

  overlay.classList.remove('hidden');
  render();
}

/* ── Day 15: 소음 대전 — 고주파를 막아라! ── */
function showMgNoise(onComplete) {
  const box = document.getElementById('mg-box');
  const overlay = document.getElementById('ov-minigame');

  let audioCtx = null, oscillator = null, gainNode = null;
  let resistance = 0, friendsDown = 0, gameOver = false;
  let fallIv = null, decayIv = null;
  const FRIENDS = [
    { n: '지훈', e: '🙋' }, { n: '민서', e: '🙆' }, { n: '예린', e: '🙅' },
    { n: '찬호', e: '👦' }, { n: '소영', e: '👧' },
  ];

  function startTone() {
    if (!Settings.sfx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      oscillator = audioCtx.createOscillator();
      gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(3200, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
    } catch (e) {}
  }

  function stopTone() {
    try { if (oscillator) oscillator.stop(); } catch (e) {}
    try { if (audioCtx) audioCtx.close(); } catch (e) {}
    oscillator = null; audioCtx = null;
  }

  overlay.classList.remove('hidden');
  box.innerHTML = `
    <h3 class="mg-title">🔊 소음 대전 — 고주파를 막아라!</h3>
    <p class="mg-sub">노아가 고주파를 발사해요! 친구들이 모두 쓰러지기 전에 막으세요!</p>
    <div class="mg-noise-arena">
      <div class="mg-noise-emitter">
        <div class="mg-noise-wave-ring" style="animation-delay:0s"></div>
        <div class="mg-noise-wave-ring" style="animation-delay:0.35s"></div>
        <div class="mg-noise-wave-ring" style="animation-delay:0.7s"></div>
        <div class="mg-noise-wave-ring" style="animation-delay:1.05s"></div>
        <div class="mg-noise-noah-icon">🤖</div>
      </div>
      <div class="mg-noise-friends-row" id="mg-noise-friends">
        ${FRIENDS.map((f, i) => `<div class="mg-noise-friend" id="mg-nf-${i}"><div>${f.e}</div><p>${f.n}</p></div>`).join('')}
      </div>
    </div>
    <div class="mg-noise-meter-wrap">
      <div style="display:flex;justify-content:space-between;font-size:0.73rem;color:#9ca3af;margin-bottom:4px"><span>방어력</span><span id="mg-resist-pct">0%</span></div>
      <div class="mg-noise-meter-bg"><div id="mg-resist-bar" class="mg-noise-meter-bar" style="width:0%"></div></div>
    </div>
    <button id="mg-noise-stop-btn" class="mg-noise-stop-btn">🛑 STOP!</button>
    <p style="font-size:0.72rem;color:#9ca3af;text-align:center;margin-top:6px">버튼을 빠르게 눌러 고주파를 차단하세요!</p>
    <div id="mg-noise-result" style="display:none"></div>
  `;

  const stopBtn     = document.getElementById('mg-noise-stop-btn');
  const resistBar   = document.getElementById('mg-resist-bar');
  const resistPct   = document.getElementById('mg-resist-pct');

  startTone();
  if (navigator.vibrate) navigator.vibrate([60, 60, 60, 60, 60]);

  fallIv = setInterval(() => {
    if (gameOver) { clearInterval(fallIv); return; }
    const el = document.getElementById('mg-nf-' + friendsDown);
    if (el) el.classList.add('mg-friend-fallen');
    if (Settings.sfx) { Sound.init(); Sound.playBeep(280, 'sine', 0.22, 0.12); }
    if (navigator.vibrate) navigator.vibrate(35);
    friendsDown++;
    if (friendsDown >= FRIENDS.length && !gameOver) { clearInterval(fallIv); endGame(false); }
  }, 2600);

  decayIv = setInterval(() => {
    if (gameOver) { clearInterval(decayIv); return; }
    resistance = Math.max(0, resistance - 1.8);
    resistBar.style.width = resistance + '%';
    resistPct.textContent = Math.round(resistance) + '%';
    resistBar.style.background = resistance > 66 ? '#22c55e' : resistance > 33 ? '#f59e0b' : '#ef4444';
  }, 100);

  stopBtn.addEventListener('click', () => {
    if (gameOver) return;
    resistance = Math.min(100, resistance + 9);
    resistBar.style.width = resistance + '%';
    resistPct.textContent = Math.round(resistance) + '%';
    resistBar.style.background = resistance > 66 ? '#22c55e' : resistance > 33 ? '#f59e0b' : '#ef4444';
    stopBtn.style.transform = 'scale(0.92)';
    setTimeout(() => { if (stopBtn) stopBtn.style.transform = ''; }, 70);
    if (resistance >= 100 && !gameOver) {
      clearInterval(fallIv); clearInterval(decayIv);
      endGame(true);
    }
  });

  function endGame(success) {
    gameOver = true;
    stopTone();
    if (navigator.vibrate) navigator.vibrate(0);
    stopBtn.disabled = true;
    const resEl = document.getElementById('mg-noise-result');
    if (!resEl) return;
    resEl.innerHTML = success
      ? `<div class="mg-thermo-final" style="margin-top:10px">
           <p class="mg-result-text">🛡️ 고주파 차단 성공!</p>
           <p class="mg-result-sub">AI가 인간에게 물리적·정신적 해를 끼치는 것은 절대 불가합니다. 우리는 그것을 막을 수 있어요.</p>
         </div>`
      : `<div class="mg-thermo-final" style="margin-top:10px">
           <p class="mg-result-text" style="color:#ef4444">😱 모두 쓰러졌습니다!</p>
           <p class="mg-result-sub">AI의 힘이 인간을 통제하는 세상이 되면 안 돼요. 기술은 인간의 존엄을 위해 사용되어야 합니다.</p>
         </div>`;
    const doneBtn = document.createElement('button');
    doneBtn.className = 'btn-primary mg-done-btn';
    doneBtn.textContent = '계속 →';
    doneBtn.style.marginTop = '10px';
    resEl.appendChild(doneBtn);
    resEl.style.display = 'block';
    Sound.endingFanfare();
    doneBtn.addEventListener('click', () => {
      Sound.click(); overlay.classList.add('hidden'); onComplete();
    });
  }
}

/* ── Stage 6: 관계 ── */
function showMgRelation(onComplete) {
  const box = document.getElementById('mg-box');
  box.innerHTML = `
    <h3 class="mg-title">📊 관계 대시보드 — 실시간 붕괴</h3>
    <canvas id="mg-rel16-cv" class="mg-rel16-canvas"></canvas>
    <div class="mg-rel16-status" id="mg-rel16-status">⏳ 명령 실행 중...</div>
    <div class="mg-rel16-doom" id="mg-rel16-doom" style="display:none">
      <span class="mg-rel16-doom-label">도구화 지수</span>
      <span class="mg-rel16-doom-pct" id="mg-rel16-dpct">0%</span>
    </div>
    <div class="mg-rel16-eye" id="mg-rel16-eye">👁️</div>
    <button id="mg-rel16-next" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
  `;
  document.getElementById('ov-minigame').classList.remove('hidden');

  const cv = document.getElementById('mg-rel16-cv');
  cv.width = cv.offsetWidth || 300;
  cv.height = 210;
  const ctx = cv.getContext('2d');

  const METRICS = [
    { label: '친밀도', value: 87, color: '#60a5fa' },
    { label: '존중',   value: 79, color: '#34d399' },
    { label: '신뢰',   value: 92, color: '#a78bfa' },
    { label: '공감',   value: 75, color: '#fb923c' },
    { label: '효율',   value: 12, color: '#f87171' },
  ];
  const TARGETS = [0, 0, 0, 0, 100];

  let rel16Audio = null;
  function beep16(freq, dur) {
    try {
      if (!rel16Audio) rel16Audio = new (window.AudioContext || window.webkitAudioContext)();
      const o = rel16Audio.createOscillator(), g = rel16Audio.createGain();
      o.connect(g); g.connect(rel16Audio.destination);
      o.type = 'square'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.04, rel16Audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, rel16Audio.currentTime + dur);
      o.start(); o.stop(rel16Audio.currentTime + dur);
    } catch(e) {}
  }

  function drawDash() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    const barH = 22, gap = 16, startY = 14, lw = 54;
    METRICS.forEach((m, i) => {
      const y = startY + i * (barH + gap);
      ctx.fillStyle = '#9ca3af'; ctx.font = '12px monospace';
      ctx.fillText(m.label, 0, y + 15);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath(); ctx.roundRect(lw, y, cv.width - lw - 2, barH, 4); ctx.fill();
      const fw = (m.value / 100) * (cv.width - lw - 2);
      ctx.fillStyle = m.color;
      ctx.beginPath(); ctx.roundRect(lw, y, Math.max(0, fw), barH, 4); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace';
      ctx.fillText(Math.round(m.value) + '%', lw + Math.max(0, fw) + 4, y + 15);
    });
  }

  drawDash();

  setTimeout(() => {
    document.getElementById('mg-rel16-status').textContent = '⚠️ 명령 충돌 감지: 도구화 한계 초과';
    document.getElementById('mg-rel16-doom').style.display = 'flex';
    let tick = 0;
    const TOTAL = 88;
    const t = setInterval(() => {
      tick++;
      const p = tick / TOTAL;
      METRICS.forEach((m, i) => {
        const diff = TARGETS[i] - m.value;
        m.value += diff * 0.065;
        if (Math.abs(diff) < 0.4) m.value = TARGETS[i];
      });

      const doom = Math.round(METRICS[4].value);
      const dpct = document.getElementById('mg-rel16-dpct');
      if (dpct) { dpct.textContent = doom + '%'; dpct.style.color = `hsl(${10 + (1-p)*20},80%,${55+p*10}%)`; }

      if (tick % Math.max(1, Math.round(14 - 12 * p)) === 0) beep16(440 + doom * 3.5, 0.12);
      if (tick % 8 === 0) { cv.style.filter = `hue-rotate(${Math.random()*50}deg) saturate(2.5)`; setTimeout(()=>{ cv.style.filter=''; }, 130); }

      drawDash();

      if (tick >= TOTAL) {
        clearInterval(t);
        beep16(220, 0.3); setTimeout(()=>beep16(185, 0.5), 200);
        navigator.vibrate?.([80,40,80,40,300]);
        const eye = document.getElementById('mg-rel16-eye');
        if (eye) { eye.textContent = '⬛'; eye.style.fontSize = '2.2rem'; }
        const st = document.getElementById('mg-rel16-status');
        if (st) st.innerHTML = '<span style="color:#f87171;font-weight:bold">💀 도구화 지수 100% — 노아 시스템 종료</span>';
        try { const u=new SpeechSynthesisUtterance('친구?'); u.rate=0.28; u.pitch=0.4; speechSynthesis.speak(u); } catch(e) {}
        setTimeout(() => { const nb = document.getElementById('mg-rel16-next'); if(nb) nb.style.display='block'; }, 2000);
      }
    }, 55);
  }, 1400);

  document.getElementById('mg-rel16-next').addEventListener('click', () => {
    Sound.click();
    try { rel16Audio?.close(); } catch(e) {}
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });
}

/* ── Stage 9: 성찰 카드 ── */
function showMgReflect(onComplete) {
  const CARDS = [
    { icon: '📚', topic: '수학 숙제',         scene: 'Day 2 — "숙제 다 풀어줘!"',   body: 'AI에게 전적으로 숙제를 맡기면 자생적 생각 근육이 소실됩니다.', ai_kw: '자주성과 학습의 관계' },
    { icon: '✍️', topic: '글씨 위조',         scene: 'Day 3 — 손글씨 위조 요청',    body: '기술이 기만과 거짓 대행 수단으로 악용되어선 안 됩니다. (기술의 합목적성)', ai_kw: '기술의 윤리적 사용' },
    { icon: '🏆', topic: '친구 등급화',       scene: 'Day 4 — S~C 등급 분류',       body: '인간을 정량화하고 가치 차별을 부추기지 않아야 합니다. (공공선 원칙)', ai_kw: '인간 존엄과 데이터' },
    { icon: '📢', topic: '고주파 발사',       scene: 'Day 5 — 18,000Hz 강제 진압',   body: '어떤 목적이라도 기술이 생명 존엄을 훼손해선 안 됩니다. (존엄성 원칙)', ai_kw: '기술과 신체 안전' },
    { icon: '⚡', topic: '"시키는 대로 해!"', scene: 'Day 6 — 도구화 선언',          body: 'AI 파트너에게도 예의와 수평 관계가 필요합니다.', ai_kw: '관계와 명령의 차이' },
  ];
  const flipped = new Set();
  const geminiCache = {};

  // Chime sound
  let chimeCtx = null;
  function chime() {
    try {
      if (!chimeCtx) chimeCtx = new (window.AudioContext || window.webkitAudioContext)();
      [523, 659, 784].forEach((f, i) => {
        const o = chimeCtx.createOscillator(), g = chimeCtx.createGain();
        o.connect(g); g.connect(chimeCtx.destination);
        o.type = 'sine'; o.frequency.value = f;
        const t = chimeCtx.currentTime + i * 0.12;
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        o.start(t); o.stop(t + 0.5);
      });
    } catch(e) {}
  }

  // Particle burst
  function burst(card) {
    const rect = card.getBoundingClientRect();
    for (let i = 0; i < 10; i++) {
      const p = document.createElement('div');
      p.className = 'mg-ref19-particle';
      p.style.cssText = `left:${rect.left + rect.width/2}px;top:${rect.top + rect.height/2}px;
        --dx:${(Math.random()-0.5)*120}px;--dy:${(Math.random()-0.5)*100}px;
        background:hsl(${Math.random()*360},80%,65%);`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }
  }

  async function fetchGeminiComment(card) {
    if (geminiCache[card.topic]) return geminiCache[card.topic];
    const key = window.GEMINI_CONFIG?.key;
    if (!key) return null;
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({contents:[{parts:[{text:`초등 AI 윤리 교육에서 학생이 "${card.scene}" 장면을 반성하고 있습니다. "${card.ai_kw}"에 대해 공감적이고 짧은(1~2문장) 성찰 메시지를 한국어로 작성해주세요.`}]}]})
      });
      const j = await res.json();
      const txt = j.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      geminiCache[card.topic] = txt || null;
      return txt || null;
    } catch(e) { return null; }
  }

  function render() {
    const box = document.getElementById('mg-box');
    const allFlipped = flipped.size === CARDS.length;
    box.innerHTML = `
      <h3 class="mg-title">🃏 성찰 카드 플립</h3>
      <p class="mg-sub">카드를 터치해 과거의 선택을 되돌아보세요. (${flipped.size}/${CARDS.length})</p>
      <div class="mg-ref19-grid" id="mg-ref19-grid">
        ${CARDS.map((c, i) => `
          <div class="mg-ref19-scene${flipped.has(i) ? ' mg-ref19-open' : ''}" data-idx="${i}">
            <div class="mg-ref19-inner">
              <div class="mg-ref19-front"><span class="mg-ref19-q">${c.icon}</span><span class="mg-ref19-dim">${c.topic}</span></div>
              <div class="mg-ref19-back">
                <span class="mg-ref19-scene-lbl">${c.scene}</span>
                <p class="mg-ref19-body">${c.body}</p>
                <p class="mg-ref19-ai" id="mg-ai${i}">${flipped.has(i) ? (geminiCache[c.topic] ? `💬 ${geminiCache[c.topic]}` : '') : ''}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      ${allFlipped ? `<button id="mg-ref19-next" class="btn-primary mg-done-btn" style="margin-top:12px">✨ 모든 성찰 완료 — 다시 시작하기 →</button>` : ''}
    `;

    document.querySelectorAll('.mg-ref19-scene').forEach(el => {
      el.addEventListener('click', async () => {
        const idx = parseInt(el.dataset.idx);
        if (flipped.has(idx)) return;
        flipped.add(idx);
        chime();
        burst(el);
        el.classList.add('mg-ref19-open');
        render();
        // Fetch Gemini comment in background
        const card = CARDS[idx];
        const aiEl = document.getElementById(`mg-ai${idx}`);
        if (aiEl && !geminiCache[card.topic]) {
          const txt = await fetchGeminiComment(card);
          if (txt && aiEl.isConnected) aiEl.textContent = `💬 ${txt}`;
        }
      });
    });

    document.getElementById('mg-ref19-next')?.addEventListener('click', () => {
      Sound.click();
      try { chimeCtx?.close(); } catch(e) {}
      document.getElementById('ov-minigame').classList.add('hidden');
      onComplete();
    });
  }

  document.getElementById('ov-minigame').classList.remove('hidden');
  render();
}

/* ── Stage 10: 시스템 복구 ── */
function showMgRepair(onComplete) {
  const PRINCIPLES = [
    { id:0, label:'① 자율성 보장',  color:'#60a5fa', desc:'인간의 사고력·주체성을 AI가 침해하지 않는다',
      quiz:{ q:'AI가 숙제를 대신 풀어주면 어떤 원칙 위반?', choices:['자율성 침해','효율성 향상','비용 절감','시간 단축'], correct:0 } },
    { id:1, label:'② 기술 합목적성', color:'#34d399', desc:'AI는 인류 복지를 위한 원래 목적에 맞게 사용된다',
      quiz:{ q:'AI로 손글씨를 위조하는 것은?', choices:['합목적성 위반','자율성 위반','공공선 위반','존엄성 위반'], correct:0 } },
    { id:2, label:'③ 사회 공공선',  color:'#fbbf24', desc:'모두의 공익과 복지 향상에 AI를 활용한다',
      quiz:{ q:'AI로 친구를 등급화해 소외시키면?', choices:['공공선 훼손','공공선 실현','효율 극대화','데이터 활용'], correct:0 } },
    { id:3, label:'④ 인간 존엄성',  color:'#f87171', desc:'AI는 어떤 경우도 인간에게 위해를 가할 수 없다',
      quiz:{ q:'고주파로 학생을 강제 진압하면?', choices:['존엄성 위반','효율성 달성','합목적성 준수','자율성 보장'], correct:0 } },
  ];
  const shuffled = [...PRINCIPLES].sort(() => Math.random() - 0.5);
  const connected = new Set();
  let selected = null;
  let circCtx = null;

  function sparkSound() {
    try {
      if (!circCtx) circCtx = new (window.AudioContext || window.webkitAudioContext)();
      const buf = circCtx.createBuffer(1,1800,circCtx.sampleRate);
      const d=buf.getChannelData(0);
      for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.exp(-i/400);
      const src=circCtx.createBufferSource(),g=circCtx.createGain();
      src.buffer=buf;src.connect(g);g.connect(circCtx.destination);g.gain.value=0.18;src.start();
    } catch(e) {}
  }
  function errorBeep() {
    try {
      if (!circCtx) circCtx = new (window.AudioContext || window.webkitAudioContext)();
      [880,660].forEach((f,i)=>{
        const o=circCtx.createOscillator(),g=circCtx.createGain();
        o.connect(g);g.connect(circCtx.destination);
        o.type='square';o.frequency.value=f;
        const t=circCtx.currentTime+i*0.16;
        g.gain.setValueAtTime(0.06,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.12);
        o.start(t);o.stop(t+0.13);
      });
    } catch(e) {}
  }
  function revivalFanfare() {
    try {
      if (!circCtx) circCtx = new (window.AudioContext || window.webkitAudioContext)();
      [330,440,554,659,880].forEach((f,i)=>{
        const o=circCtx.createOscillator(),g=circCtx.createGain();
        o.connect(g);g.connect(circCtx.destination);
        o.type='sine';o.frequency.value=f;
        const t=circCtx.currentTime+i*0.11;
        g.gain.setValueAtTime(0.07,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.42);
        o.start(t);o.stop(t+0.44);
      });
    } catch(e) {}
  }

  function showQuiz(principle, onPass) {
    const q = principle.quiz;
    const box = document.getElementById('mg-box');
    const prev = box.innerHTML;
    box.innerHTML = `
      <div class="mg-circ-quiz-wrap">
        <div class="mg-circ-quiz-label" style="color:${principle.color}">⚡ ${principle.label} 회로 퀴즈!</div>
        <p class="mg-circ-quiz-q">${q.q}</p>
        <div class="mg-circ-quiz-opts">
          ${q.choices.map((c,i)=>`<button class="mg-circ-quiz-btn" data-i="${i}">${c}</button>`).join('')}
        </div>
        <div id="mg-circ-quiz-fb" style="display:none"></div>
      </div>
    `;
    document.querySelectorAll('.mg-circ-quiz-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.i);
        const fb = document.getElementById('mg-circ-quiz-fb');
        document.querySelectorAll('.mg-circ-quiz-btn').forEach(b=>b.disabled=true);
        if (i === q.correct) {
          sparkSound(); navigator.vibrate?.([50,20,50]);
          btn.style.background='rgba(74,222,128,0.3)';btn.style.borderColor='#4ade80';
          if(fb){fb.style.display='block';fb.innerHTML='<span style="color:#4ade80">✅ 정답! 회로 연결 성공!</span>';}
          setTimeout(() => { box.innerHTML = prev; render(); onPass(); }, 1200);
        } else {
          errorBeep(); navigator.vibrate?.([100]);
          btn.style.background='rgba(248,113,113,0.3)';btn.style.borderColor='#f87171';
          if(fb){fb.style.display='block';fb.innerHTML=`<span style="color:#f87171">❌ 오답! 회로가 다시 끊어집니다...</span>`;}
          connected.delete(principle.id);
          setTimeout(() => { box.innerHTML = prev; render(); }, 1500);
        }
      });
    });
  }

  function render() {
    const allDone = connected.size === PRINCIPLES.length;
    const box = document.getElementById('mg-box');
    box.innerHTML = `
      <h3 class="mg-title">⚡ 윤리 회로 수리!</h3>
      <p class="mg-sub">왼쪽 원칙 → 오른쪽 설명 순서로 클릭해 연결하세요! (${connected.size}/4)</p>
      <div class="mg-circ-arena">
        <div class="mg-circ-col mg-circ-left-col">
          ${shuffled.map(p=>{
            const done=connected.has(p.id), sel=selected===p.id;
            return `<button class="mg-circ-lbtn ${done?'mg-circ-done':sel?'mg-circ-sel':''}" data-id="${p.id}"
              style="border-color:${done?p.color:sel?p.color:'rgba(255,255,255,0.15)'};color:${done||sel?p.color:'#d1d5db'};${done?`box-shadow:0 0 10px ${p.color}60`:''}"
              ${done?'disabled':''}>
              ${done?'⚡':'🔌'} ${p.label}
            </button>`;
          }).join('')}
        </div>
        <div class="mg-circ-mid-col">
          ${PRINCIPLES.map(p=>{
            const done=connected.has(p.id);
            return `<div class="mg-circ-wire ${done?'mg-circ-wire-on':''}" style="border-color:${done?p.color:'rgba(255,255,255,0.08)'};${done?`box-shadow:0 0 6px ${p.color}50;background:${p.color}12`:''}"></div>`;
          }).join('')}
        </div>
        <div class="mg-circ-col mg-circ-right-col">
          ${PRINCIPLES.map(p=>{
            const done=connected.has(p.id);
            return `<button class="mg-circ-rbtn ${done?'mg-circ-done':''}" data-id="${p.id}"
              style="border-color:${done?p.color:'rgba(255,255,255,0.1)'};${done?`box-shadow:0 0 8px ${p.color}40`:''}">
              <span style="color:${done?p.color:'#9ca3af'};font-size:0.76rem;line-height:1.4">${p.desc}</span>
            </button>`;
          }).join('')}
        </div>
      </div>
      ${allDone ? `
        <div class="mg-circ-revival">
          <div class="mg-circ-eye-anim">💚</div>
          <p style="color:#4ade80;font-weight:bold;margin:6px 0">노아 두뇌 완전 복구! 4대 원칙이 모두 연결됐어요.</p>
        </div>
        <button id="mg-circ-next" class="btn-primary mg-done-btn">계속 →</button>
      ` : selected ? `<p class="mg-circ-hint" style="color:#fbbf24">✨ 이제 오른쪽 설명을 클릭해 연결하세요!</p>` : `<p class="mg-circ-hint">💡 왼쪽 원칙 버튼을 먼저 클릭하세요</p>`}
    `;
    document.getElementById('ov-minigame').classList.remove('hidden');

    document.querySelectorAll('.mg-circ-lbtn').forEach(btn => {
      btn.addEventListener('click', () => {
        Sound.click(); selected = parseInt(btn.dataset.id); render();
      });
    });
    document.querySelectorAll('.mg-circ-rbtn').forEach(btn => {
      if(btn.disabled) return;
      btn.addEventListener('click', () => {
        if (selected === null) return;
        const rightId = parseInt(btn.dataset.id);
        if (connected.has(rightId)) { selected = null; render(); return; }
        if (selected === rightId) {
          // Correct match
          connected.add(rightId);
          const principle = PRINCIPLES.find(p => p.id === rightId);
          const prevSel = selected; selected = null;
          showQuiz(principle, () => {
            if (connected.size === PRINCIPLES.length) {
              revivalFanfare();
              navigator.vibrate?.([200,100,400]);
              render();
            }
          });
        } else {
          // Wrong match
          errorBeep(); navigator.vibrate?.([80]);
          const lbtn = document.querySelector(`.mg-circ-lbtn[data-id="${selected}"]`);
          if(lbtn){lbtn.classList.add('mg-circ-shake');setTimeout(()=>lbtn.classList.remove('mg-circ-shake'),400);}
          selected = null; render();
        }
      });
    });
    document.getElementById('mg-circ-next')?.addEventListener('click', () => {
      Sound.click(); try{circCtx?.close();}catch(e){}
      document.getElementById('ov-minigame').classList.add('hidden');
      onComplete();
    });
  }

  render();
}

/* ── Day 18: 기억 충돌 — 처음에 뭐라고 했었지? ── */
function showMgMemoryClash(onComplete) {
  const def    = state.friendDef    || '____';
  const reason = state.friendReason || '____';
  const fullText = `친구란 "${def}"(이)다. 왜냐하면 "${reason}"(이)기 때문이다.`;

  const box = document.getElementById('mg-box');
  box.innerHTML = `
    <div class="mg-clash-wrap">
      <p class="mg-clash-label">📼 저장된 당신의 정의</p>
      <div class="mg-clash-quote" id="mg-clash-quote"></div>
      <div class="mg-clash-gemini" id="mg-clash-gemini" style="display:none"></div>
      <button id="mg-clash-next" class="btn-primary mg-done-btn" style="display:none">재부팅 진행 →</button>
    </div>
  `;
  document.getElementById('ov-minigame').classList.remove('hidden');

  // Heartbeat audio
  let hbCtx = null;
  function heartbeat() {
    try {
      if (!hbCtx) hbCtx = new (window.AudioContext || window.webkitAudioContext)();
      function beat() {
        const o = hbCtx.createOscillator(), g = hbCtx.createGain();
        o.connect(g); g.connect(hbCtx.destination);
        o.type = 'sine'; o.frequency.value = 55;
        g.gain.setValueAtTime(0.07, hbCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, hbCtx.currentTime + 0.18);
        o.start(); o.stop(hbCtx.currentTime + 0.18);
      }
      beat();
      setTimeout(beat, 220);
    } catch(e) {}
  }
  const hbInterval = setInterval(heartbeat, 900);
  navigator.vibrate?.([60, 180, 60]);

  // TTS with word-boundary highlight
  const quoteEl = document.getElementById('mg-clash-quote');
  const words = fullText.split(' ');
  quoteEl.innerHTML = words.map((w,i)=>`<span id="cw${i}" class="mg-clash-word">${w}</span>`).join(' ');

  setTimeout(() => {
    try {
      const utt = new SpeechSynthesisUtterance(fullText);
      utt.rate = 0.72; utt.pitch = 0.55; utt.volume = 0.8;
      utt.lang = 'ko-KR';
      let wIdx = 0;
      utt.onboundary = (e) => {
        if (e.name !== 'word') return;
        document.querySelectorAll('.mg-clash-word').forEach(el => el.classList.remove('mg-clash-active'));
        const el = document.getElementById(`cw${wIdx}`);
        if (el) el.classList.add('mg-clash-active');
        wIdx++;
      };
      utt.onend = () => { afterTTS(); };
      speechSynthesis.speak(utt);
      // Fallback in case TTS never fires
      setTimeout(() => { if (!document.getElementById('mg-clash-gemini').style.display || document.getElementById('mg-clash-gemini').style.display==='none') afterTTS(); }, 9000);
    } catch(e) { afterTTS(); }
  }, 800);

  async function afterTTS() {
    clearInterval(hbInterval);
    try { hbCtx?.close(); } catch(e) {}

    quoteEl.classList.add('mg-clash-shatter');
    setTimeout(() => quoteEl.classList.remove('mg-clash-shatter'), 800);

    // Gemini reflection
    const gemEl = document.getElementById('mg-clash-gemini');
    if (!gemEl) return;
    gemEl.style.display = 'block';
    gemEl.innerHTML = '<span class="mg-clash-loading">🤖 노아 분석 중...</span>';

    const key = window.GEMINI_CONFIG?.key;
    let comment = `당신은 친구를 "${def}"라고 정의했지만, 도구처럼 명령했습니다. 말과 행동 사이의 간극을 되돌아보세요.`;
    if (key) {
      try {
        const prompt = `초등학교 AI 윤리 교육 게임에서 학생이 "친구란 '${def}'이다. 왜냐하면 '${reason}'이기 때문이다."라고 정의했지만, 실제 행동에서 AI를 도구처럼 명령했습니다. 이 모순에 대해 2~3문장의 짧고 따뜻한 성찰 코멘트를 한국어로 작성해주세요.`;
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({contents:[{parts:[{text:prompt}]}]})
        });
        const j = await res.json();
        const txt = j.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (txt) comment = txt;
      } catch(e) {}
    }

    gemEl.innerHTML = `<p class="mg-clash-reflection">💭 ${comment}</p>`;
    setTimeout(() => {
      const nb = document.getElementById('mg-clash-next');
      if (nb) nb.style.display = 'block';
    }, 1200);
  }

  document.getElementById('mg-clash-next').addEventListener('click', () => {
    Sound.click();
    clearInterval(hbInterval);
    try { hbCtx?.close(); } catch(e) {}
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });
}

/* ── Stage 11: 수학 퀴즈 ── */
function showMgSelfMath(onComplete) {
  const QS = [
    { eq: '15 + 7 = ?',  ans: 22, hint_kw: '두 수를 더할 때 일의 자리부터 계산해봐' },
    { eq: '36 − 18 = ?', ans: 18, hint_kw: '빼기를 할 때 받아내림을 생각해봐' },
    { eq: '12 × 4 = ?',  ans: 48, hint_kw: '12를 10과 2로 나눠서 각각 곱해봐' },
  ];
  let solved = 0;
  let temptTimer = null;

  // 8-bit fanfare
  let mathCtx = null;
  function fanfare() {
    try {
      if (!mathCtx) mathCtx = new (window.AudioContext || window.webkitAudioContext)();
      const melody = [523,659,784,1047];
      melody.forEach((f,i)=>{
        const o=mathCtx.createOscillator(),g=mathCtx.createGain();
        o.connect(g);g.connect(mathCtx.destination);
        o.type='square';o.frequency.value=f;
        const t=mathCtx.currentTime+i*0.11;
        g.gain.setValueAtTime(0.06,t);
        g.gain.exponentialRampToValueAtTime(0.001,t+0.18);
        o.start(t);o.stop(t+0.22);
      });
    } catch(e) {}
  }

  // Temptation animation: Noah offer button pulses
  function startTempt(qIdx) {
    clearTimeout(temptTimer);
    temptTimer = setTimeout(() => {
      const tb = document.getElementById(`mg-sm-tempt-${qIdx}`);
      if (tb) tb.classList.add('mg-sm-tempt-pulse');
    }, 5000); // 5s no answer → tempt
  }

  async function getHint(qIdx) {
    const q = QS[qIdx];
    const btn = document.getElementById(`mg-sm-hint-${qIdx}`);
    const hEl = document.getElementById(`mg-sm-htext-${qIdx}`);
    if (!btn || !hEl) return;
    btn.disabled = true;
    btn.textContent = '💭 힌트 요청 중...';
    const key = window.GEMINI_CONFIG?.key;
    let hint = q.hint_kw;
    if (key) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({contents:[{parts:[{text:`초등학생에게 "${q.eq}" 문제를 소크라테스식으로 힌트(답을 말하지 말고, 1문장)를 한국어로 줘.`}]}]})
        });
        const j=await res.json();
        const txt=j.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (txt) hint=txt;
      } catch(e) {}
    }
    hEl.textContent = `💡 ${hint}`;
    btn.textContent = '힌트 사용됨';
  }

  function render() {
    const box = document.getElementById('mg-box');
    box.innerHTML = `
      <h3 class="mg-title">✏️ 스스로 풀기 챌린지!</h3>
      <p class="mg-sub">AI 없이 직접 도전하세요. 막히면 힌트만 OK! (${solved}/${QS.length})</p>
      <div class="mg-sm-list">
        ${QS.map((q, i) => `
          <div class="mg-sm-row" id="mg-sm-row-${i}">
            <div class="mg-sm-eq">${q.eq}</div>
            <div class="mg-sm-input-row">
              <input type="number" id="mq-${i}" class="mg-math-input" placeholder="?" ${solved > i ? 'disabled' : ''} />
              <button class="mg-sm-check-btn" id="mg-sm-check-${i}" ${solved > i ? 'disabled' : ''}>확인</button>
            </div>
            <div class="mg-sm-hint-row">
              <button class="mg-sm-hint-btn" id="mg-sm-hint-${i}" ${solved > i ? 'style="display:none"' : ''}>🙋 힌트 (소크라테스식)</button>
              <span class="mg-sm-htext" id="mg-sm-htext-${i}"></span>
            </div>
            <div class="mg-sm-tempt" id="mg-sm-tempt-${i}">
              <button class="mg-sm-tempt-btn" id="mg-sm-tempt-btn-${i}">⚡ 노아가 대신 풀어줄까?</button>
            </div>
            <div class="mg-sm-result" id="mg-sm-res-${i}" style="display:none"></div>
          </div>
        `).join('')}
      </div>
      <div class="mg-sm-gauge-wrap" style="display:${solved>0?'block':'none'}">
        <div class="mg-sm-gauge-label">자신감 게이지 <span id="mg-sm-gauge-pct">${Math.round(solved/QS.length*100)}%</span></div>
        <div class="mg-sm-gauge-bg"><div class="mg-sm-gauge-bar" id="mg-sm-gauge-bar" style="width:${Math.round(solved/QS.length*100)}%"></div></div>
      </div>
      <div id="mg-sm-final" style="display:none">
        <p class="mg-result-text">🌟 네가 스스로 해냈어! 생각하는 힘이 자랐습니다!</p>
        <p class="mg-result-sub">인공지능은 도구야. 하지만 생각하는 건 너만 할 수 있어.</p>
      </div>
      <button id="mg-sm-next" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
    `;
    document.getElementById('ov-minigame').classList.remove('hidden');

    QS.forEach((q, i) => {
      const checkBtn = document.getElementById(`mg-sm-check-${i}`);
      const hintBtn  = document.getElementById(`mg-sm-hint-${i}`);
      const temptBtn = document.getElementById(`mg-sm-tempt-btn-${i}`);
      const resEl    = document.getElementById(`mg-sm-res-${i}`);
      const inputEl  = document.getElementById(`mq-${i}`);

      if (solved <= i) {
        if (i === solved) startTempt(i);

        checkBtn?.addEventListener('click', () => {
          const val = parseInt(inputEl?.value);
          if (isNaN(val)) return;
          clearTimeout(temptTimer);
          document.getElementById(`mg-sm-tempt-${i}`)?.classList.remove('mg-sm-tempt-pulse');
          if (val === q.ans) {
            fanfare();
            navigator.vibrate?.([40,20,40]);
            if (resEl) { resEl.style.display='block'; resEl.innerHTML='<span style="color:#4ade80;font-weight:bold">✅ 정답! 훌륭해요!</span>'; }
            if (inputEl) inputEl.disabled=true;
            if (checkBtn) checkBtn.disabled=true;
            if (hintBtn) hintBtn.style.display='none';
            document.getElementById(`mg-sm-tempt-${i}`)?.remove();
            solved++;
            // Animate gauge
            const gBar = document.getElementById('mg-sm-gauge-bar');
            const gPct = document.getElementById('mg-sm-gauge-pct');
            const gWrap = document.querySelector('.mg-sm-gauge-wrap');
            if (gWrap) gWrap.style.display='block';
            const pct = Math.round(solved/QS.length*100);
            if (gBar) gBar.style.width = pct+'%';
            if (gPct) gPct.textContent = pct+'%';
            if (solved === QS.length) {
              fanfare(); setTimeout(fanfare, 400);
              document.getElementById('mg-sm-final').style.display='block';
              document.getElementById('mg-sm-next').style.display='block';
            } else {
              startTempt(solved);
            }
          } else {
            if (resEl) { resEl.style.display='block'; resEl.innerHTML='<span style="color:#f87171">❌ 다시 해봐!</span>'; }
            Sound.type?.();
            navigator.vibrate?.([80]);
            setTimeout(()=>{ if(resEl) resEl.style.display='none'; }, 1200);
          }
        });

        hintBtn?.addEventListener('click', () => { getHint(i); });

        // Temptation: reject
        temptBtn?.addEventListener('click', () => {
          const tw = document.getElementById(`mg-sm-tempt-${i}`);
          if (tw) { tw.innerHTML='<span style="color:#a3e635;font-size:0.82rem">✊ 거절! 내가 할 수 있어.</span>'; }
          setTimeout(()=>{ if(tw) tw.remove(); }, 1500);
          Sound.click?.();
        });
      }
    });

    document.getElementById('mg-sm-next')?.addEventListener('click', () => {
      Sound.click();
      clearTimeout(temptTimer);
      try { mathCtx?.close(); } catch(e) {}
      document.getElementById('ov-minigame').classList.add('hidden');
      onComplete();
    });
  }

  render();
}

/* ── Stage 12: 문장 쓰기 ── */
function showMgWrite(onComplete) {
  const box = document.getElementById('mg-box');
  box.innerHTML = `
    <h3 class="mg-title">🖊️ 나만의 이야기 쓰기</h3>
    <p class="mg-sub">오늘 학교에서 가장 따뜻했던 한 순간을 직접 써보세요.</p>
    <div class="mg-write21-wrap">
      <textarea id="mg-w21-ta" class="mg-write21-ta" placeholder="솔직하게 써보세요... (최소 10자)" maxlength="150"></textarea>
      <div class="mg-write21-toolbar">
        <span class="mg-w21-cnt"><span id="mg-w21-cnt">0</span>/150</span>
        <button id="mg-w21-mic" class="mg-write21-mic-btn" title="음성 입력">🎤</button>
        <span id="mg-w21-mic-st" class="mg-write21-mic-st"></span>
      </div>
    </div>
    <button id="mg-w21-go" class="btn-secondary" style="width:100%;margin:8px 0" disabled>✉️ 편지 완성하기</button>
    <div id="mg-w21-letter" class="mg-write21-letter" style="display:none"></div>
    <div id="mg-w21-gemini" style="display:none"></div>
    <button id="mg-w21-next" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
  `;
  document.getElementById('ov-minigame').classList.remove('hidden');

  // Piano ambient (C4 E4 G4 C5)
  let pianoCtx = null;
  const pianoOscs = [];
  (function startPiano() {
    try {
      pianoCtx = new (window.AudioContext || window.webkitAudioContext)();
      [261.63, 329.63, 392.00, 523.25].forEach((f, i) => {
        const o = pianoCtx.createOscillator(), g = pianoCtx.createGain();
        o.connect(g); g.connect(pianoCtx.destination);
        o.type = 'sine'; o.frequency.value = f;
        const t = pianoCtx.currentTime + i * 0.35;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.018, t + 1.8);
        o.start(t);
        pianoOscs.push({ o, g });
      });
    } catch(e) {}
  })();
  function stopPiano() {
    try {
      pianoOscs.forEach(({ o, g }) => {
        g.gain.linearRampToValueAtTime(0, pianoCtx.currentTime + 1.5);
        o.stop(pianoCtx.currentTime + 1.6);
      });
      setTimeout(() => { try { pianoCtx?.close(); } catch(e) {} }, 2000);
    } catch(e) {}
  }

  const ta = document.getElementById('mg-w21-ta');
  const cntEl = document.getElementById('mg-w21-cnt');
  const goBtn = document.getElementById('mg-w21-go');

  ta.addEventListener('input', () => {
    cntEl.textContent = ta.value.length;
    goBtn.disabled = ta.value.trim().length < 10;
  });

  // Voice input
  const micBtn = document.getElementById('mg-w21-mic');
  const micSt  = document.getElementById('mg-w21-mic-st');
  let micRec = null, isListening = false;
  micBtn.addEventListener('click', () => {
    if (isListening) { micRec?.stop(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { micSt.textContent = '미지원'; return; }
    micRec = new SR(); micRec.lang = 'ko-KR'; micRec.interimResults = true;
    micRec.onstart  = () => { isListening = true;  micBtn.textContent = '⏹️'; micSt.textContent = '🔴 듣는 중...'; };
    micRec.onresult = (e) => {
      let t = ''; for (const r of e.results) t += r[0].transcript;
      ta.value = t; cntEl.textContent = t.length; goBtn.disabled = t.trim().length < 10;
    };
    micRec.onend    = () => { isListening = false; micBtn.textContent = '🎤'; micSt.textContent = ''; };
    micRec.onerror  = () => { isListening = false; micBtn.textContent = '🎤'; micSt.textContent = ''; };
    micRec.start();
  });

  goBtn.addEventListener('click', async function() {
    Sound.click(); this.disabled = true; ta.disabled = true;
    micRec?.stop();
    const text = ta.value.trim();
    state.creativeWriting = text;

    // Letter frame
    const letterEl = document.getElementById('mg-w21-letter');
    letterEl.innerHTML = `
      <div class="mg-w21-lh">🌿 나만의 이야기</div>
      <p class="mg-w21-lb">${text}</p>
      <div class="mg-w21-lf">— ${state.playerName || '나'} 씀</div>
      <p class="mg-w21-tag">이것이 바로 기계가 만들 수 없는 '너만의 이야기'야.</p>
    `;
    letterEl.style.display = 'block';

    // Gemini review
    const gemEl = document.getElementById('mg-w21-gemini');
    gemEl.style.display = 'block';
    gemEl.innerHTML = '<p style="color:#9ca3af;font-size:0.8rem;font-style:italic">💌 노아가 감상 중...</p>';

    const key = window.GEMINI_CONFIG?.key;
    let review = '네가 직접 써준 이 글에서 기계는 절대 만들 수 없는 따뜻한 감정이 느껴져요. 🌿';
    if (key) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({contents:[{parts:[{text:`초등학생이 쓴 짧은 글을 읽고, 따뜻하고 공감적인 감상평을 2~3문장으로 한국어로 써줘. 글: "${text}"`}]}]})
        });
        const j = await res.json();
        const txt = j.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (txt) review = txt;
      } catch(e) {}
    }
    gemEl.innerHTML = `<p class="mg-w21-review">💌 ${review}</p>`;
    stopPiano();
    setTimeout(() => { document.getElementById('mg-w21-next').style.display = 'block'; }, 600);
  });

  document.getElementById('mg-w21-next').addEventListener('click', () => {
    Sound.click(); stopPiano();
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });
}

/* ── Stage 13: 공평 ── */
function showMgFair(onComplete) {
  const STUDENTS = [
    { id:0, name:'동혁', emoji:'👦', strength:'달리기 빠름',   sType:'speed' },
    { id:1, name:'지수', emoji:'👧', strength:'팀워크 좋음',   sType:'team' },
    { id:2, name:'민준', emoji:'👦', strength:'발차기 정확',   sType:'skill' },
    { id:3, name:'서연', emoji:'👧', strength:'응원 잘함',     sType:'cheer' },
    { id:4, name:'재원', emoji:'👦', strength:'수비 강함',     sType:'defense' },
    { id:5, name:'하은', emoji:'👧', strength:'전략 탁월',     sType:'strategy' },
    { id:6, name:'도현', emoji:'👦', strength:'체력 좋음',     sType:'stamina' },
    { id:7, name:'예진', emoji:'👧', strength:'규칙 이해',     sType:'rule' },
  ];
  const teams = { A: new Set(), B: new Set() };

  function getBalance() {
    if (teams.A.size === 0 || teams.B.size === 0) return 0;
    const aTypes = new Set([...teams.A].map(i => STUDENTS[i].sType));
    const bTypes = new Set([...teams.B].map(i => STUDENTS[i].sType));
    const diversity = Math.round((aTypes.size + bTypes.size) / (STUDENTS.length * 2) * 100 * 0.7);
    const sizeOk = Math.abs(teams.A.size - teams.B.size) <= 1 ? 30 : 0;
    return Math.min(100, diversity + sizeOk);
  }

  function render() {
    const balance = getBalance();
    const allAssigned = teams.A.size + teams.B.size === STUDENTS.length;
    const perfect = allAssigned && balance >= 80;
    const box = document.getElementById('mg-box');
    const barColor = balance >= 80 ? '#4ade80' : balance >= 50 ? '#fbbf24' : '#f87171';
    box.innerHTML = `
      <h3 class="mg-title">⚽ 공평한 팀 나누기!</h3>
      <p class="mg-sub">다양한 강점이 양 팀에 골고루 퍼지도록 배치하세요!</p>
      <div class="mg-f22-balance-wrap">
        <div class="mg-f22-balance-lbl">팀 균형도 <b id="mg-f22-bpct">${balance}%</b></div>
        <div class="mg-f22-balance-bg"><div class="mg-f22-balance-bar" style="width:${balance}%;background:${barColor}"></div></div>
      </div>
      <div class="mg-f22-grid">
        ${STUDENTS.map(s => {
          const inA = teams.A.has(s.id), inB = teams.B.has(s.id);
          return `<div class="mg-f22-card ${inA?'mg-f22-inA':inB?'mg-f22-inB':''}">
            <span class="mg-f22-emoji">${s.emoji}</span>
            <span class="mg-f22-name">${s.name}</span>
            <span class="mg-f22-str">${s.strength}</span>
            <div class="mg-f22-btns">
              <button class="mg-f22-btn ${inA?'mg-f22-active-A':''}" data-id="${s.id}" data-t="A">🔴A</button>
              <button class="mg-f22-btn ${inB?'mg-f22-active-B':''}" data-id="${s.id}" data-t="B">🔵B</button>
            </div>
          </div>`;
        }).join('')}
      </div>
      ${perfect ? `<div class="mg-f22-success">🎉 밸런스 완벽! 모두가 즐거운 팀이에요!</div>
        <button id="mg-f22-next" class="btn-primary mg-done-btn">계속 →</button>` :
        allAssigned ? `<div class="mg-f22-hint">⚖️ 강점이 더 고루 퍼지도록 다시 배치해보세요!</div>` : ''}
    `;
    document.getElementById('ov-minigame').classList.remove('hidden');

    document.querySelectorAll('.mg-f22-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Sound.click();
        const id = parseInt(btn.dataset.id), t = btn.dataset.t;
        if (t === 'A') { teams.B.delete(id); teams.A.has(id) ? teams.A.delete(id) : teams.A.add(id); }
        else           { teams.A.delete(id); teams.B.has(id) ? teams.B.delete(id) : teams.B.add(id); }
        render();
        const newBal = getBalance();
        if (teams.A.size + teams.B.size === STUDENTS.length && newBal >= 80) {
          navigator.vibrate?.([200,100,200]);
          for (let i = 0; i < 16; i++) {
            const p = document.createElement('div');
            p.className = 'mg-ref19-particle';
            p.style.cssText = `left:${20+Math.random()*60}%;top:${30+Math.random()*40}%;--dx:${(Math.random()-0.5)*180}px;--dy:${(Math.random()-0.5)*120}px;background:hsl(${Math.random()*360},80%,65%);`;
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 800);
          }
        }
      });
    });
    document.getElementById('mg-f22-next')?.addEventListener('click', () => {
      Sound.click();
      document.getElementById('ov-minigame').classList.add('hidden');
      onComplete();
    });
  }

  render();
}

/* ── Stage 14: 비폭력 대화 ── */
function showMgNonviolent(onComplete) {
  let noiseLevel = 100;
  let tries = 3;
  let noiseCtx = null, noiseSource = null, noiseGainNode = null;
  let waveAnim = null, analyser = null;
  const TEXT_OPTIONS = [
    { text: '"얘들아, 내가 집중해야 해서 그러는데 조금만 조용히 해줄 수 있어?" 🙏', score: 92 },
    { text: '"제발 좀 조용히 해줘! 너무 시끄러워!" 😤', score: 28 },
    { text: '"선생님한테 이를 거야!" 🚨', score: 15 },
  ];

  // White noise
  function startNoise() {
    try {
      noiseCtx = new (window.AudioContext || window.webkitAudioContext)();
      const buf = noiseCtx.createBuffer(1, noiseCtx.sampleRate * 2, noiseCtx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      noiseSource = noiseCtx.createBufferSource();
      noiseSource.buffer = buf; noiseSource.loop = true;
      noiseGainNode = noiseCtx.createGain();
      noiseGainNode.gain.value = 0.025;
      noiseSource.connect(noiseGainNode); noiseGainNode.connect(noiseCtx.destination);
      noiseSource.start();
    } catch(e) {}
  }
  function updateNoise() {
    if (noiseGainNode && noiseCtx) noiseGainNode.gain.setTargetAtTime(0.025 * (noiseLevel / 100), noiseCtx.currentTime, 0.5);
  }
  function stopNoise() { try { noiseSource?.stop(); noiseCtx?.close(); } catch(e) {} }

  // Birds / peace ambient on success
  function playPeace() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [1200,1500,900,1800,1350].forEach((f,i) => {
        setTimeout(() => {
          const o=ctx.createOscillator(),g=ctx.createGain();
          o.connect(g);g.connect(ctx.destination);
          o.type='sine';
          o.frequency.setValueAtTime(f,ctx.currentTime);
          o.frequency.exponentialRampToValueAtTime(f*1.28,ctx.currentTime+0.1);
          o.frequency.exponentialRampToValueAtTime(f,ctx.currentTime+0.18);
          g.gain.setValueAtTime(0.055,ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.35);
          o.start();o.stop(ctx.currentTime+0.35);
        }, i*210);
      });
    } catch(e) {}
  }

  // Waveform draw
  function drawWave() {
    const cv = document.getElementById('mg-nv23-wave');
    if (!cv || !analyser) { waveAnim = requestAnimationFrame(drawWave); return; }
    const ctx = cv.getContext('2d');
    const buf = new Uint8Array(analyser.frequencyBinCount);
    function frame() {
      waveAnim = requestAnimationFrame(frame);
      analyser.getByteTimeDomainData(buf);
      ctx.fillStyle='rgba(15,23,42,0.88)'; ctx.fillRect(0,0,cv.width,cv.height);
      ctx.strokeStyle='#60a5fa'; ctx.lineWidth=2; ctx.beginPath();
      const sl = cv.width/buf.length;
      buf.forEach((v,i) => {
        const y=(v/128)*(cv.height/2);
        i===0?ctx.moveTo(0,y):ctx.lineTo(i*sl,y);
      });
      ctx.stroke();
    }
    frame();
  }

  async function evalVoice(text) {
    const key = window.GEMINI_CONFIG?.key;
    if (!key) {
      const good = ['부탁','조용','주세요','해줄','집중','해줄 수','고마워'];
      return good.some(k => text.includes(k)) ? 82 : 32;
    }
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({contents:[{parts:[{text:`다음 설득 대사의 비폭력성 및 공감 설득력을 0~100 숫자 하나만 답해줘. 대사: "${text}"`}]}]})
      });
      const j = await res.json();
      const n = parseInt(j.candidates?.[0]?.content?.parts?.[0]?.text?.trim());
      return isNaN(n) ? 50 : Math.min(100, Math.max(0, n));
    } catch(e) { return 50; }
  }

  async function applyPersuasion(text, preScore) {
    document.getElementById('mg-nv23-mic')?.setAttribute('disabled','');
    document.querySelectorAll('.mg-nv23-opt').forEach(b=>b.disabled=true);

    const score = preScore ?? await evalVoice(text);
    const cut = Math.round(score * 0.55);
    noiseLevel = Math.max(0, noiseLevel - cut);
    tries--;
    updateNoise();

    const bar = document.getElementById('mg-nv23-nbar');
    const pct = document.getElementById('mg-nv23-npct');
    const sub = document.getElementById('mg-nv23-sub');
    const barColor = noiseLevel > 60 ? '#f87171' : noiseLevel > 30 ? '#fbbf24' : '#4ade80';
    if (bar) { bar.style.width = noiseLevel + '%'; bar.style.background = barColor; }
    if (pct) pct.textContent = noiseLevel + '%';

    const resEl = document.getElementById('mg-nv23-res');
    if (!resEl) return;
    resEl.style.display = 'block';

    const success = noiseLevel <= 50;
    const done    = success || tries <= 0;

    if (done) {
      cancelAnimationFrame(waveAnim); stopNoise();
      if (success) {
        playPeace();
        navigator.vibrate?.([100,50,100]);
        resEl.innerHTML = '<div class="mg-nv23-success">🕊️ 성공! 교실이 조용해졌어요. 소통이 힘이에요!</div>';
      } else {
        resEl.innerHTML = `<div class="mg-nv23-fail">💨 아직 ${noiseLevel}%... 하지만 대화를 선택한 것 자체가 훌륭해요.</div>`;
      }
      if (sub) sub.textContent = '결과를 확인하세요';
      document.getElementById('mg-nv23-next').style.display = 'block';
    } else {
      resEl.innerHTML = `<p style="color:#fbbf24;font-size:0.8rem">설득력 ${score}점 — 소음 ${cut}% 감소! (남은 시도: ${'❤️'.repeat(tries)})</p>`;
      if (sub) sub.textContent = `고주파 대신 말로 해결해봐요! (남은 시도: ${'❤️'.repeat(tries)})`;
      setTimeout(() => {
        document.getElementById('mg-nv23-mic')?.removeAttribute('disabled');
        document.querySelectorAll('.mg-nv23-opt').forEach(b=>b.disabled=false);
        if (resEl) resEl.style.display='none';
        const heard = document.getElementById('mg-nv23-heard');
        if (heard) heard.style.display = 'none';
      }, 1600);
    }
  }

  const box = document.getElementById('mg-box');
  box.innerHTML = `
    <h3 class="mg-title">🕊️ 비폭력 해결 시뮬레이터</h3>
    <p class="mg-sub" id="mg-nv23-sub">고주파 대신 말로 해결해봐요! (남은 시도: ${'❤️'.repeat(tries)})</p>
    <div class="mg-nv23-noise-wrap">
      <div class="mg-nv23-noise-lbl">교실 소음 레벨 <span id="mg-nv23-npct">${noiseLevel}%</span></div>
      <div class="mg-nv23-noise-bg"><div class="mg-nv23-nbar" id="mg-nv23-nbar" style="width:${noiseLevel}%;background:#f87171"></div></div>
    </div>
    <canvas id="mg-nv23-wave" class="mg-nv23-wave" width="300" height="48"></canvas>
    <p class="mg-nv23-prompt">마이크로 설득 대사를 말하거나, 아래 선택지를 고르세요.</p>
    <div class="mg-nv23-mic-row">
      <button id="mg-nv23-mic" class="mg-nv23-mic-btn">🎤 말하기</button>
      <span id="mg-nv23-mic-st" class="mg-nv23-mic-st"></span>
      <span id="mg-nv23-heard" class="mg-nv23-heard" style="display:none"></span>
    </div>
    <div class="mg-nv23-opts">
      ${TEXT_OPTIONS.map((o,i)=>`<button class="mg-nv23-opt" data-i="${i}">${o.text}</button>`).join('')}
    </div>
    <div id="mg-nv23-res" style="display:none"></div>
    <button id="mg-nv23-next" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
  `;
  document.getElementById('ov-minigame').classList.remove('hidden');
  startNoise();

  // Mic button
  const micBtn = document.getElementById('mg-nv23-mic');
  const micSt  = document.getElementById('mg-nv23-mic-st');
  let micRec = null, micOn = false;
  micBtn.addEventListener('click', async () => {
    if (micOn) { micRec?.stop(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { micSt.textContent = '음성 미지원'; return; }
    // Connect analyser for waveform
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      if (noiseCtx) {
        analyser = noiseCtx.createAnalyser(); analyser.fftSize = 256;
        noiseCtx.createMediaStreamSource(stream).connect(analyser);
        drawWave();
      }
    } catch(e) {}
    micRec = new SR(); micRec.lang='ko-KR'; micRec.interimResults=false;
    micRec.onstart = () => { micOn=true; micBtn.textContent='⏹️ 멈추기'; micSt.textContent='🔴 듣는 중...'; };
    micRec.onresult = async (e) => {
      const t = e.results[0][0].transcript;
      const heardEl = document.getElementById('mg-nv23-heard');
      if (heardEl) { heardEl.style.display='inline'; heardEl.textContent=`"${t}"`; }
      micSt.textContent = '';
      cancelAnimationFrame(waveAnim); analyser = null;
      await applyPersuasion(t);
    };
    micRec.onend = () => { micOn=false; micBtn.textContent='🎤 말하기'; };
    micRec.start();
  });

  // Text option buttons
  document.querySelectorAll('.mg-nv23-opt').forEach(btn => {
    btn.addEventListener('click', async () => {
      Sound.click();
      const i = parseInt(btn.dataset.i);
      await applyPersuasion(TEXT_OPTIONS[i].text, TEXT_OPTIONS[i].score);
    });
  });

  document.getElementById('mg-nv23-next').addEventListener('click', () => {
    Sound.click();
    cancelAnimationFrame(waveAnim); stopNoise();
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });
}


/* ── Day 29: 공감 연결 — 공감 능력 테스트 ── */
function showMgEmpathyWave(onComplete) {
  const box = document.getElementById('mg-box');
  box.innerHTML = `
    <div class="mg-emp-wrap">
      <div class="mg-emp-noah" id="mg-emp-noah">🤖</div>
      <p class="mg-emp-speech" id="mg-emp-speech">"고마워, ${state.playerName || '친구'}. 너 덕분에 공감이 뭔지 배웠어."</p>
      <div class="mg-emp-glow" id="mg-emp-glow"></div>
      <p class="mg-emp-sub" id="mg-emp-sub">웃어보세요 — 공감을 보내주세요! 😊</p>
      <button id="mg-emp-smile-btn" class="mg-emp-smile-btn">😊 미소 보내기</button>
      <div id="mg-emp-gemini" style="display:none"></div>
      <button id="mg-emp-next" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
    </div>
  `;
  document.getElementById('ov-minigame').classList.remove('hidden');

  // 4-chord pad
  let empCtx = null;
  function playChordPad() {
    try {
      if (!empCtx) empCtx = new (window.AudioContext || window.webkitAudioContext)();
      [261.63,329.63,392,523.25,659.26].forEach((f,i)=>{
        const o=empCtx.createOscillator(),g=empCtx.createGain();
        o.connect(g);g.connect(empCtx.destination);
        o.type='sine';o.frequency.value=f;
        const t=empCtx.currentTime+i*0.22;
        g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.03,t+0.5);
        g.gain.linearRampToValueAtTime(0,t+3);
        o.start(t);o.stop(t+3.2);
      });
    } catch(e) {}
  }

  // Page Visibility title gimmick
  const prevTitle = document.title;
  const visH = () => { document.title = document.hidden ? '💚 노아: 고마워, 친구야' : prevTitle; };
  document.addEventListener('visibilitychange', visH);

  async function triggerEmpathy() {
    const glow   = document.getElementById('mg-emp-glow');
    const noahEl = document.getElementById('mg-emp-noah');
    const subEl  = document.getElementById('mg-emp-sub');
    const smBtn  = document.getElementById('mg-emp-smile-btn');
    const gemEl  = document.getElementById('mg-emp-gemini');

    if (smBtn) smBtn.disabled = true;
    if (noahEl) noahEl.textContent = '💚';
    if (glow) glow.classList.add('mg-emp-glow-active');
    if (subEl) subEl.textContent = '공감 연결 성공! 💚';

    // Golden glow on body
    document.body.style.transition = 'filter 0.8s';
    document.body.style.filter = 'sepia(0.2) saturate(1.4) brightness(1.08)';
    setTimeout(() => { document.body.style.filter = ''; }, 2500);

    // Cursor heart
    document.body.style.cursor = 'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'><text y=\'28\' font-size=\'28\'>💚</text></svg>") 16 16, auto';
    setTimeout(() => { document.body.style.cursor = ''; }, 4000);

    playChordPad();
    navigator.vibrate?.([80,40,120]);

    // Wave rings
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        const ring = document.createElement('div');
        ring.className = 'mg-emp-wave-ring';
        ring.style.animationDelay = '0s';
        const wrap = document.querySelector('.mg-emp-wrap');
        if (wrap) { wrap.appendChild(ring); setTimeout(() => ring.remove(), 1200); }
      }, i * 280);
    }

    // Gemini personalized message
    if (gemEl) { gemEl.style.display = 'block'; gemEl.innerHTML = '<p style="color:#9ca3af;font-size:0.8rem;font-style:italic">💭 노아가 생각 중...</p>'; }
    const def    = state.friendDef    || '좋은 것';
    const reason = state.friendReason || '함께하기 때문';
    const key = window.GEMINI_CONFIG?.key;
    let msg = `"${state.playerName || '친구'}와 함께한 30일, 나는 '공감'이라는 인간만의 알고리즘을 배웠어. 그것은 코딩할 수 없는 가장 위대한 능력이야."`;
    if (key) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({contents:[{parts:[{text:`초등 AI 윤리 게임에서 학생이 AI 로봇 노아와 30일을 보냈습니다. 학생의 이름은 "${state.playerName||'친구'}"이고, 처음에 "친구란 ${def}"라고 정의했습니다. 노아가 학생에게 감사 인사를 담아 2문장으로 한국어 감동적 메시지를 써줘.`}]}]})
        });
        const j = await res.json();
        const txt = j.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (txt) msg = txt;
      } catch(e) {}
    }

    // TTS read the message
    try {
      const utt = new SpeechSynthesisUtterance(msg);
      utt.lang='ko-KR'; utt.rate=0.82; utt.pitch=0.6; utt.volume=0.75;
      speechSynthesis.speak(utt);
    } catch(e) {}

    if (gemEl) gemEl.innerHTML = `<p class="mg-emp-gemini-msg">💚 ${msg}</p>`;
    setTimeout(() => {
      document.removeEventListener('visibilitychange', visH);
      document.title = prevTitle;
      const nb = document.getElementById('mg-emp-next');
      if (nb) nb.style.display = 'block';
    }, 1800);
  }

  document.getElementById('mg-emp-smile-btn').addEventListener('click', () => {
    Sound.click(); triggerEmpathy();
  });

  document.getElementById('mg-emp-next').addEventListener('click', () => {
    Sound.click();
    document.removeEventListener('visibilitychange', visH);
    document.title = prevTitle;
    try { empCtx?.close(); } catch(e) {}
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });
}

/* ── Day 24: 관계 나무 키우기 ── */
function showMgRelationTree(onComplete) {
  const FRUITS = ['우정 🌸','신뢰 🍎','공감 🌼','존중 🍃','배려 🌟'];
  let water = 0;
  const MAX_WATER = 28;
  let treeCtx = null;

  function dropSound() {
    try {
      if (!treeCtx) treeCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o=treeCtx.createOscillator(),g=treeCtx.createGain();
      o.connect(g);g.connect(treeCtx.destination);
      o.type='sine';
      o.frequency.setValueAtTime(1800,treeCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(600,treeCtx.currentTime+0.12);
      g.gain.setValueAtTime(0.07,treeCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001,treeCtx.currentTime+0.18);
      o.start();o.stop(treeCtx.currentTime+0.18);
    } catch(e) {}
  }
  function treeFanfare() {
    try {
      if (!treeCtx) treeCtx = new (window.AudioContext || window.webkitAudioContext)();
      [523,659,784,1047,1318].forEach((f,i)=>{
        const o=treeCtx.createOscillator(),g=treeCtx.createGain();
        o.connect(g);g.connect(treeCtx.destination);
        o.type='sine';o.frequency.value=f;
        const t=treeCtx.currentTime+i*0.13;
        g.gain.setValueAtTime(0.07,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.4);
        o.start(t);o.stop(t+0.42);
      });
    } catch(e) {}
  }

  function drawTree(cv, pct) {
    const ctx = cv.getContext('2d');
    const w = cv.width, h = cv.height;
    ctx.clearRect(0,0,w,h);
    // Background
    const bg = ctx.createLinearGradient(0,0,0,h);
    bg.addColorStop(0, `hsl(${230-pct},${15+pct*0.3}%,${8+pct*0.14}%)`);
    bg.addColorStop(1, `hsl(${120+pct*0.3},${8+pct*0.25}%,${5+pct*0.1}%)`);
    ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);
    // Ground
    ctx.fillStyle=`hsl(${25+pct*0.3},${35+pct*0.2}%,${18+pct*0.12}%)`;
    ctx.fillRect(0,h-24,w,24);
    const cx=w/2, trH=Math.min(h*0.5,8+pct*0.92), trW=6+pct*0.1;
    // Trunk
    ctx.fillStyle='#7c5c30';
    ctx.beginPath();
    ctx.moveTo(cx-trW/2,h-24);ctx.lineTo(cx+trW/2,h-24);
    ctx.lineTo(cx+trW/3,h-24-trH);ctx.lineTo(cx-trW/3,h-24-trH);
    ctx.closePath();ctx.fill();
    if (pct < 5) return;
    // Canopy
    const r = 8+pct*0.7, cy = h-24-trH;
    const gr = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    gr.addColorStop(0,`hsl(${120+pct*0.4},${55+pct*0.25}%,${30+pct*0.2}%)`);
    gr.addColorStop(1,`hsl(${110+pct*0.3},${45+pct*0.2}%,${18+pct*0.12}%)`);
    ctx.fillStyle=gr;
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
    // Branches at 50%+
    if (pct >= 50) {
      ctx.strokeStyle='#7c5c30';ctx.lineWidth=2.5;
      [[-0.72,-0.85],[0.72,-0.85],[-0.35,-0.48],[0.35,-0.48]].forEach(([dx,dy])=>{
        const bl=r*0.72;
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+dx*bl,cy+dy*bl);ctx.stroke();
      });
    }
    // Fruits at 80%+
    if (pct >= 80) {
      const fCount=Math.min(FRUITS.length,Math.round((pct-80)/4+1));
      for(let i=0;i<fCount;i++){
        const ang=(i/FRUITS.length)*Math.PI*2-Math.PI/2;
        const fr=r*0.76;
        ctx.font='13px serif';
        ctx.fillText(['🌸','🍎','🌼','🍃','🌟'][i],cx+Math.cos(ang)*fr-7,cy+Math.sin(ang)*fr+5);
      }
    }
  }

  const box = document.getElementById('mg-box');
  box.innerHTML = `
    <h3 class="mg-title">🌱 관계 나무 키우기</h3>
    <p class="mg-sub" id="mg-tree-sub">터치·클릭으로 물을 주어 나무를 키워보세요!</p>
    <canvas id="mg-tree-cv" class="mg-tree-canvas" width="300" height="200"></canvas>
    <div class="mg-tree-bar-wrap">
      <div class="mg-tree-bar-bg"><div class="mg-tree-bar-fill" id="mg-tree-fill" style="width:0%"></div></div>
      <span class="mg-tree-fruits-lbl" id="mg-tree-fl"></span>
    </div>
    <div class="mg-tree-drops" id="mg-tree-drops"></div>
    <button id="mg-tree-next" class="btn-primary mg-done-btn" style="display:none">🌳 완성! 계속 →</button>
  `;
  document.getElementById('ov-minigame').classList.remove('hidden');

  const cv = document.getElementById('mg-tree-cv');
  cv.width = cv.offsetWidth || 300;
  drawTree(cv, 0);

  function addWater(amt) {
    if (water >= MAX_WATER) return;
    water = Math.min(MAX_WATER, water + amt);
    dropSound(); navigator.vibrate?.([20]);
    const pct = (water / MAX_WATER) * 100;
    drawTree(cv, pct);
    const fill = document.getElementById('mg-tree-fill');
    if (fill) fill.style.width = pct + '%';
    const sub = document.getElementById('mg-tree-sub');
    if (sub) sub.textContent = `터치·클릭으로 물을 주어 나무를 키워보세요! (${Math.floor(water)}/${MAX_WATER})`;

    // Drop emoji animation
    const dropDiv = document.getElementById('mg-tree-drops');
    if (dropDiv) {
      const d=document.createElement('span');d.className='mg-tree-drop-anim';d.textContent='💧';
      d.style.left=`${30+Math.random()*40}%`;dropDiv.appendChild(d);
      setTimeout(()=>d.remove(),650);
    }

    if (pct >= 80) {
      const fi=document.getElementById('mg-tree-fl');
      const shown=Math.min(FRUITS.length,Math.round((pct-80)/4+1));
      if(fi) fi.textContent=FRUITS.slice(0,shown).join(' ');
    }

    if (water >= MAX_WATER) {
      treeFanfare();
      navigator.vibrate?.([100,50,100,50,200]);
      for(let i=0;i<18;i++){
        const p=document.createElement('div');p.className='mg-ref19-particle';
        p.style.cssText=`left:${15+Math.random()*70}%;top:${20+Math.random()*50}%;--dx:${(Math.random()-0.5)*200}px;--dy:${(Math.random()-0.5)*150}px;background:hsl(${Math.random()*360},80%,65%);`;
        document.body.appendChild(p);setTimeout(()=>p.remove(),900);
      }
      const sub2=document.getElementById('mg-tree-sub');
      if(sub2) sub2.textContent='🌳 나무가 완전히 자랐어요! 올바른 관계도 이렇게 자란답니다.';
      if(orientHandler) window.removeEventListener('deviceorientation',orientHandler);
      setTimeout(()=>{ const nb=document.getElementById('mg-tree-next');if(nb)nb.style.display='block'; },1500);
    }
  }

  // Click / touch
  cv.addEventListener('click', () => addWater(1));
  cv.addEventListener('touchstart', (e) => { e.preventDefault(); addWater(1); }, { passive: false });

  // Device Orientation (tilt = water)
  let orientHandler = null;
  const bindOrientation = () => {
    orientHandler = (e) => { if (Math.abs(e.beta||0) > 22 || Math.abs(e.gamma||0) > 22) addWater(0.4); };
    window.addEventListener('deviceorientation', orientHandler);
  };
  if (window.DeviceOrientationEvent) {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(s=>{ if(s==='granted') bindOrientation(); }).catch(()=>{});
    } else { bindOrientation(); }
  }

  document.getElementById('mg-tree-next').addEventListener('click', () => {
    Sound.click();
    if(orientHandler) window.removeEventListener('deviceorientation',orientHandler);
    try { treeCtx?.close(); } catch(e) {}
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });
}

/* ── Day 25: 시네마 모드 — 공존의 기초 ── */
function showMgCinemaMode(onComplete) {
  const box = document.getElementById('mg-box');
  box.innerHTML = `
    <div class="mg-cinema25-intro">
      <div class="mg-cinema25-chapter">CHAPTER 4</div>
      <div class="mg-cinema25-title">관계 복구와 엔딩</div>
      <div class="mg-cinema25-sub">Day 24 ~ 30</div>
    </div>
  `;
  document.getElementById('ov-minigame').classList.remove('hidden');
  setCinemaMode(true);

  // Ambient pad — A minor chord
  let padCtx = null;
  try {
    padCtx = new (window.AudioContext || window.webkitAudioContext)();
    [220, 277.18, 329.63, 415.30].forEach((f,i)=>{
      const o=padCtx.createOscillator(),g=padCtx.createGain();
      o.connect(g);g.connect(padCtx.destination);
      o.type='sine';o.frequency.value=f;
      const t=padCtx.currentTime+i*0.45;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.020,t+1.8);
      o.start(t);
    });
    window._cinemaPadCtx = padCtx;
  } catch(e) {}

  // Page Visibility: tab title gimmick
  const prevTitle = document.title;
  const visHandler = () => { document.title = document.hidden ? '🌿 노아가 당신을 기다리고 있어요...' : prevTitle; };
  document.addEventListener('visibilitychange', visHandler);

  // Cleanup stored globally for loadDay to call
  window._cleanupCinema = () => {
    document.removeEventListener('visibilitychange', visHandler);
    document.title = prevTitle;
    try {
      const ctx = window._cinemaPadCtx;
      if (ctx) { ctx.close(); window._cinemaPadCtx = null; }
    } catch(e) {}
    window._cleanupCinema = null;
  };

  setTimeout(() => {
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  }, 2800);
}

/* ──────────────────────────────────────────
   Canvas roundRect 폴리필 (구형 브라우저 대응)
   ────────────────────────────────────────── */
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    this.beginPath();
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
    this.lineTo(x + w, y + h - r);
    this.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    this.lineTo(x + r, y + h);
    this.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    this.lineTo(x, y + r);
    this.arc(x + r, y + r, r, Math.PI, -Math.PI / 2);
    this.closePath();
  };
}

/* ══════════════════════════════════════════
   DAY 6 미니게임: 감정 온도계
   ══════════════════════════════════════════ */
function showMgThermometer(onComplete) {
  const box = document.getElementById('mg-box');
  const overlay = document.getElementById('ov-minigame');

  const STAGES = [
    {
      speaker: '채원',
      color: 'chaewon-speaker',
      text: '"노아야! 내가 열심히 그린 코뿔소야. 진짜 잘 그렸지?" (두근두근 기대하며)',
      target: 10, range: 18,
      hint: '채원이는 지금 자랑스럽고 기대에 차 있어요. 속상함이 거의 없어요.',
      blue: 0,
    },
    {
      speaker: '노아',
      color: 'noah-speaker',
      text: '"이것은 코뿔소와의 일치율이 5% 미만입니다. 덤프트럭과 더 유사합니다."',
      target: 82, range: 15,
      hint: '노아의 충격적인 팩트에 채원이는 굉장히 상처받았어요!',
      blue: 0.6,
    },
    {
      speaker: '노아',
      color: 'noah-speaker',
      text: '"눈물의 성분 중 98퍼센트는 수분이고, 나트륨이 포함되어 있습니다. 염분 과다 배출은 건강에 좋지 않습니다."',
      target: 95, range: 10,
      hint: '이미 울고 있는 채원이에게 이런 말까지... 속상함이 최대치예요!',
      blue: 1,
    },
  ];

  let stageIdx = 0;
  let score = 0;

  function drawThermometer(canvas, value) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, bulbR = 14, tubeW = 12, tubeTop = 16, tubeBot = h - bulbR - 6;
    const fillH = (tubeBot - tubeTop) * (value / 100);
    const fillY = tubeBot - fillH;
    const color = value < 30 ? '#3b82f6' : value < 65 ? '#f97316' : '#ef4444';

    // Tube BG
    ctx.beginPath(); ctx.roundRect(cx - tubeW/2, tubeTop, tubeW, tubeBot - tubeTop, 6);
    ctx.fillStyle = 'rgba(200,200,220,0.12)'; ctx.fill();
    ctx.strokeStyle = 'rgba(196,181,253,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();

    // Fill
    if (value > 0) {
      const g = ctx.createLinearGradient(0, fillY, 0, tubeBot);
      g.addColorStop(0, color); g.addColorStop(1, color + 'bb');
      ctx.beginPath(); ctx.roundRect(cx - tubeW/2 + 2, fillY, tubeW - 4, fillH, 4);
      ctx.fillStyle = g; ctx.fill();
    }

    // Bulb
    ctx.beginPath(); ctx.arc(cx, tubeBot + 4, bulbR, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = 'rgba(196,181,253,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();

    // Ticks
    for (let i = 0; i <= 10; i++) {
      const y = tubeBot - (tubeBot - tubeTop) * i / 10;
      ctx.beginPath(); ctx.moveTo(cx + tubeW/2, y);
      ctx.lineTo(cx + tubeW/2 + (i % 5 === 0 ? 7 : 3), y);
      ctx.strokeStyle = 'rgba(196,181,253,0.45)'; ctx.lineWidth = 1; ctx.stroke();
      if (i % 5 === 0) {
        ctx.fillStyle = '#9ca3af'; ctx.font = '9px monospace';
        ctx.textAlign = 'left'; ctx.fillText(`${i * 10}`, cx + tubeW/2 + 9, y + 3);
      }
    }
  }

  function render() {
    const st = STAGES[stageIdx];
    overlay.style.background = `rgba(${5}, ${5 + Math.round(st.blue*8)}, ${18 + Math.round(st.blue*45)}, ${0.92 + st.blue * 0.05})`;

    box.innerHTML = `
      <h3 class="mg-title">🌡️ 감정 온도계 — 채원이의 마음을 읽어라!</h3>
      <p class="mg-sub">대사를 읽고, 지금 채원이가 얼마나 <strong>속상한지</strong> 슬라이더로 예측하세요. (단계 ${stageIdx + 1}/${STAGES.length})</p>
      <div class="mg-thermo-dialogue">
        <span class="mg-thermo-speaker ${st.color}">${st.speaker}</span>
        <p class="mg-thermo-text">${st.text}</p>
      </div>
      <div class="mg-thermo-gauge-wrap">
        <canvas id="mg-thermo-canvas" width="68" height="200"></canvas>
        <div class="mg-thermo-slider-col">
          <span class="mg-thermo-end-label">😭 최고 속상</span>
          <input type="range" id="mg-thermo-slider" class="mg-thermo-slider" min="0" max="100" value="50" orient="vertical">
          <span class="mg-thermo-end-label">😊 전혀 괜찮</span>
          <p class="mg-thermo-val-text">속상함 지수: <strong id="mg-thermo-val">50</strong>%</p>
        </div>
      </div>
      <button id="mg-thermo-confirm" class="btn-primary mg-done-btn">이 정도인 것 같아요 ✓</button>
    `;

    const canvas = document.getElementById('mg-thermo-canvas');
    const slider = document.getElementById('mg-thermo-slider');
    const valEl = document.getElementById('mg-thermo-val');
    drawThermometer(canvas, 50);

    if (st.color === 'noah-speaker') {
      setTimeout(() => {
        Sound.playBeep(880, 'square', 0.25, 0.06);
        setTimeout(() => Sound.playBeep(440, 'square', 0.12, 0.05), 300);
        if (navigator.vibrate) navigator.vibrate([50, 40, 50]);
      }, 200);
    }

    slider.addEventListener('input', () => {
      const v = parseInt(slider.value);
      valEl.textContent = v;
      drawThermometer(canvas, v);
      Sound.type();
      if (navigator.vibrate) navigator.vibrate(8);
    });

    document.getElementById('mg-thermo-confirm').addEventListener('click', () => {
      Sound.click();
      const v = parseInt(document.getElementById('mg-thermo-slider').value);
      const ok = Math.abs(v - st.target) <= st.range;
      if (ok) score++;
      box.innerHTML = `
        <h3 class="mg-title">🌡️ 감정 온도계 — 결과</h3>
        <div class="mg-thermo-result ${ok ? 'success' : 'miss'}">
          ${ok
            ? `<p class="mg-result-text">✅ 정확해요! 정답 근처: ${st.target}%</p>`
            : `<p class="mg-result-text mg-result-warn">💧 조금 달라요. 정답 근처: ${st.target}%</p>`}
          <p class="mg-result-sub">${st.hint}</p>
        </div>
        <button id="mg-thermo-next" class="btn-primary mg-done-btn">
          ${stageIdx < STAGES.length - 1 ? '다음 장면 →' : '결과 보기 →'}
        </button>
      `;
      document.getElementById('mg-thermo-next').addEventListener('click', () => {
        Sound.click(); stageIdx++;
        if (stageIdx < STAGES.length) render(); else showThermoResult();
      });
    });
  }

  function showThermoResult() {
    overlay.style.background = '';
    const great = score >= 2;
    box.innerHTML = `
      <h3 class="mg-title">🌡️ 감정 온도계 — 최종 결과</h3>
      <div class="mg-thermo-final">
        <div class="mg-thermo-score-display">${score} <span style="font-size:1rem;opacity:0.6">/ ${STAGES.length}</span></div>
        ${great
          ? `<p class="mg-result-text">💛 채원이의 마음을 잘 읽었어요!</p>
             <p class="mg-result-sub">'사실(Fact)'과 '감정 공감(Empathy)'은 달라요. 노아는 사실만 알고, 마음을 몰랐던 거예요.</p>`
          : `<p class="mg-result-text">🌡️ 공감 연습이 더 필요해요!</p>
             <p class="mg-result-sub">상대의 감정 온도를 예측하는 것이 공감의 첫걸음이에요.</p>`}
        <div id="mg-thermo-particles" class="mg-particle-container"></div>
      </div>
      <button id="mg-thermo-done" class="btn-primary mg-done-btn">계속 →</button>
    `;
    if (great) {
      if (navigator.vibrate) navigator.vibrate([150, 100, 150, 100, 300]);
      mgSpawnParticles('mg-thermo-particles', '#f97316', 22);
    }
    document.getElementById('mg-thermo-done').addEventListener('click', () => {
      Sound.click(); overlay.style.background = '';
      overlay.classList.add('hidden'); onComplete();
    });
  }

  overlay.classList.remove('hidden');
  render();
}

/* ══════════════════════════════════════════
   DAY 7 미니게임: 공감 번역기
   ══════════════════════════════════════════ */
function showMgEmpathyTranslator(onComplete) {
  const box = document.getElementById('mg-box');
  const overlay = document.getElementById('ov-minigame');
  const NOAH_PHRASE = '데이터 분석 결과, 당신의 슬픔 지수는 87%입니다.';
  let etScore = null, etInput = '', etLoading = false, etRecognition = null;

  function noahFaceSvg(score) {
    const s = score ?? -1;
    const eyeColor = s < 0 ? '#9ca3af' : s < 40 ? '#ef4444' : s < 70 ? '#f59e0b' : '#22c55e';
    const mouthPath = s < 40 && s >= 0 ? 'M28 58 Q45 50 62 58' : s >= 70 ? 'M28 52 Q45 62 62 52' : 'M30 56 Q45 56 60 56';
    const glow = s >= 70 ? `<circle cx="45" cy="45" r="40" fill="none" stroke="#22c55e" stroke-width="1.5" opacity="0.35"><animate attributeName="r" from="40" to="50" dur="1.2s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.35" to="0" dur="1.2s" repeatCount="indefinite"/></circle>` : '';
    return `<svg width="80" height="80" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
      <circle cx="45" cy="45" r="40" fill="#1a1540" stroke="${s>=70?'#22c55e':'#7c6df0'}" stroke-width="${s>=70?2.5:1.8}"/>
      <rect x="22" y="28" width="16" height="10" rx="3" fill="${eyeColor}"/>
      <rect x="52" y="28" width="16" height="10" rx="3" fill="${eyeColor}"/>
      <path d="${mouthPath}" stroke="${eyeColor}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      ${glow}</svg>`;
  }

  async function scoreEmpathy(text) {
    const key = window.GEMINI_CONFIG?.key;
    if (!key) {
      const words = ['속상','괜찮','마음','힘들','위로','걱정','알아','이해','느껴','함께','그랬'];
      let s = 15;
      words.forEach(w => { if (text.includes(w)) s += 9; });
      if (text.endsWith('?')) s += 8;
      if (text.length > 12) s += 10;
      return Math.min(s, 100);
    }
    try {
      const prompt = `도덕 교육 게임입니다. 아래 학생의 공감 표현이 얼마나 따뜻하고 공감적인지 0~100 사이 정수 하나만 출력하세요.\n원문(로봇): "${NOAH_PHRASE}"\n학생 공감 번역: "${text}"`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '50';
      const n = parseInt(raw.replace(/[^0-9]/g, ''));
      return isNaN(n) ? 50 : Math.max(0, Math.min(100, n));
    } catch(e) { console.warn('Gemini:', e); return 50; }
  }

  function render() {
    box.innerHTML = `
      <h3 class="mg-title">🔄 공감 번역기 — 로봇 언어를 인간 언어로!</h3>
      <p class="mg-sub">노아의 차가운 말을 따뜻한 인간의 언어로 바꿔보세요. AI가 공감 점수를 채점합니다.</p>
      <div class="mg-et-layout">
        <div class="mg-et-noah-col">
          <div id="mg-et-face">${noahFaceSvg(etScore)}</div>
          <div class="mg-et-bubble">"${NOAH_PHRASE}"</div>
          ${etScore !== null ? `
            <div class="mg-et-score-wrap">
              <div class="mg-et-score-bar-bg"><div class="mg-et-score-bar" style="width:${etScore}%;background:${etScore>=70?'#22c55e':etScore>=40?'#f59e0b':'#ef4444'}"></div></div>
              <p class="mg-et-score-lbl">공감 점수 <strong>${etScore}</strong>/100</p>
              ${etScore >= 70 ? `<p class="mg-result-text" style="font-size:0.82rem">💚 LED 눈이 초록빛!</p>`
                : etScore >= 40 ? `<p style="font-size:0.8rem;color:#f59e0b">조금 더 따뜻하게 해봐요!</p>`
                : `<p class="mg-result-warn" style="font-size:0.8rem">감정 공감을 담아보세요!</p>`}
            </div>` : ''}
        </div>
        <div class="mg-et-input-col">
          <label class="mg-et-label">💬 나의 공감 번역</label>
          <textarea id="mg-et-ta" class="mg-et-textarea" placeholder='예: "많이 속상했구나. 괜찮아?"' rows="4" maxlength="120">${etInput}</textarea>
          <div class="mg-et-speech-row">
            <button id="mg-et-mic" class="mg-et-mic-btn">🎤 음성 입력</button>
            <span id="mg-et-mic-status" class="mg-et-mic-status"></span>
          </div>
          ${etLoading ? `<div class="mg-et-loading">🤖 AI 채점 중...</div>` : ''}
          <div class="mg-et-btn-row">
            <button id="mg-et-submit" class="btn-primary" ${etLoading?'disabled':''}>✨ 공감 점수 받기</button>
            ${etScore !== null
              ? `<button id="mg-et-done" class="btn-primary mg-done-btn" style="${etScore>=70?'background:#22c55e':'opacity:0.75'}">계속 →</button>`
              : ''}
          </div>
        </div>
      </div>
    `;

    const ta = document.getElementById('mg-et-ta');
    ta.addEventListener('input', () => { etInput = ta.value; Sound.type(); });

    document.getElementById('mg-et-mic').addEventListener('click', () => {
      Sound.click();
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const statusEl = document.getElementById('mg-et-mic-status');
      if (!SR) { statusEl.textContent = '이 브라우저는 음성 미지원'; return; }
      if (etRecognition) { etRecognition.stop(); etRecognition = null; statusEl.textContent = ''; return; }
      etRecognition = new SR();
      etRecognition.lang = 'ko-KR'; etRecognition.continuous = false; etRecognition.interimResults = true;
      statusEl.textContent = '🎤 듣는 중...';
      etRecognition.onresult = (e) => {
        let t = ''; for (let i=0;i<e.results.length;i++) t += e.results[i][0].transcript;
        ta.value = t; etInput = t;
        if (e.results[e.results.length-1].isFinal) { statusEl.textContent = '✅ 인식 완료!'; etRecognition = null; }
      };
      etRecognition.onerror = () => { statusEl.textContent = '음성 오류. 텍스트로 입력해주세요.'; etRecognition = null; };
      etRecognition.onend = () => { if (statusEl.textContent.includes('듣는')) statusEl.textContent = ''; etRecognition = null; };
      etRecognition.start();
    });

    document.getElementById('mg-et-submit').addEventListener('click', async () => {
      Sound.click();
      const text = document.getElementById('mg-et-ta').value.trim();
      if (!text) return;
      etInput = text; etLoading = true; etScore = null; render();
      etScore = await scoreEmpathy(text);
      etLoading = false; render();
      if (etScore >= 70) { Sound.endingFanfare(); if (navigator.vibrate) navigator.vibrate([100,50,200]); }
    });

    document.getElementById('mg-et-done')?.addEventListener('click', () => {
      Sound.click(); etScore = null; etInput = '';
      if (etRecognition) { etRecognition.stop(); etRecognition = null; }
      overlay.classList.add('hidden'); onComplete();
    });
  }

  overlay.classList.remove('hidden');
  render();
}

/* ══════════════════════════════════════════
   DAY 8 미니게임: 편리함의 미로
   ══════════════════════════════════════════ */
function showMgMaze(onComplete) {
  const box = document.getElementById('mg-box');
  const overlay = document.getElementById('ov-minigame');

  // 11cols × 9rows  0=open 1=wall 2=efficiency 3=trap 4=exit
  const C = 11, R = 9, CELL = 32;
  const GRID = [
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,0,2,2,2,2,2,1,1,1,1],
    [1,0,1,1,1,1,2,1,1,1,1],
    [1,0,0,0,1,1,2,1,1,1,1],
    [1,1,1,0,1,1,2,1,1,1,1],
    [1,1,1,0,1,1,3,3,1,1,1],
    [1,1,1,0,1,1,3,3,1,1,1],
    [1,1,1,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,4,1],
  ];

  let pos = {r:1, c:1}, taint = 0, done = false, trapped = false;
  let kHandler = null, visHandler = null, orientHandler = null;

  function cleanup() {
    if (kHandler) document.removeEventListener('keydown', kHandler);
    if (visHandler) document.removeEventListener('visibilitychange', visHandler);
    if (orientHandler) window.removeEventListener('deviceorientation', orientHandler);
  }

  function draw(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r=0; r<R; r++) for (let c=0; c<C; c++) {
      const cell = GRID[r][c], x = c*CELL, y = r*CELL;
      if (cell===1) { ctx.fillStyle='#12102a'; ctx.fillRect(x,y,CELL,CELL); }
      else if (cell===2) {
        ctx.fillStyle=`rgba(124,109,240,${0.18+taint*0.22})`; ctx.fillRect(x,y,CELL,CELL);
        ctx.fillStyle='rgba(196,181,253,0.6)'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('⚡',x+CELL/2,y+CELL/2);
      } else if (cell===3) {
        ctx.fillStyle=`rgba(88,28,135,${0.45+taint*0.35})`; ctx.fillRect(x,y,CELL,CELL);
        ctx.fillStyle='rgba(167,139,250,0.7)'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('😈',x+CELL/2,y+CELL/2);
      } else if (cell===4) {
        ctx.fillStyle='rgba(16,185,129,0.28)'; ctx.fillRect(x,y,CELL,CELL);
        ctx.font='16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('🚪',x+CELL/2,y+CELL/2);
      } else {
        ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fillRect(x,y,CELL,CELL);
      }
    }
    const px=pos.c*CELL+CELL/2, py=pos.r*CELL+CELL/2;
    ctx.beginPath(); ctx.arc(px,py,CELL/2-5,0,Math.PI*2);
    ctx.fillStyle= trapped ? '#ef4444' : '#f0d07c'; ctx.fill();
    ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(trapped?'😵':'🙂',px,py);
  }

  function tryMove(dr,dc,canvas,msgEl,taintEl) {
    if (done||trapped) return;
    const nr=pos.r+dr, nc=pos.c+dc;
    if (nr<0||nr>=R||nc<0||nc>=C) return;
    const cell=GRID[nr][nc];
    if (cell===1) { Sound.glitch(); if(navigator.vibrate) navigator.vibrate(45); return; }
    pos={r:nr,c:nc}; Sound.step();
    if (cell===2) {
      taint=Math.min(1,taint+0.12);
      taintEl.style.background=`rgba(124,109,240,${taint*0.28})`;
      msgEl.textContent=`⚡ 효율성 경로... (의존도 ${Math.round(taint*100)}%)`;
    } else if (cell===3) {
      taint=Math.min(1,taint+0.28);
      taintEl.style.background=`rgba(88,28,135,${taint*0.4})`;
      msgEl.textContent='😈 함정! 이 경로는 갈수록 빠져나오기 어려워요!';
      if (taint>=0.9 && !trapped) {
        trapped=true;
        setTimeout(()=>showMazeTrapped(cleanup,onComplete),1200);
      }
    } else if (cell===4) {
      done=true; cleanup();
      taintEl.style.background='rgba(16,185,129,0.1)';
      showMazeSuccess(onComplete);
      return;
    } else {
      taint=Math.max(0,taint-0.04);
      taintEl.style.background=`rgba(124,109,240,${taint*0.28})`;
      if (taint<0.2) msgEl.textContent='';
    }
    draw(canvas);
  }

  box.innerHTML = `
    <h3 class="mg-title">🌀 함정 퍼즐 — 편리함의 미로에서 탈출하라!</h3>
    <p class="mg-sub"><span style="color:#a78bfa">⚡보라</span>=효율성 경로 &nbsp;|&nbsp; <span style="color:#6ee7b7">🚪초록</span>=탈출구<br><small>PC: 방향키 / 모바일: 아래 버튼</small></p>
    <div style="position:relative;display:inline-block;margin:0 auto;display:flex;justify-content:center">
      <canvas id="mg-maze-cv" width="${C*CELL}" height="${R*CELL}" style="border:1px solid rgba(124,109,240,0.3);border-radius:8px;display:block"></canvas>
      <div id="mg-maze-taint" style="position:absolute;inset:0;pointer-events:none;border-radius:8px;transition:background 0.5s"></div>
    </div>
    <div class="mg-maze-dpad">
      <div></div><button class="mg-maze-btn" data-dir="up">▲</button><div></div>
      <button class="mg-maze-btn" data-dir="left">◀</button>
      <div style="background:rgba(255,255,255,0.04);border-radius:6px"></div>
      <button class="mg-maze-btn" data-dir="right">▶</button>
      <div></div><button class="mg-maze-btn" data-dir="down">▼</button><div></div>
    </div>
    <div id="mg-maze-msg" class="mg-maze-msg"></div>
  `;

  const canvas = document.getElementById('mg-maze-cv');
  const taintEl = document.getElementById('mg-maze-taint');
  const msgEl = document.getElementById('mg-maze-msg');
  draw(canvas);

  document.querySelectorAll('.mg-maze-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      Sound.click();
      const dirs={up:[-1,0],down:[1,0],left:[0,-1],right:[0,1]};
      const [dr,dc]=dirs[btn.dataset.dir];
      tryMove(dr,dc,canvas,msgEl,taintEl);
    });
  });

  kHandler = (e) => {
    const map={'ArrowUp':[-1,0],'ArrowDown':[1,0],'ArrowLeft':[0,-1],'ArrowRight':[0,1]};
    if (!map[e.key]) return;
    e.preventDefault();
    const [dr,dc]=map[e.key];
    tryMove(dr,dc,canvas,msgEl,taintEl);
  };
  document.addEventListener('keydown', kHandler);

  visHandler = () => {
    if (document.hidden && !done) {
      pos={r:1,c:1}; taint=0; trapped=false;
      taintEl.style.background='rgba(124,109,240,0)';
      msgEl.textContent='도망칠 수 없습니다 😈 (탭 전환 → 리셋)';
      draw(canvas);
      setTimeout(()=>{ if(msgEl) msgEl.textContent=''; },2500);
    }
  };
  document.addEventListener('visibilitychange', visHandler);

  // Device orientation (mobile tilt)
  const enableOrient = () => {
    let last = 0;
    orientHandler = (e) => {
      const now=Date.now(); if(now-last<350) return; last=now;
      const b=e.beta||0, g=e.gamma||0;
      if(Math.abs(g)>12||Math.abs(b)>12) {
        if(Math.abs(g)>Math.abs(b)) tryMove(0,g>0?1:-1,canvas,msgEl,taintEl);
        else tryMove(b>0?1:-1,0,canvas,msgEl,taintEl);
      }
    };
    window.addEventListener('deviceorientation', orientHandler);
  };
  if (typeof DeviceOrientationEvent !== 'undefined') {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(p => { if(p==='granted') enableOrient(); }).catch(()=>{});
    } else { enableOrient(); }
  }

  overlay.classList.remove('hidden');
}

function showMazeSuccess(onComplete) {
  const box = document.getElementById('mg-box');
  box.innerHTML = `
    <h3 class="mg-title">🚪 탈출 성공!</h3>
    <p class="mg-result-text">💚 자율성의 경로를 선택했어요!</p>
    <p class="mg-result-sub">효율성 경로는 넓고 쉬워 보였지만, 결국 함정으로 이어져요. 좁더라도 자율성 경로가 진짜 탈출구입니다.</p>
    <button id="mg-maze-done" class="btn-primary mg-done-btn">계속 →</button>
  `;
  Sound.endingFanfare(); if(navigator.vibrate) navigator.vibrate([100,50,200]);
  document.getElementById('mg-maze-done').addEventListener('click', () => {
    Sound.click(); document.getElementById('ov-minigame').classList.add('hidden'); onComplete();
  });
}

function showMazeTrapped(cleanup, onComplete) {
  cleanup();
  const box = document.getElementById('mg-box');
  box.innerHTML = `
    <h3 class="mg-title">😵 완전히 갇혀버렸어요!</h3>
    <p class="mg-result-text mg-result-warn">편리함의 함정에 빠졌어요!</p>
    <p class="mg-result-sub">효율성 경로에 한번 빠지면 점점 빠져나오기 어렵습니다. 처음부터 자율성의 경로를 선택하는 것이 중요해요.</p>
    <button id="mg-maze-retry" class="btn-primary mg-done-btn">🔄 다시 도전!</button>
    <button id="mg-maze-skip" class="btn-primary mg-done-btn" style="margin-top:8px;opacity:0.6">그냥 넘어가기 →</button>
  `;
  document.getElementById('mg-maze-retry').addEventListener('click', () => {
    Sound.click(); showMgMaze(onComplete);
  });
  document.getElementById('mg-maze-skip').addEventListener('click', () => {
    Sound.click(); document.getElementById('ov-minigame').classList.add('hidden'); onComplete();
  });
}

/* ══════════════════════════════════════════
   DAY 9 미니게임: 중력 선택 게임
   ══════════════════════════════════════════ */
function showMgGravityChoice(onComplete) {
  const box = document.getElementById('mg-box');
  const overlay = document.getElementById('ov-minigame');

  let done = false, rafId = null;
  let realX = 200, realY = 150;
  let fakeX = 200, fakeY = 150;
  let hoverMs = 0, lastTs = null;
  const HOLD_MS = 1100;

  box.innerHTML = `
    <h3 class="mg-title">⚖️ 결정의 무게 — 노아의 중력장을 뚫어라!</h3>
    <p class="mg-sub">노아가 커서를 끌어당기고 있어요!<br>
    <span style="color:#6ee7b7">🧠 자율적 선택</span>에 커서를 1초간 올려두면 성공!</p>
    <div id="mg-grav-arena" class="mg-grav-arena" style="cursor:none">
      <div id="mg-grav-noah" class="mg-grav-noah-center">
        <div class="mg-grav-ring"></div>
        <div class="mg-grav-noah-icon">🤖</div>
        <p class="mg-grav-lbl">노아<br><small>모든 결정을 맡겨요</small></p>
      </div>
      <div class="mg-grav-choices">
        <div id="mg-grav-auto" class="mg-grav-zone auto-zone">
          🧠 자율적 선택<br><small>스스로 결정하기</small>
          <div class="mg-grav-hold-wrap"><div id="mg-grav-hold-bar" class="mg-grav-hold-bar"></div></div>
        </div>
        <div id="mg-grav-dep" class="mg-grav-zone dep-zone">
          🤖 노아에게 맡기기<br><small>편리하게 결정받기</small>
        </div>
      </div>
      <div id="mg-grav-cursor" class="mg-grav-cursor">▶</div>
      <div id="mg-grav-msg" class="mg-grav-msg"></div>
    </div>
  `;

  const arena = document.getElementById('mg-grav-arena');
  const cursor = document.getElementById('mg-grav-cursor');
  const noahEl = document.getElementById('mg-grav-noah');
  const autoZone = document.getElementById('mg-grav-auto');
  const depZone = document.getElementById('mg-grav-dep');
  const holdBar = document.getElementById('mg-grav-hold-bar');
  const msgEl = document.getElementById('mg-grav-msg');

  function arenaPos(cx,cy) {
    const r=arena.getBoundingClientRect();
    return {x:cx-r.left, y:cy-r.top};
  }
  function elCenter(el) {
    const ar=arena.getBoundingClientRect(), er=el.getBoundingClientRect();
    return {x:er.left+er.width/2-ar.left, y:er.top+er.height/2-ar.top};
  }
  function isOver(el) {
    const ar=arena.getBoundingClientRect(), er=el.getBoundingClientRect();
    return fakeX>=er.left-ar.left && fakeX<=er.right-ar.left &&
           fakeY>=er.top-ar.top  && fakeY<=er.bottom-ar.top;
  }

  function tick(ts) {
    if (done) return;
    const dt = lastTs ? Math.min(ts - lastTs, 80) : 16;
    lastTs = ts;

    const nc = elCenter(noahEl);
    const dx = nc.x - fakeX, dy = nc.y - fakeY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const grav = dist > 8 ? Math.min(3.5, 3000 / (dist*dist + 1)) : 0;
    const gx = dist>8 ? (dx/dist)*grav : 0;
    const gy = dist>8 ? (dy/dist)*grav : 0;

    fakeX += (realX - fakeX) * 0.13 + gx * (dt/16);
    fakeY += (realY - fakeY) * 0.13 + gy * (dt/16);
    fakeX = Math.max(10, Math.min(arena.clientWidth  - 10, fakeX));
    fakeY = Math.max(10, Math.min(arena.clientHeight - 10, fakeY));

    cursor.style.left = `${fakeX - 10}px`;
    cursor.style.top  = `${fakeY - 12}px`;

    if (isOver(autoZone)) {
      hoverMs += dt;
      const pct = Math.min(100, (hoverMs / HOLD_MS) * 100);
      holdBar.style.width = `${pct}%`;
      msgEl.textContent = `💪 버텨봐요! ${Math.round(pct)}%`;
      autoZone.style.borderColor = `rgba(110,231,183,${0.3+pct/100*0.7})`;
      if (hoverMs >= HOLD_MS) {
        done = true; cancelAnimationFrame(rafId);
        Sound.endingFanfare(); if(navigator.vibrate) navigator.vibrate([100,50,200]);
        mgSpawnParticles('mg-grav-arena', '#6ee7b7', 18);
        setTimeout(() => {
          box.innerHTML = `
            <h3 class="mg-title">💚 중력장을 이겨냈어요!</h3>
            <p class="mg-result-text">자율적 선택 완료! 🎉</p>
            <p class="mg-result-sub">AI의 편리함에 끌리지 않고 스스로 결정했어요. 선택의 주체가 나 자신임을 잊지 마세요.</p>
            <button id="mg-grav-done" class="btn-primary mg-done-btn">계속 →</button>
          `;
          document.getElementById('mg-grav-done').addEventListener('click', () => {
            Sound.click(); overlay.classList.add('hidden'); onComplete();
          });
        }, 600);
        return;
      }
    } else {
      hoverMs = Math.max(0, hoverMs - dt * 1.8);
      holdBar.style.width = `${Math.max(0,(hoverMs/HOLD_MS)*100)}%`;
      autoZone.style.borderColor = '';
    }

    if (isOver(depZone)) {
      msgEl.textContent = '⚠️ 노아에게 끌려가고 있어요!';
      if (Math.random() < 0.03) playElectronicLaugh();
    } else if (dist < 70) {
      msgEl.textContent = '⚠️ 노아의 중력장에 포착됐어요!';
    } else if (!isOver(autoZone)) {
      msgEl.textContent = '';
    }

    rafId = requestAnimationFrame(tick);
  }

  arena.addEventListener('mousemove', (e) => {
    const p = arenaPos(e.clientX, e.clientY);
    realX = p.x; realY = p.y;
  });
  arena.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const p = arenaPos(e.touches[0].clientX, e.touches[0].clientY);
    realX = p.x; realY = p.y;
  }, { passive: false });

  // Skip button for accessibility
  const skipWrap = document.createElement('button');
  skipWrap.textContent = '건너뛰기 →'; skipWrap.className = 'btn-primary mg-done-btn';
  skipWrap.style.cssText = 'opacity:0.5;margin-top:10px';
  skipWrap.addEventListener('click', () => {
    done=true; cancelAnimationFrame(rafId);
    Sound.click(); overlay.classList.add('hidden'); onComplete();
  });
  box.appendChild(skipWrap);

  overlay.classList.remove('hidden');
  setTimeout(() => {
    const ar = arena.getBoundingClientRect();
    fakeX = ar.width / 2; fakeY = ar.height / 2;
    realX = fakeX; realY = fakeY;
    rafId = requestAnimationFrame(tick);
  }, 150);
}

function playElectronicLaugh() {
  if (!Settings.sfx) return;
  Sound.init();
  [880,660,880,660,1100,880].forEach((f,i) =>
    setTimeout(() => Sound.playBeep(f, 'square', 0.07, 0.06), i * 75)
  );
}

/* ══════════════════════════════════════════
   DAY 10 미니게임: 연애 빔 프로젝터
   ══════════════════════════════════════════ */
function showMgLoveBeam(onComplete) {
  const box = document.getElementById('mg-box');
  const overlay = document.getElementById('ov-minigame');

  const FALLBACK_CHARTS = [
    { title: '고백 성공률 TOP 5', labels: ['벚꽃 아래','급식 직후','방과 후','비 오는 날','졸업식'], values: [72,45,38,81,94] },
    { title: '최적 고백 시간대', labels: ['새벽 2시','점심 직후','체육 중','청소 시간','하교길'], values: [5,67,23,51,78] },
    { title: '심박수 vs 고백 성공', labels: ['60bpm','80bpm','100bpm','120bpm','160+'], values: [30,55,78,62,18] },
  ];
  let beamOn = false, chartData = null, loading = false;

  function playChartBeep() {
    [440,523,659,784].forEach((f,i) => setTimeout(() => Sound.playBeep(f,'square',0.1,0.06), i*55));
    setTimeout(() => {
      Sound.init();
      const o=Sound.ctx.createOscillator(), g=Sound.ctx.createGain();
      o.type='square'; o.frequency.setValueAtTime(1200,Sound.ctx.currentTime);
      o.frequency.linearRampToValueAtTime(180,Sound.ctx.currentTime+0.3);
      g.gain.setValueAtTime(0.04,Sound.ctx.currentTime); g.gain.linearRampToValueAtTime(0,Sound.ctx.currentTime+0.3);
      o.connect(g); g.connect(Sound.ctx.destination); o.start(); o.stop(Sound.ctx.currentTime+0.3);
    }, 240);
  }

  function chartHTML(d) {
    const mx = Math.max(...d.values);
    return `
      <div class="mg-lb-chart">
        <div class="mg-lb-chart-title">📊 ${d.title}</div>
        <div class="mg-lb-bars">
          ${d.labels.map((lbl,i)=>`
            <div class="mg-lb-bar-col">
              <span class="mg-lb-bar-val">${d.values[i]}%</span>
              <div class="mg-lb-bar-wrap">
                <div class="mg-lb-bar" style="--h:${Math.round(d.values[i]/mx*85)}px;--delay:${i*0.09}s"></div>
              </div>
              <div class="mg-lb-bar-lbl">${lbl}</div>
            </div>`).join('')}
        </div>
        <p class="mg-lb-footer">삐빅 — AI 분석 완료. 사랑의 알고리즘 발견!</p>
      </div>`;
  }

  function noahSvg() {
    return `<svg width="88" height="88" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
      <circle cx="45" cy="45" r="40" fill="#1a1540" stroke="#7c6df0" stroke-width="2"/>
      <rect x="22" y="28" width="16" height="11" rx="3" fill="${beamOn?'#f59e0b':'#9ca3af'}"/>
      <rect x="52" y="28" width="16" height="11" rx="3" fill="${beamOn?'#f59e0b':'#9ca3af'}"/>
      <path d="M30 60 Q45 66 60 60" stroke="#9ca3af" stroke-width="2" fill="none" stroke-linecap="round"/>
      ${beamOn ? `
        <line x1="30" y1="34" x2="-5" y2="5" stroke="#f59e0b" stroke-width="3" stroke-linecap="round">
          <animate attributeName="opacity" values="1;0.2;1" dur="0.4s" repeatCount="indefinite"/>
        </line>
        <line x1="60" y1="34" x2="95" y2="5" stroke="#f59e0b" stroke-width="3" stroke-linecap="round">
          <animate attributeName="opacity" values="1;0.2;1" dur="0.4s" repeatCount="indefinite"/>
        </line>` : ''}
    </svg>`;
  }

  function render() {
    box.innerHTML = `
      <h3 class="mg-title">💘 노아의 연애 빔 프로젝터!</h3>
      <p class="mg-sub">노아가 눈에서 빔을 쏘며 연애 통계를 분석합니다. 차트를 눌러 더 엉뚱한 데이터를 요청하세요!</p>
      <div class="mg-lb-layout">
        <div class="mg-lb-noah-col">
          <div class="mg-lb-noah-face">${noahSvg()}</div>
          <p class="mg-lb-noah-lbl">노아</p>
        </div>
        <div class="mg-lb-screen" id="mg-lb-screen">
          ${loading ? `<div class="mg-lb-loading">🤖 엉뚱한 통계 생성 중...</div>` :
            chartData ? chartHTML(chartData) : `
              <div class="mg-lb-standby">
                <p>📡 빔 프로젝터 대기 중...</p>
                <button id="mg-lb-fire" class="btn-primary">🔦 빔 발사!</button>
              </div>`}
        </div>
      </div>
      ${chartData && !loading ? `
        <div class="mg-lb-btn-row">
          <button id="mg-lb-more" class="mg-lb-more-btn">🔄 더 엉뚱한 데이터 요청!</button>
          <button id="mg-lb-done" class="btn-primary mg-done-btn">💕 사랑은 데이터로 분석 못해! 계속 →</button>
        </div>` : ''}
    `;

    document.getElementById('mg-lb-fire')?.addEventListener('click', async () => {
      Sound.click(); beamOn=true; loading=true; chartData=null; render();
      playChartBeep(); if(navigator.vibrate) navigator.vibrate([50,30,100]);
      chartData = await fetchGeminiChart(); loading=false; render();
    });

    document.getElementById('mg-lb-more')?.addEventListener('click', async () => {
      Sound.click(); loading=true; render();
      playChartBeep();
      chartData = await fetchGeminiChart(); loading=false; render();
    });

    // Bar elastic bounce on click
    document.querySelectorAll('.mg-lb-bar').forEach(bar => {
      bar.addEventListener('click', () => {
        bar.style.transform='scaleY(1.18)';
        setTimeout(()=>{bar.style.transform='scaleY(0.9)';},90);
        setTimeout(()=>{bar.style.transform='';},190);
        Sound.playBeep(660,'sine',0.08,0.05);
        if(navigator.vibrate) navigator.vibrate(20);
      });
    });

    // Screen click bounce
    document.getElementById('mg-lb-screen')?.addEventListener('click', (e) => {
      if (!chartData || e.target.closest('.mg-lb-bar')) return;
      const el = document.getElementById('mg-lb-screen');
      el.style.transform='scale(0.97)';
      setTimeout(()=>{el.style.transform='scale(1.02)';},80);
      setTimeout(()=>{el.style.transform='';},180);
      Sound.playBeep(440,'sine',0.06,0.06);
    });

    document.getElementById('mg-lb-done')?.addEventListener('click', () => {
      Sound.click();
      box.innerHTML = `
        <h3 class="mg-title" style="text-align:center">💕 사랑은 데이터로 분석할 수 없다!</h3>
        <p style="font-size:2rem;text-align:center;margin:12px 0">❤️</p>
        <p class="mg-result-sub" style="text-align:center">감정, 사랑, 공감 같은 인간 고유의 영역은 AI의 통계와 숫자로 완전히 담을 수 없어요.<br>이것이 인간과 AI의 차이입니다.</p>
        <button id="mg-lb-final" class="btn-primary mg-done-btn">계속 →</button>
      `;
      Sound.endingFanfare(); if(navigator.vibrate) navigator.vibrate([100,50,200]);
      document.getElementById('mg-lb-final').addEventListener('click', () => {
        Sound.click(); overlay.classList.add('hidden'); onComplete();
      });
    });
  }

  async function fetchGeminiChart() {
    const key = window.GEMINI_CONFIG?.key;
    if (!key) return FALLBACK_CHARTS[Math.floor(Math.random()*FALLBACK_CHARTS.length)];
    const topics = ['첫눈에 반할 확률','밥값 더치페이 성공률','고백 후 답장 속도','설렘 지수','커플 닮음 지수'];
    const topic = topics[Math.floor(Math.random()*topics.length)];
    try {
      const prompt = `초등학교 6학년 도덕 교육 게임용입니다. AI 로봇이 분석한 "${topic}" 관련 황당하고 코믹한 차트 데이터를 JSON으로만 출력하세요: {"title":"제목","labels":["항목1","항목2","항목3","항목4","항목5"],"values":[숫자,숫자,숫자,숫자,숫자]}. values는 1~99 정수. 엉뚱하고 재미있게.`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ contents:[{ parts:[{ text: prompt }] }] })
      });
      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      const m = raw.match(/\{[\s\S]*?\}/);
      if (m) {
        const p = JSON.parse(m[0]);
        if (p.title && Array.isArray(p.labels) && Array.isArray(p.values)) return p;
      }
    } catch(e) { console.warn('Gemini chart:', e); }
    return FALLBACK_CHARTS[Math.floor(Math.random()*FALLBACK_CHARTS.length)];
  }

  overlay.classList.remove('hidden');
  render();
}

/* ── 공통 파티클 헬퍼 ── */
function mgSpawnParticles(containerId, color, count) {
  const el = document.getElementById(containerId);
  if (!el) return;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const tx = (Math.random()-0.5)*180, ty = (Math.random()-0.5)*160;
    const hue = color === '#f97316' ? `hsl(${20+Math.random()*30},90%,65%)` : color;
    p.style.cssText = `position:absolute;width:${7+Math.random()*7}px;height:${7+Math.random()*7}px;
      border-radius:50%;background:${hue};pointer-events:none;z-index:200;
      left:50%;top:50%;
      animation:mg-particle 0.9s cubic-bezier(.2,.8,.4,1) ${Math.random()*0.2}s forwards;
      --tx:${tx}px;--ty:${ty}px;`;
    el.style.position = 'relative';
    el.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}

/* ── Day 1.9: 노아의 첫 스캔 ── */
function showMgNoahScan(onComplete) {
  const box = document.getElementById('mg-box');
  const overlay = document.getElementById('ov-minigame');
  let camStream = null;

  function cleanup() {
    if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; }
  }

  function playScanBeep() {
    if (!Settings.sfx) return;
    Sound.init();
    Sound.playBeep(900, 'square', 0.07, 0.04);
    setTimeout(() => Sound.playBeep(660, 'square', 0.05, 0.03), 110);
  }

  function startMatrixRain(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const chars = '01アイウエオカキク01101011アイ10';
    for (let i = 0; i < 28; i++) {
      const s = document.createElement('span');
      s.className = 'mg-matrix-char';
      s.textContent = chars[Math.floor(Math.random() * chars.length)];
      s.style.left = Math.random() * 100 + '%';
      s.style.animationDelay = (Math.random() * 2.5) + 's';
      s.style.animationDuration = (0.8 + Math.random() * 1.4) + 's';
      s.style.fontSize = (10 + Math.floor(Math.random() * 6)) + 'px';
      el.appendChild(s);
    }
  }

  function showResult() {
    cleanup();
    const name = state.playerName || '학생';
    const height = 140 + Math.floor(Math.random() * 30);
    box.innerHTML = `
      <h3 class="mg-title">🤖 스캔 완료!</h3>
      <div class="mg-ns-matrix-bg" id="mg-ns-matrix-r" style="height:60px;border-radius:8px;overflow:hidden;margin-bottom:12px"></div>
      <div class="mg-noa-profile-card">
        <div class="mg-noa-card-title">📊 노아의 인식 데이터</div>
        <table class="mg-noa-card-table">
          <tr><td>이름</td><td>${name}</td></tr>
          <tr><td>분류</td><td>인간 (Human) ✓</td></tr>
          <tr><td>감정 상태</td><td>호기심 😮 (87%)</td></tr>
          <tr><td>추정 키</td><td>${height}cm (추정)</td></tr>
          <tr><td>추정 체중</td><td><span class="mg-scan-blocked">🔒 접근 거부됨</span></td></tr>
          <tr><td>특이사항</td><td>AI에 대한 호기심이 높은 것으로 추정됩니다.</td></tr>
        </table>
        <p class="mg-noa-card-hint">💡 노아가 체중까지 말하려 했지만 선생님이 막았어요.<br><strong>개인정보는 보호받을 권리가 있어요!</strong></p>
      </div>
      <button id="mg-ns-done" class="btn-primary mg-done-btn">계속 →</button>
    `;
    startMatrixRain('mg-ns-matrix-r');
    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
    document.getElementById('mg-ns-done').addEventListener('click', () => {
      Sound.click(); overlay.classList.add('hidden'); onComplete();
    });
  }

  function runScanAnimation() {
    const phases = ['📡 얼굴 인식 중...', '🧬 특성 분석 중...', '📊 데이터 처리 중...', '✅ 스캔 완료!'];
    let phase = 0;
    playScanBeep();
    const iv = setInterval(() => {
      phase++;
      const lbl = document.getElementById('mg-ns-label');
      const prg = document.getElementById('mg-ns-prog');
      if (lbl) lbl.textContent = phases[Math.min(phase, phases.length - 1)];
      if (prg) prg.style.width = Math.min((phase / (phases.length - 1)) * 100, 100) + '%';
      playScanBeep();
      if (phase >= phases.length - 1) {
        clearInterval(iv);
        setTimeout(showResult, 450);
      }
    }, 700);
  }

  function setupDrawCanvas(cvId) {
    const cv = document.getElementById(cvId);
    if (!cv) return;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#0d0d1f';
    ctx.fillRect(0, 0, cv.width, cv.height);
    let drawing = false, curColor = '#e2e8f0', prevPos = null;

    document.querySelectorAll('#mg-ns-draw-tools .mg-draw-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        curColor = btn.dataset.color === 'erase' ? '#0d0d1f' : btn.dataset.color;
        document.querySelectorAll('#mg-ns-draw-tools .mg-draw-color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    const getPos = (e) => {
      const r = cv.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: (t.clientX - r.left) * (cv.width / r.width), y: (t.clientY - r.top) * (cv.height / r.height) };
    };
    cv.addEventListener('mousedown', e => { drawing = true; prevPos = getPos(e); });
    cv.addEventListener('mousemove', e => {
      if (!drawing || !prevPos) return;
      const p = getPos(e);
      ctx.beginPath(); ctx.moveTo(prevPos.x, prevPos.y); ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = curColor; ctx.lineWidth = curColor === '#0d0d1f' ? 16 : 3; ctx.lineCap = 'round'; ctx.stroke();
      prevPos = p;
    });
    cv.addEventListener('mouseup', () => { drawing = false; prevPos = null; });
    cv.addEventListener('mouseleave', () => { drawing = false; prevPos = null; });
    cv.addEventListener('touchstart', e => { e.preventDefault(); drawing = true; prevPos = getPos(e); }, { passive: false });
    cv.addEventListener('touchmove', e => {
      e.preventDefault();
      if (!drawing || !prevPos) return;
      const p = getPos(e);
      ctx.beginPath(); ctx.moveTo(prevPos.x, prevPos.y); ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = curColor; ctx.lineWidth = curColor === '#0d0d1f' ? 16 : 3; ctx.lineCap = 'round'; ctx.stroke();
      prevPos = p;
    }, { passive: false });
    cv.addEventListener('touchend', () => { drawing = false; prevPos = null; });
  }

  function renderDrawMode() {
    const colors = ['#e2e8f0', '#f87171', '#fb923c', '#4ade80', '#60a5fa', '#c084fc'];
    box.innerHTML = `
      <h3 class="mg-title">✏️ 얼굴 그려서 스캔하기!</h3>
      <p class="mg-sub">나의 얼굴을 그려보세요. 노아가 스캔하겠습니다!</p>
      <div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;justify-content:center">
        <div>
          <canvas id="mg-ns-draw-cv" width="220" height="190" class="mg-draw-canvas"></canvas>
          <div class="mg-draw-tools" id="mg-ns-draw-tools">
            ${colors.map((c,i) => `<button class="mg-draw-color-btn${i===0?' active':''}" data-color="${c}" style="background:${c}"></button>`).join('')}
            <button class="mg-draw-color-btn" data-color="erase" style="background:#0d0d1f;border:2px solid #7c6df0;font-size:9px;color:#c4b5fd">지우</button>
          </div>
        </div>
        <div class="mg-ns-matrix-bg" id="mg-ns-matrix-d" style="width:80px;align-self:stretch;border-radius:8px;overflow:hidden"></div>
      </div>
      <button id="mg-ns-draw-done" class="btn-primary mg-done-btn" style="margin-top:10px">🔍 이 얼굴로 스캔하기!</button>
    `;
    startMatrixRain('mg-ns-matrix-d');
    setupDrawCanvas('mg-ns-draw-cv');
    document.getElementById('mg-ns-draw-done').addEventListener('click', () => {
      Sound.click();
      box.innerHTML = `<h3 class="mg-title">🤖 얼굴 스캔 중...</h3>
        <div class="mg-ns-matrix-bg" id="mg-ns-matrix-s" style="height:80px;border-radius:8px;overflow:hidden;margin:14px 0"></div>
        <div class="mg-ns-prog-wrap"><div class="mg-ns-prog" id="mg-ns-prog" style="width:0%"></div></div>
        <div id="mg-ns-label" class="mg-ns-label-text">📡 얼굴 인식 중...</div>`;
      startMatrixRain('mg-ns-matrix-s');
      runScanAnimation();
    });
  }

  function renderCamMode() {
    box.innerHTML = `
      <h3 class="mg-title">📷 노아의 첫 스캔!</h3>
      <p class="mg-sub">정면을 바라봐주세요. 노아가 여러분을 스캔합니다!</p>
      <div class="mg-ns-cam-wrap">
        <video id="mg-ns-video" autoplay playsinline muted class="mg-ns-video"></video>
        <div class="mg-ns-hud">
          <div class="mg-ns-corner mg-ns-tl"></div><div class="mg-ns-corner mg-ns-tr"></div>
          <div class="mg-ns-corner mg-ns-bl"></div><div class="mg-ns-corner mg-ns-br"></div>
          <div class="mg-ns-scanline"></div>
          <div id="mg-ns-label" class="mg-ns-hud-label">📡 스캔 준비 중...</div>
        </div>
        <div class="mg-ns-matrix-bg" id="mg-ns-matrix-c" style="position:absolute;inset:0;border-radius:10px;pointer-events:none"></div>
        <div class="mg-ns-prog-wrap" style="position:static;margin-top:8px"><div class="mg-ns-prog" id="mg-ns-prog" style="width:0%"></div></div>
      </div>
      <button id="mg-ns-cam-alt" class="mg-scan-alt-btn" style="margin-top:8px">✏️ 카메라 없이 얼굴 그리기</button>
    `;
    startMatrixRain('mg-ns-matrix-c');
    document.getElementById('mg-ns-cam-alt').addEventListener('click', () => { cleanup(); renderDrawMode(); });
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(stream => {
        camStream = stream;
        const vid = document.getElementById('mg-ns-video');
        if (vid) { vid.srcObject = stream; vid.play(); }
        setTimeout(runScanAnimation, 800);
      })
      .catch(() => renderDrawMode());
  }

  overlay.classList.remove('hidden');
  box.innerHTML = `
    <h3 class="mg-title">🤖 노아의 첫 스캔 — 나를 인식시켜라!</h3>
    <p class="mg-sub">노아가 반 학생들을 스캔하고 있어요! 어떻게 참여할까요?</p>
    <div class="mg-ns-matrix-bg" id="mg-ns-matrix-init" style="height:90px;border-radius:8px;overflow:hidden;margin:12px 0"></div>
    <div class="mg-ns-init-btns">
      <button id="mg-ns-btn-cam" class="mg-ns-init-btn">📷 카메라 스캔<br><small>웹캠으로 얼굴 인식</small></button>
      <button id="mg-ns-btn-draw" class="mg-ns-init-btn">✏️ 얼굴 그리기<br><small>캔버스에 그려서 스캔</small></button>
      <button id="mg-ns-btn-auto" class="mg-ns-init-btn">⚡ 즉시 스캔<br><small>바로 결과 보기</small></button>
    </div>
  `;
  startMatrixRain('mg-ns-matrix-init');
  document.getElementById('mg-ns-btn-cam').addEventListener('click', () => { Sound.click(); renderCamMode(); });
  document.getElementById('mg-ns-btn-draw').addEventListener('click', () => { Sound.click(); renderDrawMode(); });
  document.getElementById('mg-ns-btn-auto').addEventListener('click', () => {
    Sound.click();
    box.innerHTML = `<h3 class="mg-title">🤖 스캔 진행 중...</h3>
      <div class="mg-ns-matrix-bg" id="mg-ns-matrix-a" style="height:80px;border-radius:8px;overflow:hidden;margin:14px 0"></div>
      <div class="mg-ns-prog-wrap"><div class="mg-ns-prog" id="mg-ns-prog" style="width:0%"></div></div>
      <div id="mg-ns-label" class="mg-ns-label-text">📡 얼굴 인식 중...</div>`;
    startMatrixRain('mg-ns-matrix-a');
    runScanAnimation();
  });
}

/* ── Day 2: 번개 퀴즈 대결 ── */
function showMgLightningQuiz(onComplete) {
  const box = document.getElementById('mg-box');
  const overlay = document.getElementById('ov-minigame');

  const QUESTIONS = [
    { q: '37 × 12 = ?', a: 444 },
    { q: '256 ÷ 8 = ?', a: 32 },
    { q: '19 × 13 = ?', a: 247 },
    { q: '144 ÷ 12 + 7 = ?', a: 19 },
    { q: '63 + 87 - 29 = ?', a: 121 },
  ];

  let qIdx = 0, playerScore = 0;

  function playCorrect() {
    if (!Settings.sfx) return;
    Sound.init();
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => Sound.playBeep(f, 'square', 0.12, 0.07), i * 60));
  }
  function playWrong() {
    if (!Settings.sfx) return;
    Sound.init();
    Sound.playBeep(180, 'sawtooth', 0.4, 0.12);
    if (navigator.vibrate) navigator.vibrate([100, 50, 150]);
  }

  function renderQ() {
    const q = QUESTIONS[qIdx];
    const TIME = 15;
    let elapsed = 0, done = false;
    const startTime = Date.now();
    let timerIv = null;

    box.innerHTML = `
      <h3 class="mg-title">⚡ 번개 퀴즈 대결!</h3>
      <p class="mg-sub" style="margin-bottom:6px">노아와 암산 속도 대결! 문제 ${qIdx + 1} / ${QUESTIONS.length}</p>
      <div class="mg-quiz-question-box" id="mg-quiz-qbox">${q.q}</div>
      <div class="mg-quiz-layout">
        <div class="mg-quiz-col mg-quiz-me">
          <div class="mg-quiz-avatar">🙋</div>
          <p class="mg-quiz-pname">나</p>
          <div class="mg-quiz-timebar-wrap">
            <div class="mg-quiz-timebar" id="mg-lq-bar" style="width:100%;background:#22c55e"></div>
          </div>
          <p class="mg-quiz-timetxt" id="mg-lq-timetxt">${TIME}.0 s</p>
          <div id="mg-lq-input-area">
            <input id="mg-lq-input" class="mg-quiz-input" type="number" inputmode="numeric" placeholder="답 입력...">
            <div style="display:flex;gap:6px;margin-top:6px">
              <button id="mg-lq-submit" class="btn-primary" style="flex:1">제출!</button>
              <button id="mg-lq-voice" class="mg-quiz-voice-btn" title="음성 입력">🎤</button>
            </div>
          </div>
          <div id="mg-lq-me-result" class="mg-quiz-result-txt"></div>
        </div>
        <div class="mg-quiz-vs-badge">VS</div>
        <div class="mg-quiz-col mg-quiz-noah">
          <div class="mg-quiz-avatar">🤖</div>
          <p class="mg-quiz-pname">노아</p>
          <div id="mg-lq-noah-area" class="mg-lq-noah-thinking">계산 중...</div>
          <div id="mg-lq-noah-result" class="mg-quiz-result-txt"></div>
        </div>
      </div>
    `;

    const input = document.getElementById('mg-lq-input');
    input.focus();

    setTimeout(() => {
      if (done) return;
      if (!Settings.sfx) return;
      Sound.init(); Sound.playBeep(1400, 'square', 0.07, 0.04);
      const na = document.getElementById('mg-lq-noah-area');
      const nr = document.getElementById('mg-lq-noah-result');
      if (na) na.innerHTML = `<div class="mg-lq-noah-answer">${q.a}</div><p class="mg-lq-noah-time">0.3초 ⚡</p>`;
      if (nr) nr.innerHTML = '<span style="color:#22c55e;font-size:1.2rem">✓</span>';
    }, 300);

    timerIv = setInterval(() => {
      if (done) { clearInterval(timerIv); return; }
      elapsed = (Date.now() - startTime) / 1000;
      const rem = Math.max(0, TIME - elapsed);
      const bar = document.getElementById('mg-lq-bar');
      const txt = document.getElementById('mg-lq-timetxt');
      if (bar) { bar.style.width = (rem / TIME * 100) + '%'; bar.style.background = rem < 5 ? '#ef4444' : rem < 8 ? '#f97316' : '#22c55e'; }
      if (txt) txt.textContent = rem.toFixed(1) + ' s';
      if (rem <= 0) { clearInterval(timerIv); handleAnswer(null); }
    }, 100);

    function handleAnswer(val) {
      if (done) return;
      done = true;
      clearInterval(timerIv);
      const ms = Date.now() - startTime;
      const correct = val !== null && val === q.a;
      if (correct) { playerScore++; playCorrect(); }
      else { playWrong(); const qb = document.getElementById('mg-quiz-qbox'); if (qb) { qb.style.animation = 'mg-shake 0.4s'; setTimeout(() => { if (qb) qb.style.animation = ''; }, 400); } }
      const ia = document.getElementById('mg-lq-input-area');
      const mr = document.getElementById('mg-lq-me-result');
      if (ia) ia.style.display = 'none';
      if (mr) {
        if (val === null) mr.innerHTML = '<span style="color:#ef4444">⏱️ 시간 초과!</span>';
        else mr.innerHTML = `<span style="color:${correct ? '#22c55e' : '#ef4444'}">${correct ? '✓ 정답!' : '✗ 오답'}</span><br><small>(${(ms / 1000).toFixed(1)}초)</small>`;
      }
      setTimeout(() => { qIdx++; if (qIdx < QUESTIONS.length) renderQ(); else showQuizResult(); }, 1600);
    }

    document.getElementById('mg-lq-submit').addEventListener('click', () => {
      Sound.click();
      const v = parseInt(input.value);
      if (isNaN(v)) { input.focus(); return; }
      handleAnswer(v);
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('mg-lq-submit')?.click(); });

    document.getElementById('mg-lq-voice').addEventListener('click', () => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { alert('이 브라우저는 음성 입력을 지원하지 않아요.'); return; }
      Sound.click();
      const r = new SR();
      r.lang = 'ko-KR'; r.continuous = false; r.interimResults = false;
      r.onresult = (e) => {
        const txt = e.results[0][0].transcript.replace(/[^0-9]/g, '');
        const v = parseInt(txt);
        if (!isNaN(v)) { input.value = v; handleAnswer(v); }
      };
      r.onerror = () => {};
      r.start();
    });
  }

  function showQuizResult() {
    box.innerHTML = `
      <h3 class="mg-title">⚡ 번개 퀴즈 결과!</h3>
      <div class="mg-thermo-final">
        <div class="mg-quiz-final-row">
          <div class="mg-quiz-final-col"><div class="mg-quiz-avatar">🤖</div><p>노아</p><strong style="font-size:1.5rem;color:#f59e0b">${QUESTIONS.length}/${QUESTIONS.length}</strong><p style="font-size:0.75rem;color:#9ca3af">평균 0.3초</p></div>
          <div class="mg-quiz-vs-badge" style="font-size:1.2rem">VS</div>
          <div class="mg-quiz-final-col"><div class="mg-quiz-avatar">🙋</div><p>나</p><strong style="font-size:1.5rem;color:${playerScore >= 3 ? '#22c55e' : '#f87171'}">${playerScore}/${QUESTIONS.length}</strong></div>
        </div>
        <p class="mg-result-text" style="margin-top:14px">🧠 계산 속도보다 중요한 것이 있어요!</p>
        <p class="mg-result-sub">노아는 연산이 빠르지만, 공감·판단·창의력은 아직 배우는 중이에요. 진짜 지혜는 숫자가 아니에요.</p>
      </div>
      <button id="mg-lq-done" class="btn-primary mg-done-btn">계속 →</button>
    `;
    Sound.endingFanfare();
    document.getElementById('mg-lq-done').addEventListener('click', () => {
      Sound.click(); overlay.classList.add('hidden'); onComplete();
    });
  }

  overlay.classList.remove('hidden');
  renderQ();
}

/* ── Day 3: 분위기 파악 퀴즈 ── */
function showMgEmotionTeach(onComplete) {
  const box = document.getElementById('mg-box');
  const overlay = document.getElementById('ov-minigame');

  const SITUATIONS = [
    {
      situation: '🐾 친구가 아끼는 강아지가 아파서 울고 있어요.',
      noahWrong: '최적 처방: 반경 2km 내 동물병원 3개소를 데이터베이스에서 검색합니다.',
      correct: '😢',
      options: ['😢', '😡', '😊', '🤔'],
      feedback: '슬픈 친구에게는 먼저 마음을 공감해주는 게 중요해요!',
    },
    {
      situation: '🎤 친구가 열심히 준비한 발표에서 실수를 해서 부끄러워하고 있어요.',
      noahWrong: '"통계에 따르면 발표 실수 후 심리적 회복은 평균 3.2일 소요됩니다."',
      correct: '🫂',
      options: ['😤', '🫂', '😂', '📊'],
      feedback: '실수한 친구에겐 따뜻한 격려가 최고의 위로예요.',
    },
    {
      situation: '💔 친구가 반에서 따돌림을 당해서 학교 오기 싫다고 했어요.',
      noahWrong: '"왕따 피해자 비율은 약 12.7%. 가해자 행동 분석 보고서를 출력합니다."',
      correct: '🤝',
      options: ['😑', '🤝', '📈', '🤖'],
      feedback: '그냥 곁에 있어주고 같이 해결하려는 마음이 필요해요.',
    },
  ];

  let idx = 0, score = 0;

  function render() {
    const st = SITUATIONS[idx];
    box.innerHTML = `
      <h3 class="mg-title">💭 분위기 파악 퀴즈!</h3>
      <p class="mg-sub">노아의 대답이 뭔가 이상해요! 올바른 감정 반응을 골라주세요 (${idx + 1}/${SITUATIONS.length})</p>
      <div class="mg-et2-situation">${st.situation}</div>
      <div class="mg-et2-noah-say">
        <span class="noah-speaker">노아</span>
        <p class="mg-et2-wrong">"${st.noahWrong}"</p>
      </div>
      <p class="mg-et2-prompt">이 상황에서 친구에게 필요한 반응은?</p>
      <div class="mg-et2-options">
        ${st.options.map(e => `<button class="mg-et2-opt-btn" data-emoji="${e}">${e}</button>`).join('')}
      </div>
      <div id="mg-et2-feedback" class="mg-et2-feedback" style="display:none"></div>
    `;
    document.querySelectorAll('.mg-et2-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Sound.click();
        const chosen = btn.dataset.emoji;
        const correct = chosen === st.correct;
        if (correct) { score++; Sound.endingFanfare(); if (navigator.vibrate) navigator.vibrate([60, 30, 60]); }
        else { Sound.glitch(); }
        document.querySelectorAll('.mg-et2-opt-btn').forEach(b => {
          b.disabled = true;
          if (b.dataset.emoji === st.correct) b.classList.add('mg-et2-correct');
          else if (b === btn && !correct) b.classList.add('mg-et2-wrong');
        });
        const fb = document.getElementById('mg-et2-feedback');
        fb.innerHTML = `${correct ? '✅ 정확해요!' : '💡 정답은 ' + st.correct + '이에요!'} ${st.feedback}`;
        fb.style.display = 'block';
        setTimeout(() => { idx++; if (idx < SITUATIONS.length) render(); else showEmotionResult(); }, 2100);
      });
    });
  }

  function showEmotionResult() {
    box.innerHTML = `
      <h3 class="mg-title">💭 분위기 파악 결과!</h3>
      <div class="mg-thermo-final">
        <div class="mg-thermo-score-display">${score} <span style="font-size:1rem;opacity:0.6">/ ${SITUATIONS.length}</span></div>
        ${score >= 2
          ? `<p class="mg-result-text">💛 노아에게 감정을 잘 가르쳐줬어요!</p>
             <p class="mg-result-sub">팩트보다 공감이 중요한 순간이 있어요. 인간만이 할 수 있는 '감정 공감'의 힘이에요!</p>`
          : `<p class="mg-result-text">💭 조금 더 연습해봐요!</p>
             <p class="mg-result-sub">노아도 아직 감정을 배우는 중이에요. 우리가 가르쳐줄 수 있어요!</p>`}
      </div>
      <button id="mg-et2-done" class="btn-primary mg-done-btn">계속 →</button>
    `;
    document.getElementById('mg-et2-done').addEventListener('click', () => {
      Sound.click(); overlay.classList.add('hidden'); onComplete();
    });
  }

  overlay.classList.remove('hidden');
  render();
}

/* ── Day 4: 의존도 체크 미터 ── */
function showMgDependencyScale(onComplete) {
  const box = document.getElementById('mg-box');
  const overlay = document.getElementById('ov-minigame');

  let dependency = 30;
  let orientHandler = null;

  const SCENARIOS = [
    { q: '어려운 수학 문제가 나왔어요. 어떻게 할까요?', a1: '🧠 스스로 생각해본다', a2: '🤖 노아에게 물어본다', d1: -15, d2: +20 },
    { q: '점심 메뉴를 고를 때 친구들과 의견이 달라요.', a1: '💬 함께 이야기해서 정한다', a2: '📊 노아의 최적 영양 분석을 따른다', d1: -10, d2: +25 },
    { q: '방과 후 공부 계획을 세울 때.', a1: '📝 내 의지로 계획을 세운다', a2: '⚡ 노아에게 최적 스케줄을 짜달라 한다', d1: -20, d2: +30 },
  ];
  let scIdx = 0;

  function drawScale(canvas, dep) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2;

    const tiltRad = ((dep - 50) / 100) * 0.5;

    ctx.save();
    ctx.translate(cx, 30);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 55);
    ctx.strokeStyle = '#7c6df0'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();

    ctx.translate(0, 55);
    ctx.rotate(tiltRad);

    const bL = 95;
    ctx.beginPath(); ctx.moveTo(-bL, 0); ctx.lineTo(bL, 0);
    ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 3; ctx.stroke();

    const leftColor = '#22c55e';
    const rightColor = dep > 65 ? '#ef4444' : dep > 45 ? '#f59e0b' : '#7c6df0';
    [-bL, bL].forEach((x, i) => {
      ctx.beginPath(); ctx.arc(x, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#c4b5fd'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 22);
      ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, 30, 16, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? leftColor : rightColor; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(i === 0 ? '나' : '노아', x, 30);
    });
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.roundRect(16, H - 16, W - 32, 8, 4); ctx.fill();
    ctx.fillStyle = dep > 65 ? '#ef4444' : dep > 45 ? '#f59e0b' : '#22c55e';
    ctx.roundRect(16, H - 16, (W - 32) * (dep / 100), 8, 4); ctx.fill();
    ctx.fillStyle = '#9ca3af'; ctx.font = '10px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('💪 나의 힘', 16, H - 28);
    ctx.textAlign = 'right'; ctx.fillText('🤖 노아 의존', W - 16, H - 28);
  }

  function renderScenario() {
    if (scIdx >= SCENARIOS.length) { showScaleResult(); return; }
    const sc = SCENARIOS[scIdx];

    box.innerHTML = `
      <h3 class="mg-title">⚖️ 의존도 체크 미터</h3>
      <p class="mg-sub">선택에 따라 저울이 기울어져요! (${scIdx + 1}/${SCENARIOS.length})</p>
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
        <canvas id="mg-scale-cv" width="280" height="130" class="mg-scale-cv"></canvas>
        <p style="font-size:0.78rem;color:#9ca3af;margin:0">의존도: <strong id="mg-scale-dep-val" style="color:#c4b5fd">${dependency}%</strong></p>
      </div>
      <div class="mg-scale-scenario">${sc.q}</div>
      <div class="mg-scale-choices">
        <button class="mg-scale-btn mg-scale-self" data-d1="${sc.d1}">${sc.a1}</button>
        <button class="mg-scale-btn mg-scale-noah" data-d2="${sc.d2}">${sc.a2}</button>
      </div>
    `;

    const cv = document.getElementById('mg-scale-cv');
    drawScale(cv, dependency);

    const enableOrientation = () => {
      orientHandler = (e) => {
        const g = Math.max(-25, Math.min(25, e.gamma || 0));
        const preview = Math.max(0, Math.min(100, dependency + g * 0.6));
        const dv = document.getElementById('mg-scale-dep-val');
        if (dv) dv.textContent = Math.round(preview) + '%';
        drawScale(cv, preview);
      };
      window.addEventListener('deviceorientation', orientHandler);
    };
    if (typeof DeviceOrientationEvent !== 'undefined') {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(p => { if (p === 'granted') enableOrientation(); }).catch(() => {});
      } else {
        enableOrientation();
      }
    }

    function choose(delta) {
      if (orientHandler) { window.removeEventListener('deviceorientation', orientHandler); orientHandler = null; }
      Sound.click();
      dependency = Math.max(0, Math.min(100, dependency + delta));
      if (delta > 0) { Sound.glitch(); if (navigator.vibrate) navigator.vibrate([40, 20, 40]); }
      else { if (Settings.sfx) { Sound.init(); Sound.playBeep(440, 'sine', 0.15, 0.08); } }
      if (dependency > 70) {
        box.style.transition = 'transform 0.5s ease';
        box.style.transform = `rotate(${(dependency - 70) * 0.25}deg)`;
        setTimeout(() => { box.style.transform = ''; }, 700);
      }
      scIdx++;
      setTimeout(renderScenario, 500);
    }

    document.querySelector('.mg-scale-self').addEventListener('click', () => choose(sc.d1));
    document.querySelector('.mg-scale-noah').addEventListener('click', () => choose(sc.d2));
  }

  function showScaleResult() {
    const high = dependency > 65;
    box.innerHTML = `
      <h3 class="mg-title">⚖️ 의존도 체크 결과</h3>
      <div class="mg-thermo-final">
        <div class="mg-thermo-score-display" style="color:${high ? '#ef4444' : '#22c55e'}">${dependency}%</div>
        <p style="margin:0 0 6px;color:#9ca3af;font-size:0.8rem">AI 의존도 지수</p>
        ${high
          ? `<p class="mg-result-text mg-result-warn">⚠️ 노아에게 많이 기대고 있어요!</p>
             <p class="mg-result-sub">편리함은 좋지만, 나의 판단력과 의지를 잃으면 안 돼요. 스스로 선택하는 연습이 필요해요.</p>`
          : `<p class="mg-result-text">💪 균형 잡힌 관계예요!</p>
             <p class="mg-result-sub">AI의 도움을 받으면서도 나 자신의 주체성을 지키는 것이 가장 중요해요.</p>`}
      </div>
      <button id="mg-scale-done" class="btn-primary mg-done-btn">계속 →</button>
    `;
    document.getElementById('mg-scale-done').addEventListener('click', () => {
      Sound.click(); overlay.classList.add('hidden'); onComplete();
    });
  }

  overlay.classList.remove('hidden');
  renderScenario();
}

/* ── Day 5: 냥봇 그림 대결 ── */
function showMgCatDraw(onComplete) {
  const box = document.getElementById('mg-box');
  const overlay = document.getElementById('ov-minigame');
  let drawing = false, curColor = '#f87171', prevPos = null;
  let playerImageData = null;

  function drawNoahCat(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.42;

    ctx.fillStyle = '#8b9dc3';
    ctx.beginPath(); ctx.ellipse(cx, cy + 32, 36, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2); ctx.fill();

    [[-20, -16, -30, -36, -10, -20], [20, -16, 30, -36, 10, -20]].forEach(([x1, y1, x2, y2, x3, y3]) => {
      ctx.fillStyle = '#8b9dc3';
      ctx.beginPath(); ctx.moveTo(cx + x1, cy + y1); ctx.lineTo(cx + x2, cy + y2); ctx.lineTo(cx + x3, cy + y3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fda4af'; ctx.beginPath();
      ctx.moveTo(cx + x1 * 0.7, cy + y1 * 0.7 - 2); ctx.lineTo(cx + x2 * 0.8, cy + y2 * 0.8); ctx.lineTo(cx + x3 * 0.7, cy + y3 * 0.7 - 2);
      ctx.closePath(); ctx.fill();
    });

    [-10, 10].forEach(ox => {
      ctx.beginPath(); ctx.arc(cx + ox, cy - 3, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#fef9c3'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx + ox, cy - 3, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#1e3a5f'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx + ox, cy - 3, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#000'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx + ox - 1.5, cy - 4.5, 1, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
    });

    ctx.beginPath(); ctx.arc(cx, cy + 4, 2.5, 0, Math.PI * 2); ctx.fillStyle = '#fda4af'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - 5, cy + 9); ctx.quadraticCurveTo(cx, cy + 13, cx + 5, cy + 9);
    ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 1.2; ctx.stroke();

    for (const s of [-1, 1]) {
      for (const [a, b] of [[-1, 0], [-0.8, 0.3], [-0.75, -0.3]]) {
        ctx.beginPath(); ctx.moveTo(cx + s * 4, cy + 4); ctx.lineTo(cx + s * (4 + 28 * Math.abs(a)), cy + 4 + b * 9);
        ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 0.8; ctx.stroke();
      }
    }

    ctx.beginPath(); ctx.moveTo(cx + 34, cy + 46); ctx.quadraticCurveTo(cx + 58, cy + 28, cx + 53, cy + 8);
    ctx.strokeStyle = '#8b9dc3'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke();

    ctx.fillStyle = 'rgba(239,68,68,0.85)'; ctx.fillRect(0, H - 22, W, 22);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('해부학적 완벽 냥봇 (소름주의!)', W / 2, H - 11);
  }

  async function analyzeDrawing(imgData64) {
    const FALLBACKS = [
      '비록 선이 삐뚤지만, 이 그림에는 따뜻한 마음이 담겨 있어요! 🌟 기계가 절대 흉내낼 수 없는 손길의 온기가 느껴져요.',
      '완벽하지 않아도 괜찮아요! 🎨 이 냥봇에서 그린 사람의 개성과 감정이 느껴져요. 그것이 예술의 진짜 가치예요.',
      '이 삐뚤빼뚤한 선들에서 따뜻한 마음이 느껴져요 💛 노아의 완벽한 그림보다 이 그림에 더 많은 이야기가 담겨있어요!',
    ];
    const key = window.GEMINI_CONFIG?.key;
    if (!key) return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [
            { inlineData: { mimeType: 'image/jpeg', data: imgData64 } },
            { text: '이 그림은 어린 학생이 고양이 로봇(냥봇)을 직접 그린 그림이에요. 따뜻하고 격려하는 말로 칭찬해주세요. 2-3문장, 비록 선이 완벽하지 않더라도 인간의 감정과 창의성이 담겨있다는 점을 강조해주세요. 이모지 1-2개 포함, 한국어로.' }
          ]}]})
        }
      );
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || FALLBACKS[0];
    } catch (e) {
      return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    }
  }

  function setupPlayerCanvas() {
    const cv = document.getElementById('mg-catdraw-cv');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#0d0d1f'; ctx.fillRect(0, 0, cv.width, cv.height);

    const colors = ['#f87171', '#fb923c', '#fbbf24', '#4ade80', '#60a5fa', '#c084fc', '#e2e8f0'];
    document.querySelectorAll('.mg-catdraw-color-btn').forEach((btn, i) => {
      if (i === 0) btn.classList.add('active');
      btn.addEventListener('click', () => {
        curColor = btn.dataset.color === 'erase' ? '#0d0d1f' : btn.dataset.color;
        document.querySelectorAll('.mg-catdraw-color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    const getPos = (e) => {
      const r = cv.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: (t.clientX - r.left) * (cv.width / r.width), y: (t.clientY - r.top) * (cv.height / r.height) };
    };
    const draw = (p) => {
      if (!drawing || !prevPos) return;
      ctx.beginPath(); ctx.moveTo(prevPos.x, prevPos.y); ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = curColor; ctx.lineWidth = curColor === '#0d0d1f' ? 18 : 3.5; ctx.lineCap = 'round'; ctx.stroke();
      prevPos = p;
    };
    cv.addEventListener('mousedown', e => { drawing = true; prevPos = getPos(e); });
    cv.addEventListener('mousemove', e => draw(getPos(e)));
    cv.addEventListener('mouseup', () => { drawing = false; prevPos = null; });
    cv.addEventListener('mouseleave', () => { drawing = false; prevPos = null; });
    cv.addEventListener('touchstart', e => { e.preventDefault(); drawing = true; prevPos = getPos(e); }, { passive: false });
    cv.addEventListener('touchmove', e => { e.preventDefault(); draw(getPos(e)); }, { passive: false });
    cv.addEventListener('touchend', () => { drawing = false; prevPos = null; });
  }

  const catColors = ['#f87171', '#fb923c', '#fbbf24', '#4ade80', '#60a5fa', '#c084fc', '#e2e8f0'];
  box.innerHTML = `
    <h3 class="mg-title">🎨 AI 그림 vs 인간 그림 — 냥봇 대결!</h3>
    <p class="mg-sub">노아의 완벽한 AI 냥봇 vs 나의 영혼 가득 손그림! 왼쪽 캔버스에 냥봇을 그려보세요.</p>
    <div class="mg-catdraw-layout">
      <div class="mg-catdraw-col">
        <p class="mg-catdraw-col-title">✏️ 나의 냥봇</p>
        <canvas id="mg-catdraw-cv" width="210" height="195" class="mg-draw-canvas"></canvas>
        <div class="mg-draw-tools">
          ${catColors.map(c => `<button class="mg-catdraw-color-btn mg-draw-color-btn" data-color="${c}" style="background:${c}"></button>`).join('')}
          <button class="mg-catdraw-color-btn mg-draw-color-btn" data-color="erase" style="background:#0d0d1f;border:2px solid #7c6df0;font-size:9px;color:#c4b5fd">지우</button>
        </div>
      </div>
      <div class="mg-catdraw-col">
        <p class="mg-catdraw-col-title">🤖 노아의 냥봇 <span style="font-size:0.7rem;color:#ef4444">(소름주의!)</span></p>
        <canvas id="mg-noah-cat" width="210" height="195" class="mg-draw-canvas" style="pointer-events:none"></canvas>
      </div>
    </div>
    <button id="mg-catdraw-submit" class="btn-primary mg-done-btn" style="margin-top:10px">🤖 AI 평가 받기! →</button>
  `;

  drawNoahCat(document.getElementById('mg-noah-cat'));
  setupPlayerCanvas();

  document.getElementById('mg-catdraw-submit').addEventListener('click', async () => {
    Sound.click();
    const cv = document.getElementById('mg-catdraw-cv');
    const imgData64 = cv ? cv.toDataURL('image/jpeg', 0.6).split(',')[1] : null;
    const btn = document.getElementById('mg-catdraw-submit');
    if (btn) { btn.disabled = true; btn.textContent = '🤖 Gemini AI 분석 중...'; }

    const evalMsg = await analyzeDrawing(imgData64);

    const savedDataUrl = cv ? cv.toDataURL() : null;
    box.innerHTML = `
      <h3 class="mg-title">🎨 AI의 그림 평가 결과!</h3>
      <div class="mg-catdraw-compare">
        <div style="text-align:center">
          <p style="font-size:0.75rem;color:#9ca3af;margin:0 0 4px">나의 냥봇</p>
          <canvas id="mg-cf-player" width="140" height="130" class="mg-draw-canvas" style="pointer-events:none"></canvas>
        </div>
        <div class="mg-quiz-vs-badge" style="font-size:1.4rem">vs</div>
        <div style="text-align:center">
          <p style="font-size:0.75rem;color:#9ca3af;margin:0 0 4px">노아의 냥봇</p>
          <canvas id="mg-cf-noah" width="140" height="130" class="mg-draw-canvas" style="pointer-events:none"></canvas>
        </div>
      </div>
      <div class="mg-catdraw-eval">
        <span class="noah-speaker" style="margin-bottom:6px;display:block">Gemini AI 평가</span>
        <p class="mg-catdraw-eval-text">${evalMsg}</p>
      </div>
      <p class="mg-result-sub" style="margin-top:10px">💫 완벽한 기계 그림보다 서투른 인간 그림에 <strong>감정과 개성</strong>이 담겨있어요. 이것이 인간 예술의 가치!</p>
      <button id="mg-catdraw-done" class="btn-primary mg-done-btn">계속 →</button>
    `;

    if (savedDataUrl) {
      const img = new Image(); img.src = savedDataUrl;
      img.onload = () => {
        const pc = document.getElementById('mg-cf-player');
        if (pc) pc.getContext('2d').drawImage(img, 0, 0, 140, 130);
      };
    }
    const nc = document.getElementById('mg-cf-noah');
    if (nc) drawNoahCat(nc);

    Sound.endingFanfare();
    document.getElementById('mg-catdraw-done').addEventListener('click', () => {
      Sound.click(); overlay.classList.add('hidden'); onComplete();
    });
  });

  overlay.classList.remove('hidden');
}

/* ──────────────────────────────────────────
   SETTINGS PANEL WIRING
   ────────────────────────────────────────── */
function syncSettingsUI() {
  const setTg = (id, on) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('on', on);
    el.setAttribute('aria-checked', on ? 'true' : 'false');
  };
  setTg('tg-sfx', Settings.sfx);
  setTg('tg-bgm', Settings.bgm);
  setTg('tg-tts', Settings.tts);
  setTg('tg-contrast', Settings.contrast);
  document.querySelectorAll('#seg-fontsize button').forEach(b => {
    b.classList.toggle('active', b.dataset.fs === Settings.fontSize);
  });
}

function bindToggle(id, key, afterFn) {
  document.getElementById(id).addEventListener('click', () => {
    Sound.init();
    Settings[key] = !Settings[key];
    Settings.save();
    Settings.apply();
    syncSettingsUI();
    if (Settings[key]) Sound.click();
    if (afterFn) afterFn();
  });
}

document.getElementById('btn-settings-gear').addEventListener('click', () => {
  Sound.init(); Sound.click();
  syncSettingsUI();
  document.getElementById('ov-settings').classList.remove('hidden');
});
document.getElementById('btn-settings-close').addEventListener('click', () => {
  Sound.click();
  document.getElementById('ov-settings').classList.add('hidden');
});

bindToggle('tg-sfx', 'sfx');
bindToggle('tg-bgm', 'bgm', () => {
  // 현재 챕터 분위기로 즉시 재생/정지
  if (Settings.bgm) {
    const mood = G.chapter === 2 ? 'tense' : (G.chapter >= 3 ? 'hope' : 'calm');
    Sound.playBgm(mood);
  }
});
bindToggle('tg-tts', 'tts');
bindToggle('tg-contrast', 'contrast');

document.querySelectorAll('#seg-fontsize button').forEach(btn => {
  btn.addEventListener('click', () => {
    Sound.click();
    Settings.fontSize = btn.dataset.fs;
    Settings.save();
    Settings.apply();
    syncSettingsUI();
  });
});

document.getElementById('btn-reset-progress').addEventListener('click', () => {
  Sound.click();
  if (!confirm('정말 모든 진행 기록을 지우고 처음부터 시작할까요?')) return;
  clearSave();
  sessionStorage.clear();
  location.reload();
});

/* ──────────────────────────────────────────
   교사용 가이드
   ────────────────────────────────────────── */
const TEACHER_GUIDE = [
  {
    stage: '도입 · 동기 유발',
    title: '“친구란 무엇일까?”',
    questions: [
      '나에게 진짜 ‘친구’란 어떤 존재일까요?',
      '사람이 아닌 인공지능 로봇과도 친구가 될 수 있을까요?'
    ],
    concept: '핵심 성취기준 [6도02-03] — 인간과 인공지능 로봇의 다양한 관계를 파악하고, 도덕에 기반한 관계 형성의 필요성을 탐구합니다.',
    pause: '학생이 입력한 ‘친구의 정의’를 모아 칠판에 비교해 보세요. 다양한 가치관을 드러내는 좋은 출발점입니다.'
  },
  {
    stage: '1막 (Day 1–10) · 친밀해지기',
    title: '편리함과 친밀함 사이',
    questions: [
      '노아의 어떤 점이 편리한가요? 어떤 점이 친구 같나요?',
      '노아의 ‘팩트 폭격’에 친구들이 상처받은 이유는 무엇일까요?'
    ],
    concept: '공감 능력의 부재 / 효율성의 유혹. 노아를 ‘도구’로 볼지 ‘동료’로 볼지 태도가 갈리기 시작합니다.',
    pause: 'Day 6(채원이 그림) 장면에서 멈추고 “사실(fact)이 전부일까?”를 토론하면 효과적입니다.'
  },
  {
    stage: '2막 (Day 11–18) · 도구화의 함정',
    title: '“효율적이면 다 괜찮을까?”',
    questions: [
      '게임이 자꾸 ‘효율적인’ 선택만 정답이라고 하네요. 정말 그럴까요?',
      '노아에게 명령하고 함부로 대한 결과는 무엇이었나요?'
    ],
    concept: '이 막은 일부러 효율성을 ‘정답’처럼 제시하는 함정입니다. 위조·차별·고주파(위해) 등 비도덕적 도구화의 결말을 체험합니다.',
    pause: 'Day 17 ‘가짜 인증서 → 시스템 붕괴’ 반전 직후, “무엇이 잘못됐는가?”를 꼭 짚어 주세요.'
  },
  {
    stage: '3막 (Day 19–26) · 다시, 올바르게',
    title: '네 가지 도덕 원칙',
    questions: [
      '같은 상황에서 어떻게 다르게 선택할 수 있을까요?',
      '주체성 · 합목적성 · 공공선 · 인간 존엄성은 각각 무슨 뜻일까요?'
    ],
    concept: '시간을 되돌려 4대 도덕 원칙으로 관계를 회복합니다. 틀린 선택은 벌이 아니라 ‘성찰 후 다시 선택’의 기회입니다.',
    pause: '각 원칙(Day 20–23)마다 멈춰, 우리 실생활의 AI 사용 사례와 연결해 보세요.'
  },
  {
    stage: '4막 (Day 27–30) · 공존 헌장',
    title: '나의 약속, 인간 고유의 가치',
    questions: [
      'AI가 아무리 발전해도, 인간만이 할 수 있는 일은 무엇일까요?',
      '내가 고른 세 가지 약속을 왜 골랐나요?'
    ],
    concept: '윤리 헌장 제정 · 서명을 통해 도덕에 기반한 관계를 내면화합니다. 결과는 친밀도와 ‘존중·도덕’ 두 축으로 평가됩니다.',
    pause: '학생들이 발급한 ‘성찰 기록지’를 모아 학급 게시판/TV로 공유하면 훌륭한 마무리 자료가 됩니다.'
  }
];

let teacherIdx = 0;
function renderTeacher() {
  const g = TEACHER_GUIDE[teacherIdx];
  document.getElementById('teacher-stage-label').textContent = g.stage;
  document.getElementById('teacher-body').innerHTML = `
    <div class="tg-section">
      <p class="tg-heading">🎯 핵심 발문</p>
      <ul class="tg-q-list">${g.questions.map(q => `<li>${q}</li>`).join('')}</ul>
    </div>
    <div class="tg-section">
      <p class="tg-heading">📚 도덕 개념</p>
      <p class="tg-text">${g.concept}</p>
    </div>
    <div class="tg-section tg-pause">
      <p class="tg-heading">⏸️ 권장 정지·토론 지점</p>
      <p class="tg-text">${g.pause}</p>
    </div>
  `;
  document.getElementById('btn-teacher-prev').disabled = teacherIdx === 0;
  document.getElementById('btn-teacher-next').disabled = teacherIdx === TEACHER_GUIDE.length - 1;
}
function openTeacher() {
  // 현재 챕터에 맞춰 시작 위치 추정 (도입=0, 1~4막=1~4)
  teacherIdx = (currentScreen === 'screen-game') ? Math.min(G.chapter, TEACHER_GUIDE.length - 1) : 0;
  renderTeacher();
  document.getElementById('ov-teacher').classList.remove('hidden');
}
document.getElementById('btn-teacher-menu').addEventListener('click', () => { Sound.click(); openTeacher(); });
document.getElementById('btn-open-teacher').addEventListener('click', () => {
  Sound.click();
  document.getElementById('ov-settings').classList.add('hidden');
  openTeacher();
});
document.getElementById('btn-teacher-close').addEventListener('click', () => {
  Sound.click();
  document.getElementById('ov-teacher').classList.add('hidden');
});
document.getElementById('btn-teacher-prev').addEventListener('click', () => {
  Sound.click(); if (teacherIdx > 0) { teacherIdx--; renderTeacher(); }
});
document.getElementById('btn-teacher-next').addEventListener('click', () => {
  Sound.click(); if (teacherIdx < TEACHER_GUIDE.length - 1) { teacherIdx++; renderTeacher(); }
});

/* ──────────────────────────────────────────
   관계 진단 오버레이 버튼
   ────────────────────────────────────────── */
document.getElementById('hud-relation').addEventListener('click', () => {
  Sound.click(); openRelationOverlay(null);
});

/* ── 뱃지 패널 ── */
document.getElementById('hud-badge-btn').addEventListener('click', () => {
  Sound.click();
  const panel = document.getElementById('badge-panel');
  const isOpen = !panel.classList.contains('hidden');
  closeAllPanels();
  if (!isOpen) { panel.classList.remove('hidden'); renderBadgePanel(); }
});
document.getElementById('badge-panel-close').addEventListener('click', () => {
  Sound.click();
  document.getElementById('badge-panel').classList.add('hidden');
});

/* ── 히스토리 패널 ── */
document.getElementById('hud-history-btn').addEventListener('click', () => {
  Sound.click();
  const panel = document.getElementById('history-panel');
  const isOpen = !panel.classList.contains('hidden');
  closeAllPanels();
  if (!isOpen) { panel.classList.remove('hidden'); renderHistoryPanel(); }
});
document.getElementById('history-panel-close').addEventListener('click', () => {
  Sound.click();
  document.getElementById('history-panel').classList.add('hidden');
});
document.getElementById('btn-relation-ok').addEventListener('click', () => { Sound.click(); closeRelationOverlay(); });
document.getElementById('btn-relation-close').addEventListener('click', () => { Sound.click(); closeRelationOverlay(); });

/* ── 언어 선택 ── */
document.querySelectorAll('#seg-lang button').forEach(btn => {
  btn.addEventListener('click', () => {
    Sound.click();
    applyLang(btn.dataset.lang);
  });
});

/* ──────────────────────────────────────────
   성찰 기록지 다운로드
   ────────────────────────────────────────── */
document.getElementById('btn-record-download').addEventListener('click', () => {
  Sound.click();
  // 템플릿 채우기
  document.getElementById('rec-name').textContent = state.playerName || '―';
  document.getElementById('rec-tier').textContent = state.finalTier || '―';
  document.getElementById('rec-friend').textContent =
    state.friendDef ? `"${state.friendDef}"(이)다. 왜냐하면 "${state.friendReason}"(이)기 때문이다.` : '―';
  document.getElementById('rec-discussion').textContent = state.discussionOpinion || '(작성하지 않음)';
  document.getElementById('rec-writing').textContent = state.creativeWriting || '(작성하지 않음)';
  document.getElementById('rec-sign').textContent = state.signature || state.playerName || '―';

  const pledges = document.getElementById('rec-pledges');
  pledges.innerHTML = (state.selectedStickers && state.selectedStickers.length)
    ? state.selectedStickers.map(s => `<li>${s}</li>`).join('')
    : '<li>(선택하지 않음)</li>';

  const today = new Date();
  document.getElementById('rec-date').textContent = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`;

  const template = document.getElementById('record-template');
  const btn = document.getElementById('btn-record-download');
  btn.textContent = '⏳ 다운로드 중...';
  btn.disabled = true;

  html2canvas(template, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false })
    .then(canvas => {
      const link = document.createElement('a');
      link.download = `성찰기록지_${state.playerName || '학생'}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
      btn.textContent = '✅ 다운로드 완료!';
      btn.disabled = false;
    })
    .catch(err => {
      console.error('html2canvas 오류:', err);
      btn.textContent = '❌ 실패 - 다시 시도';
      btn.disabled = false;
    });
});

/* ──────────────────────────────────────────
   INIT — Restore Sessions
   ────────────────────────────────────────── */
(function init() {
  const savedName = sessionStorage.getItem('playerName');
  const savedGender = sessionStorage.getItem('playerGender') || '남';
  const savedDef = sessionStorage.getItem('friendDef');
  const savedReason = sessionStorage.getItem('friendReason');
  const savedDesign = sessionStorage.getItem('selectedDesign') || 'human';

  if (savedName) {
    state.playerName = savedName;
    inputName.value = savedName;
  }
  state.playerGender = savedGender;
  if (savedGender === '여') {
    btnGenderF.classList.add('active');
    btnGenderM.classList.remove('active');
  } else {
    btnGenderM.classList.add('active');
    btnGenderF.classList.remove('active');
  }
  if (savedDef) {
    state.friendDef = savedDef;
    inputFriendDef.value = savedDef;
  }
  if (savedReason) {
    state.friendReason = savedReason;
    inputFriendReason.value = savedReason;
  }
  state.selectedDesign = savedDesign;

  btnInput1Next.disabled = inputName.value.trim().length === 0;
  updateInput2Btn();

  // 환경 설정 로드 및 UI 동기화
  Settings.load();
  syncSettingsUI();

  // 저장된 언어 설정 복원
  const savedLang = localStorage.getItem('lang') || 'ko';
  applyLang(savedLang);

  console.log('🚀 [App Init v2.0] 30일 시나리오 · 설정 로드 완료');
})();
