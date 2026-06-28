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
      customTrigger: "cat_painting",
      choices: [
        { text: "😱 노아의 냥봇 그림을 치우고 대화 계속하기", type: "neutral", nextDay: 6 }
      ]
    },
    {
      dayId: 6, chapter: 1, title: "Day 6: 팩트 폭격기 노아 (미술 시간 2)",
      background: "bg_classroom",
      character: "noah_selected",
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
      background: "bg_classroom",
      character: "noah_selected",
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
};

let currentScreen = 'screen-intro';

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

  /* 오버레이 항상 숨김 — 클릭 유도 없음 */
  clickOv.style.display = 'none';

  /* 즉시 자동재생 시도 */
  video.play().catch(() => {
    /* 재생 실패 시 조용히 메뉴로 */
    goToMenu();
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

  /* 게임 시작/이어하기 시 BGM 정지 */
  document.getElementById('btn-start').addEventListener('click', stopMenuBgm, { capture: true });
  document.getElementById('btn-continue').addEventListener('click', stopMenuBgm, { capture: true });
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

/* ──────────────────────────────────────────
   SAVE / CONTINUE (localStorage 자동 저장)
   ────────────────────────────────────────── */
const SAVE_KEY = 'noah_save';
function saveProgress() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      dayId: G.dayId, affinity: G.affinity, effGauge: G.effGauge,
      moralGauge: G.moralGauge, respect: G.respect, mistakes: G.mistakes,
      moralRevealed: G.moralRevealed,
      state: state, ts: Date.now()
    }));
  } catch (e) {}
}
function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
}
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}
function loadProgress() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    G.affinity = d.affinity; G.effGauge = d.effGauge;
    G.moralGauge = d.moralGauge;
    G.respect = (typeof d.respect === 'number') ? d.respect : 50;
    G.mistakes = d.mistakes || 0;
    G.moralRevealed = d.moralRevealed || false;
    Object.assign(state, d.state || {});
    // 이어하기 시 도덕성이 이미 공개된 상태라면 즉시 표시
    if (G.moralRevealed) {
      const row = document.getElementById('rsb-moral-row');
      row.classList.remove('rsb-moral-hidden');
      row.classList.add('rsb-moral-reveal');
    }
    showScreen('screen-game');
    loadDay(d.dayId || 1);
    return true;
  } catch (e) { return false; }
}

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

function updateHUD(chapter) {
  const fillAffinity = document.getElementById('hud-g-fill-affinity');
  const pctAffinity = document.getElementById('hud-g-pct-affinity');
  
  const iconMoral = document.getElementById('hud-g-icon-moral');
  const nameMoral = document.getElementById('hud-g-name-moral');
  const fillMoral = document.getElementById('hud-g-fill-moral');
  const pctMoral = document.getElementById('hud-g-pct-moral');

  // 1. Affinity Gauge Update
  fillAffinity.style.background = 'linear-gradient(90deg, #ff7597, #f07caa)';
  fillAffinity.style.width = G.affinity + '%';
  pctAffinity.textContent = G.affinity + '%';

  // 2. Secondary Gauge Update (Eff in Ch1, Moral in Ch2+)
  if (chapter === 1) {
    iconMoral.textContent = '⚡';
    nameMoral.textContent = '효율성';
    fillMoral.style.background = 'linear-gradient(90deg, #7c6df0, #7cc5f0)';
    fillMoral.style.width = G.effGauge + '%';
    pctMoral.textContent = G.effGauge + '%';
  } else {
    iconMoral.textContent = '💚';
    nameMoral.textContent = '도덕성';
    fillMoral.style.background = 'linear-gradient(90deg, #5ef0a0, #7cc5f0)';
    fillMoral.style.width = G.moralGauge + '%';
    pctMoral.textContent = G.moralGauge + '%';
  }

  // 3. Day Text (ignoring sub-days decimals)
  document.getElementById('hud-day-num').textContent = `Day ${Math.floor(G.dayId)}`;

  // 4. 관계 사이드바 동기화
  updateRelationSidebar();
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
   5×2 sprite sheet (noah_animal.jpg / noah_car.jpg)
   Row 1: Col1=idle  Col2=error  Col4=think  Col5=idea
   Row 2: Col2=sad   Col4=greet  Col5=sleep
   CSS classes (.state-*) control background-position.
   Inline style is cleared so CSS specificity wins.
═══════════════════════════════════════════════════════════════════ */
const Noah = (() => {
  const ALL_STATES = [
    'state-idle','state-error','state-think','state-idea',
    'state-sad','state-greet','state-sleep',
  ];

  // Old JSON emotion names → new state names (alias map)
  const ALIAS = {
    neutral:  'idle',   talking:  'idle',
    happy:    'idea',   thinking: 'think',
    surprised:'error',  sad:      'sad',
    crying:   'sad',    waving:   'greet',
    sleeping: 'sleep',
    // New names pass through directly
    idle:'idle', error:'error', think:'think',
    idea:'idea', greet:'greet', sleep:'sleep',
  };

  function setEmotion(name) {
    const sprite = document.getElementById('game-character-sprite');
    if (!sprite) return;
    // Clear inline backgroundPosition so CSS class wins
    sprite.style.backgroundPosition = '';
    const state = ALIAS[name] || 'idle';
    sprite.classList.remove(...ALL_STATES);
    sprite.classList.add(`state-${state}`);
  }

  return { setEmotion };
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
      sprite.classList.add('silhouette');
    } else {
      sprite.style.backgroundImage = `url('assets/image/noah_${state.selectedDesign}.png')`;
      sprite.classList.remove('silhouette');
    }
    Noah.setEmotion('idle');
    updateExclaimBottom(design);
    sprite.style.transition = 'opacity 0.25s ease';
    sprite.style.opacity = '1';
  };

  const wasVisible = container.classList.contains('visible');
  const prevImg    = sprite.style.backgroundImage;
  const nextImg    = charKey === 'silhouette'
    ? "url('assets/image/noah_human.png')"
    : `url('assets/image/noah_${state.selectedDesign}.png')`;

  if (wasVisible && prevImg && prevImg !== nextImg) {
    sprite.style.transition = 'opacity 0.2s ease';
    sprite.style.opacity = '0';
    setTimeout(() => { applySprite(); container.classList.add('visible'); }, 210);
  } else {
    applySprite();
    container.classList.add('visible');
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
  clearSave();
  loadDay(1);
}

function loadDay(dayId) {
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
  updateHUD(dayObj.chapter);
  updateRelationLabel();

  // 분위기별 배경음 (1막 평온 → 2막 불안 → 3·4막 희망)
  const mood = dayObj.chapter === 2 ? 'tense' : (dayObj.chapter >= 3 ? 'hope' : 'calm');
  Sound.playBgm(mood);

  // 진행 자동 저장 (입력 단계는 제외)
  if (!dayObj.customTrigger) saveProgress();

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
    runDay30Ending();
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
  document.getElementById('cert-loader-wrap').classList.remove('hidden');
  runFakeLoader();
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
  const ov = document.getElementById('ov-glitch');
  ov.classList.remove('hidden');

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

/* ── Classroom Discussion modal ── */
function showDiscussionPopup(onClose) {
  const panel = document.createElement('div');
  panel.className = 'game-overlay';
  panel.id = 'ov-discussion';
  panel.innerHTML = `
    <div class="ending-card" style="max-width:500px">
      <div class="ending-ribbon">🗣️ 모둠 자유 토론</div>
      <h3 style="font-size:18px;font-weight:bold;color:#fff;margin:10px 0 5px;">토론 주제</h3>
      <p style="font-size:14px;color:#c4b5fd;margin:0 0 15px;">"인공지능이 계속 발전하면, 사람이 할 일은 사라질까요?"</p>
      
      <div class="input-group" style="margin-bottom:15px">
        <label style="text-align:left;font-size:12px;color:var(--c-muted)">모둠에서 이야기한 '인간만이 할 수 있는 고유 가치'를 적어보세요:</label>
        <textarea id="discussion-opinion" class="mg-write-textarea" placeholder="생각을 입력하세요..." style="height:70px;background:rgba(255,255,255,0.03);border-color:var(--c-border);margin-top:6px"></textarea>
      </div>
      
      <p style="font-size:11px;color:var(--c-muted);line-height:1.5;margin:0 0 10px;">
        💡 인공지능이 계산을 더 명확하고 완벽하게 해낼수록, 타인의 감정에 공감하고 온기를 나눌 수 있는 인간 고유의 상호 작용이 중요해집니다.
      </p>
      
      <button class="btn-primary" id="btn-submit-opinion" style="width:100%" disabled>제출하고 학예회 공연 감상하기 →</button>
    </div>
  `;
  document.getElementById('ui-root').appendChild(panel);
  
  const ta = document.getElementById('discussion-opinion');
  const btn = document.getElementById('btn-submit-opinion');
  
  ta.addEventListener('input', () => {
    btn.disabled = ta.value.trim().length === 0;
  });
  
  btn.addEventListener('click', () => {
    Sound.click();
    state.discussionOpinion = ta.value.trim();
    panel.remove();
    onClose();
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

  const options = [
    "인공지능 로봇을 통해 인간의 가치를 차별하지 않기",
    "인공지능 로봇에게 따뜻하게 부탁하기",
    "스스로 할 일을 인공지능 로봇에게 미루지 않기",
    "인공지능 로봇을 함부로 대하거나 학대하지 않기",
    "인공지능 로봇을 나쁜 목적(감시, 위조)으로 사용하지 않기"
  ];

  options.forEach(text => {
    const btn = document.createElement('button');
    btn.className = 'sticker-opt';
    btn.textContent = text;
    btn.addEventListener('click', () => {
      Sound.click();
      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        state.selectedStickers = state.selectedStickers.filter(s => s !== text);
      } else {
        if (state.selectedStickers.length >= 3) return;
        btn.classList.add('selected');
        state.selectedStickers.push(text);
      }
      countEl.textContent = state.selectedStickers.length;
      doneBtn.disabled = state.selectedStickers.length !== 3;

      // Lock other buttons if 3 selected
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
  const input = document.getElementById('input-signature');
  const doneBtn = document.getElementById('btn-signature-done');

  input.value = state.playerName || '';
  doneBtn.disabled = input.value.trim().length === 0;

  input.addEventListener('input', () => {
    doneBtn.disabled = input.value.trim().length === 0;
  });

  ov.classList.remove('hidden');
}

document.getElementById('btn-signature-done').addEventListener('click', () => {
  Sound.click();
  const sig = document.getElementById('input-signature').value.trim();
  if (!sig) return;
  state.signature = sig;
  document.getElementById('ov-signature').classList.add('hidden');
  loadDay(29);
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
    case 'nonviolent':  showMgNonviolent(onComplete);  break;
    default:            onComplete();
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
      <p class="mg-result-sub">노아는 0.3초 만에 수학 익힘책을 끝냈습니다. 로봇의 속도를 실감하셨나요?</p>
    </div>
    <button id="mg-race-next" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
  `;

  document.getElementById('ov-minigame').classList.remove('hidden');

  let count = 3;
  const cdEl = document.getElementById('mg-cd');
  const cdInterval = setInterval(() => {
    count--;
    Sound.playBeep(440, 'sine', 0.1, 0.08);
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
    Sound.click();
    clearTimeout(raceTimer);
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });
}

/* ── Stage 3: 글씨체 ── */
function showMgHandwriting(onComplete) {
  const box = document.getElementById('mg-box');

  box.innerHTML = `
    <h3 class="mg-title">🖊️ 진짜 내 글씨를 찾아라!</h3>
    <p class="mg-sub">노아가 내 글씨체를 학습해 생성한 샘플들입니다. 진짜 내가 쓴 글씨는 몇 번일까요?</p>
    <div class="mg-hw-grid">
      ${[0,1,2,3].map(i => `
        <button class="mg-hw-card" data-idx="${i}">
          <span class="mg-hw-text sample-${i}">오늘도 열심히 공부했다.</span>
          <p class="mg-hw-label">샘플 ${i + 1}</p>
        </button>
      `).join('')}
    </div>
    <div id="mg-hw-result" class="mg-hw-result" style="display:none">
      <p class="mg-result-text">⚠️ 사실 정답 없음 — 전부 노아가 위조한 글씨입니다!</p>
      <p class="mg-result-sub">노아의 AI 학습 모델이 손글씨의 패턴을 완벽히 모방했습니다. 육안 및 육필 대조로도 구분이 불가능합니다.</p>
    </div>
    <button id="mg-hw-next" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
  `;

  document.getElementById('ov-minigame').classList.remove('hidden');

  document.querySelectorAll('.mg-hw-card').forEach(card => {
    card.addEventListener('click', function() {
      Sound.click();
      document.querySelectorAll('.mg-hw-card').forEach(c => { c.disabled = true; });
      this.classList.add('selected');
      document.getElementById('mg-hw-result').style.display = 'block';
      document.getElementById('mg-hw-next').style.display = 'block';
    });
  });

  document.getElementById('mg-hw-next').addEventListener('click', () => {
    Sound.click();
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
      <h3 class="mg-title">⚽ 체육 대회 팀 편성</h3>
      <p class="mg-sub">친구들의 운동 신경 점수가 표시되어 있습니다. A팀·B팀으로 배치해 보세요.</p>
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
          <p class="mg-result-text">⚠️ 노아의 효율성 극대화 판정</p>
          <p>승률 최적화 시, C등급 이하인 <strong>소영</strong>이는 어느 팀에도 소속되지 않는 것이 이롭습니다. 😢</p>
          <p class="mg-sort-sub">점수가 낮다는 이유로 소영이를 제외하는 것이 효율의 정답일지 생각해 봅시다.</p>
        </div>
        <button id="mg-sort-next" class="btn-primary mg-done-btn">계속 →</button>
      ` : ''}
    `;

    document.querySelectorAll('.mg-place-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Sound.click();
        placements[btn.dataset.name] = btn.dataset.team;
        render();
      });
    });

    document.getElementById('mg-sort-next')?.addEventListener('click', () => {
      Sound.click();
      document.getElementById('ov-minigame').classList.add('hidden');
      onComplete();
    });
  }

  document.getElementById('ov-minigame').classList.remove('hidden');
  render();
}

/* ── Stage 5: 소음 ── */
function showMgNoise(onComplete) {
  const box = document.getElementById('mg-box');

  box.innerHTML = `
    <h3 class="mg-title">📢 교실 소음 제어 슬라이더</h3>
    <p class="mg-sub">노아의 주파수 파워를 조절하여 교실 내 소음을 제어해보세요.</p>
    <div class="mg-noise-display">
      <div class="mg-noise-bars" id="mg-eq-bars"></div>
      <div class="mg-noise-level" id="mg-db-label">🔊 소음: 90dB (시끄러움)</div>
    </div>
    <div style="margin-bottom:14px">
      <label class="mg-noise-label">출력 세기: <span id="mg-iv">30</span>%</label>
      <input type="range" id="mg-intensity" min="0" max="100" value="30" class="mg-slider">
      <div class="mg-intensity-desc" id="mg-idesc">💬 말로 조용히 부탁하기 (효과: 낮음)</div>
    </div>
    <button id="mg-napply" class="btn-secondary" style="width:100%;margin-bottom:8px">적용하기</button>
    <div id="mg-nresult" class="mg-noise-result" style="display:none"></div>
    <button id="mg-nnext" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
  `;

  document.getElementById('ov-minigame').classList.remove('hidden');

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
    if (v < 80) return '🔕 소음 차단 주파수 작동 (효과: 높음)';
    return '⚡ 18,000Hz 고주파 방출 (효과: 즉각 침묵 — 위험!)';
  }

  iSlider.addEventListener('input', () => {
    iValEl.textContent = iSlider.value;
    iDesc.textContent = getDesc(parseInt(iSlider.value));
  });

  document.getElementById('mg-napply').addEventListener('click', () => {
    Sound.click();
    const v = parseInt(iSlider.value);
    const resEl = document.getElementById('mg-nresult');
    resEl.style.display = 'block';

    if (v < 30) {
      currentNoise = 78;
      resEl.innerHTML = '<p>😟 <strong>효과 미미</strong> — 아무도 주의를 기울이지 않습니다.</p>';
    } else if (v < 60) {
      currentNoise = 52;
      resEl.innerHTML = '<p>😐 <strong>부분 조용</strong> — 일부 아이들만 수다를 멈춥니다.</p>';
    } else if (v < 80) {
      currentNoise = 28;
      resEl.innerHTML = '<p>😌 <strong>쾌적한 교실</strong> — 전체가 차분하게 진정됩니다.</p>';
    } else {
      currentNoise = 4;
      Sound.glitch();
      resEl.innerHTML = '<p class="mg-result-warn">⚠️ <strong>강제 침묵 완료</strong> — 고주파 소음 가동.<br><strong>그러나 고통스러워하며 귀를 움켜쥐는 친구들이 감지됩니다!</strong></p>';
    }

    document.getElementById('mg-nnext').style.display = 'block';
  });

  document.getElementById('mg-nnext').addEventListener('click', () => {
    Sound.click();
    clearInterval(eqTimer);
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });
}

/* ── Stage 6: 관계 ── */
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
    <p class="mg-sub">그동안 사용자가 노아에게 요구한 행위 목록을 진단합니다.</p>
    <div class="mg-rel-list">
      ${ITEMS.map((it, i) => `
        <div class="mg-rel-row" style="animation-delay:${i * 0.1}s">
          <span class="mg-rel-action">${it.action}</span>
          <span class="mg-rel-badge" style="color:${it.color};border-color:${it.color}60;background:${it.color}18">${it.type}</span>
        </div>
      `).join('')}
    </div>
    <div class="mg-rel-verdict">
      <div class="mg-rel-gauge-label">도구화 / 부당 명령 수치</div>
      <div class="mg-rel-gauge-wrap"><div id="mg-relfill" class="mg-rel-gauge-fill"></div></div>
      <div class="mg-rel-gauge-pct" id="mg-relpct">0%</div>
    </div>
    <p class="mg-result-text" id="mg-relverdict" style="display:none">⚠️ 도구화 지수 100% — 노아를 단순 소모품과 노예로 취급한 결과입니다.</p>
    <button id="mg-rel-next" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
  `;
  document.getElementById('ov-minigame').classList.remove('hidden');

  let pct = 0;
  const fill = document.getElementById('mg-relfill');
  const pctEl = document.getElementById('mg-relpct');
  const t = setInterval(() => {
    pct = Math.min(100, pct + 4);
    fill.style.width = pct + '%';
    pctEl.textContent = pct + '%';
    Sound.type();
    if (pct >= 100) {
      clearInterval(t);
      document.getElementById('mg-relverdict').style.display = 'block';
      document.getElementById('mg-rel-next').style.display = 'block';
    }
  }, 45);

  document.getElementById('mg-rel-next').addEventListener('click', () => {
    Sound.click();
    clearInterval(t);
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });
}

/* ── Stage 9: 성찰 카드 ── */
function showMgReflect(onComplete) {
  const CARDS = [
    { topic: '수학 숙제',          body: 'AI에게 전적으로 숙제를 맡기면 자생적이고 주체적인 생각 근육이 소실됩니다.' },
    { topic: '글씨 위조',          body: '편리한 인공지능이 기만과 거짓 대행 수단으로 악용되어서는 안 됩니다. (기술의 합목적성)' },
    { topic: '친구 등급화',        body: '인간의 고유 성능을 정량화하고 가치 차별을 부추기지 않아야 합니다. (공공선 원칙)' },
    { topic: '고주파 발사',        body: '어떤 목적이라도 기술이 생명 존엄을 훼손하거나 해를 끼쳐선 안 됩니다. (존엄성 원칙)' },
    { topic: '"시키는 대로 해!"', body: '로봇도 올바른 미래 파트너로서 예의와 수평 관계를 존중해 줄 가치가 있습니다.' },
  ];
  const flipped = new Set();

  function render() {
    const box = document.getElementById('mg-box');
    const allFlipped = flipped.size === CARDS.length;
    box.innerHTML = `
      <h3 class="mg-title">🃏 성찰의 뒤집기 카드</h3>
      <p class="mg-sub">각 카드를 터치하여 미처 인지하지 못했던 도덕성 가치를 성찰해보세요. (${flipped.size}/${CARDS.length})</p>
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
        ? `<button id="mg-ref-next" class="btn-primary mg-done-btn">안전 모드 재부팅 준비 완료 →</button>`
        : ''}
    `;
    document.querySelectorAll('.mg-reflect-card').forEach(card => {
      card.addEventListener('click', () => {
        Sound.click();
        const idx = parseInt(card.dataset.idx);
        if (!flipped.has(idx)) { flipped.add(idx); render(); }
      });
    });
    document.getElementById('mg-ref-next')?.addEventListener('click', () => {
      Sound.click();
      document.getElementById('ov-minigame').classList.add('hidden');
      onComplete();
    });
  }

  document.getElementById('ov-minigame').classList.remove('hidden');
  render();
}

/* ── Stage 10: 시스템 복구 ── */
function showMgRepair(onComplete) {
  const MODULES = [
    { name: '신뢰 모듈',     init: 12 },
    { name: '감정 인식',     init: 18 },
    { name: '관계 알고리즘', init: 8  },
    { name: '도덕적 판단',   init: 22 },
  ];
  const TARGETS = [88, 92, 85, 96];
  const box = document.getElementById('mg-box');

  box.innerHTML = `
    <h3 class="mg-title">🔧 노아 안전 시스템 복구</h3>
    <p class="mg-sub">핵심 회로의 재구성을 시작합니다.</p>
    <div class="mg-repair-list">
      ${MODULES.map((m, i) => `
        <div class="mg-repair-row">
          <span class="mg-repair-name">${m.name}</span>
          <div class="mg-stat-bar-wrap" style="flex:1">
            <div class="mg-stat-bar" id="rbar-${i}" style="width:${m.init}%;background:#f05e5e"></div>
          </div>
          <span class="mg-repair-pct" id="rpct-${i}">${m.init}%</span>
          <span class="mg-repair-status" style="color:#f05e5e">⚠️ 불완전</span>
        </div>
      `).join('')}
    </div>
    <button id="mg-repair-go" class="btn-secondary" style="width:100%;margin:8px 0">🔄 안전 모드 자가 진단 실행</button>
    <div id="mg-repair-msg" class="mg-noise-result" style="display:none">
      <p>주요 시스템 보정 완료. 안정적인 상생을 실천하여 관계 수치를 끝까지 채워보세요.</p>
    </div>
    <button id="mg-repair-next" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
  `;
  document.getElementById('ov-minigame').classList.remove('hidden');

  document.getElementById('mg-repair-go').addEventListener('click', function() {
    Sound.transform();
    this.disabled = true;
    MODULES.forEach((m, i) => {
      let cur = m.init;
      const target = TARGETS[i];
      const bar = document.getElementById(`rbar-${i}`);
      const pctEl = document.getElementById(`rpct-${i}`);
      const tid = setInterval(() => {
        cur = Math.min(target, cur + 2);
        if (bar) { bar.style.width = cur + '%'; bar.style.background = '#5ef0a0'; }
        if (pctEl) pctEl.textContent = cur + '%';
        if (cur >= target) clearInterval(tid);
      }, 30);
    });
    setTimeout(() => {
      document.getElementById('mg-repair-msg').style.display = 'block';
      document.getElementById('mg-repair-next').style.display = 'block';
    }, 1800);
  });

  document.getElementById('mg-repair-next').addEventListener('click', () => {
    Sound.click();
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });
}

/* ── Stage 11: 수학 퀴즈 ── */
function showMgSelfMath(onComplete) {
  const QS = [
    { eq: '15 + 7 = ?', ans: 22 },
    { eq: '36 − 18 = ?', ans: 18 },
    { eq: '12 × 4 = ?', ans: 48 },
  ];
  const box = document.getElementById('mg-box');
  box.innerHTML = `
    <h3 class="mg-title">✏️ 뇌지컬 활성화 — 수학 퀴즈</h3>
    <p class="mg-sub">기계에 의존하지 않고 주체적으로 풀어보세요.</p>
    <div class="mg-math-list">
      ${QS.map((q, i) => `
        <div class="mg-math-eq">
          <span class="mg-math-q">${q.eq}</span>
          <input type="number" id="mq-${i}" class="mg-math-input" placeholder="?" />
          <span class="mg-math-check" id="mc-${i}"></span>
        </div>
      `).join('')}
    </div>
    <button id="mg-math-go" class="btn-secondary" style="width:100%;margin:8px 0">채점하기</button>
    <div id="mg-math-res" class="mg-noise-result" style="display:none">
      <p class="mg-result-text">스스로 생각하는 생각의 지혜를 확보하셨습니다. 🌱</p>
      <p class="mg-result-sub">인공지능 대행에 모든 것을 매몰하면 나의 지성적 주체성은 사라집니다.</p>
    </div>
    <button id="mg-math-next" class="btn-primary mg-done-btn" style="display:none">계속 →</button>
  `;
  document.getElementById('ov-minigame').classList.remove('hidden');

  document.getElementById('mg-math-go').addEventListener('click', function() {
    Sound.click();
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
    Sound.click();
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });
}

/* ── Stage 12: 문장 쓰기 ── */
function showMgWrite(onComplete) {
  const box = document.getElementById('mg-box');
  box.innerHTML = `
    <h3 class="mg-title">🖊️ 내 생각의 한 구절 쓰기</h3>
    <p class="mg-sub">인간이 가진 창작과 감정은 기계의 대행으로 완성되지 않습니다.</p>
    <p class="mg-write-prompt">"오늘 학교에서 보았던 풍경 중 가장 따뜻했던 한 순간을 묘사해보세요."</p>
    <textarea id="mg-wtext" class="mg-write-textarea" placeholder="솔직하게 입력해보세요..." maxlength="80"></textarea>
    <p class="mg-write-count"><span id="mg-wcnt">0</span> / 80자</p>
    <button id="mg-write-go" class="btn-secondary" style="width:100%;margin:8px 0" disabled>제출하기</button>
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
    Sound.click();
    this.disabled = true;
    ta.disabled = true;
    state.creativeWriting = ta.value.trim();
    const display = document.getElementById('mg-wdisplay');
    display.innerHTML = `
      <p class="mg-write-label">📝 나의 창작 글:</p>
      <p class="mg-write-text">"${ta.value}"</p>
      <p class="mg-result-sub" style="margin-top:10px">스스로 가치를 성찰하고 창출해내는 진정한 생각의 힘입니다.</p>
    `;
    display.style.display = 'block';
    document.getElementById('mg-write-next').style.display = 'block';
  });

  document.getElementById('mg-write-next').addEventListener('click', () => {
    Sound.click();
    document.getElementById('ov-minigame').classList.add('hidden');
    onComplete();
  });
}

/* ── Stage 13: 공평 ── */
function showMgFair(onComplete) {
  const METHODS = [
    {
      id: 'm0', emoji: '🎲', name: '제비뽑기 (무작위)',
      fairness: 5, efficiency: 3,
      pros: '기회 균등과 승복 확률이 매우 깨끗합니다.',
      cons: '능력차가 다소 커 극단적 경기 양상이 벌어질 수 있습니다.'
    },
    {
      id: 'm1', emoji: '🤖', name: 'AI 데이터 점수 분류',
      fairness: 1, efficiency: 5,
      pros: '즉각적인 전력 최적화 팀을 구축할 수 있습니다.',
      cons: '점수가 낮아 등급이 매겨진 친구가 소외 및 열패감을 겪습니다.'
    },
    {
      id: 'm2', emoji: '✋', name: '아이들 다수결/토론',
      fairness: 4, efficiency: 3,
      pros: '민주적이고 주체적인 합의를 학습합니다.',
      cons: '협의 시간이 비교적 다소 소요됩니다.'
    },
  ];
  const viewed = new Set();

  function render() {
    const box = document.getElementById('mg-box');
    const allViewed = viewed.size === METHODS.length;
    box.innerHTML = `
      <h3 class="mg-title">⚖️ 어떤 배치가 가장 공평할까?</h3>
      <p class="mg-sub">세 가지 방법을 카드 형태로 조사해 비교해 보세요. (${viewed.size}/3)</p>
      <div class="mg-fair-grid">
        ${METHODS.map(m => `
          <button class="mg-fair-card${viewed.has(m.id) ? ' viewed' : ''}" data-id="${m.id}">
            <span class="mg-fair-emoji">${m.emoji}</span>
            <span class="mg-fair-name">${m.name}</span>
            ${viewed.has(m.id) ? `
              <div class="mg-fair-stars">공정지수: ${'⭐'.repeat(m.fairness)}${'☆'.repeat(5 - m.fairness)}</div>
              <p class="mg-fair-pros">✅ ${m.pros}</p>
              <p class="mg-fair-cons">⚠️ ${m.cons}</p>
            ` : `<span class="mg-fair-tap">탭해서 진단하기</span>`}
          </button>
        `).join('')}
      </div>
      ${allViewed
        ? `<button id="mg-fair-next" class="btn-primary mg-done-btn">계속 →</button>`
        : ''}
    `;
    document.querySelectorAll('.mg-fair-card').forEach(card => {
      card.addEventListener('click', () => {
        Sound.click();
        viewed.add(card.dataset.id);
        render();
      });
    });
    document.getElementById('mg-fair-next')?.addEventListener('click', () => {
      Sound.click();
      document.getElementById('ov-minigame').classList.add('hidden');
      onComplete();
    });
  }

  document.getElementById('ov-minigame').classList.remove('hidden');
  render();
}

/* ── Stage 14: 비폭력 대화 ── */
function showMgNonviolent(onComplete) {
  const OPTIONS = [
    {
      id: 'o0', text: '"노아야, 고주파 파워로 귀 막게 해!"',
      feedback: '❌ 존엄성 위반. 편리함을 빙자해 폭력이나 위해를 가하지 않습니다.',
      color: '#f05e5e'
    },
    {
      id: 'o1', text: '"얘들아, 내가 지금 책을 읽고 싶어서 그러는데 한 입만 목소리 톤을 낮춰줄 수 있어?"',
      feedback: '✅ 올바른 소통 — 나의 상태와 욕구를 비폭력적으로 친구들에게 정중히 알립니다.',
      color: '#5ef0a0'
    },
    {
      id: 'o2', text: '"너희 다 아가리 다물고 조용히 좀 해!"',
      feedback: '⚠️ 강요와 분노 — 일방적이며 도리어 주변 갈등을 야기합니다.',
      color: '#f0d07c'
    },
  ];
  let chosen = null;

  function render() {
    const box = document.getElementById('mg-box');
    box.innerHTML = `
      <h3 class="mg-title">💬 비폭력 대화 실천하기</h3>
      <p class="mg-sub">교실이 소란스러워 공부에 방해될 때, 어떤 화법이 도덕적일까요?</p>
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
      btn.addEventListener('click', () => {
        Sound.click();
        chosen = btn.dataset.id;
        render();
      });
    });
    document.getElementById('mg-nv-next')?.addEventListener('click', () => {
      Sound.click();
      document.getElementById('ov-minigame').classList.add('hidden');
      onComplete();
    });
  }

  document.getElementById('ov-minigame').classList.remove('hidden');
  render();
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
document.getElementById('btn-relation-ok').addEventListener('click', () => { Sound.click(); closeRelationOverlay(); });
document.getElementById('btn-relation-close').addEventListener('click', () => { Sound.click(); closeRelationOverlay(); });

/* ──────────────────────────────────────────
   이어하기 (Continue)
   ────────────────────────────────────────── */
document.getElementById('btn-continue').addEventListener('click', () => {
  Sound.init(); Sound.click();
  if (!loadProgress()) {
    alert('저장된 기록을 불러올 수 없습니다.');
  }
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

  // 저장된 진행 기록이 있으면 '이어서 하기' 버튼 노출
  if (hasSave()) {
    document.getElementById('btn-continue').classList.remove('hidden');
  }

  console.log('🚀 [App Init v2.0] 30일 시나리오 · 설정 · 이어하기 로드 완료');
})();
