# Architecture

## 파일 구조

```
ai-collaboration/
├── ai-collaboration.html    # 메인 앱 (UI + 클라이언트 로직)
├── proxy-server.js         # 로컬 CORS 프록시
├── package.json
├── README.md
├── CHANGELOG.md
├── LICENSE
└── docs/
    └── ARCHITECTURE.md     # 이 문서
```

## 핵심 설계 원칙

### 1. 단일 파일 UI
`ai-collaboration.html` 하나로 전체 UI와 클라이언트 로직을 담았습니다. 빌드 툴 없이 브라우저에서 바로 실행됩니다.

### 2. 최소 의존성 프록시
`proxy-server.js`는 Node.js 내장 모듈(`http`, `https`)만 사용합니다. `npm install` 없이 바로 실행됩니다.

### 3. 클라이언트 사이드 키 관리
API 키는 브라우저 `localStorage`에만 저장됩니다. 외부 서버로 키가 전송되는 일은 없습니다.

---

## 멀티 에이전트 루프

```
startDebate()
  └─ for round in 1..N
       └─ for agent in [claude, slot1, slot2, devil]
            ├─ buildPrompt(history[-6:], topic)   // 최근 6개 히스토리 슬라이딩
            ├─ callModel(agent)                    // API 호출 (Anthropic / OpenAI / Gemini)
            ├─ addMsg(display, text)               // UI 렌더링
            └─ history.push({name, role, text})   // 공유 히스토리 축적

generateClosing(history, topic)
  └─ Claude API → 진행자 클로징 멘트 생성
```

### 히스토리 슬라이딩
전체 히스토리를 그대로 전달하면 라운드가 쌓일수록 입력 토큰이 선형 증가합니다.  
최근 6개 발언만 전달하여 토큰 비용을 일정하게 유지합니다.

---

## 모드 시스템

`MODES` 객체에 토론/협업 설정이 선언적으로 정의됩니다:

```js
MODES = {
  debate: {
    personas: { claude, gpt, gemini, devil },
    buildPrompt(hist, topic) { ... },
    closingSystem,
    hostStart(topic, rounds, names),
    ...
  },
  collab: { ... }
}
```

`setMode(mode)` 호출 시:
1. UI 텍스트 전체 갱신 (레이블, 플레이스홀더, 버튼)
2. `MODELS[]` 배열의 `role`, `persona` 필드 업데이트
3. 현재 상태 `localStorage`에 저장

---

## API 호출 라우팅

```
callModel(m, hist, topic)
  ├─ slot1/slot2 → slotMeta(slot) → 런타임 apiType 결정
  ├─ apiType === 'anthropic' → callAnthropic()  [직접 호출]
  ├─ apiType === 'openai'    → callOpenAI()     [프록시 경유]
  └─ apiType === 'gemini'    → callGemini()     [프록시 경유]
```

### 프록시 라우팅
```
브라우저 → localhost:3131/proxy/openai  → api.openai.com
브라우저 → localhost:3131/proxy/gemini/... → generativelanguage.googleapis.com
```

---

## 색상 시스템

역할별 고정 색상으로 어떤 모델을 선택해도 역할이 시각적으로 구분됩니다.

| 역할 | 색상 |
|------|------|
| 분석가 / 기획자 | `#a78bfa` (보라) |
| 비전가 / 개발자 | `#34d399` (초록) |
| 현실주의자 / 디자이너 | `#60a5fa` (파랑) |
| 악마의 변호인 / 비즈니스 전략가 | `#f87171` (빨강) |