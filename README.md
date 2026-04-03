# AI Collaboration 🤖

**여러 AI 모델이 실시간으로 토론하거나 협업 논의를 펼치는 멀티 에이전트 웹앱**

Claude, GPT-4o, Gemini가 각자의 페르소나를 가지고 한 주제에 대해 대화를 이어갑니다.

---

## 데모

### ⚔ 토론 모드
| 역할 | 성격 |
|------|------|
| 분석가 | 논리·데이터 중심의 체계적 분석 |
| 비전가 | 창의적·미래지향적 가능성 제시 |
| 현실주의자 | 실용적·구체적 실현 가능성 중심 |
| 악마의 변호인 | 항상 반론, 허점 공격, 날카로운 비판 |

### 🤝 협업 모드
| 역할 | 성격 |
|------|------|
| 기획자 | 문제 구조화 및 요구사항 정의 |
| 개발자 | 기술적 구현 방안 제시 |
| 디자이너 | UX·사용자 경험 관점 |
| 비즈니스 전략가 | 비용·수익·시장 현실 검토 |

---

## 실행 방법

### 방법 1 — Vercel 배포 (Node.js 설치 불필요, 권장)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rookiejj/ai_collaboration)

또는 직접 배포:
```bash
npm i -g vercel
vercel
```

> Vercel 배포 시 `proxy-server.js` 실행 없이 GPT-4o · Gemini 모두 바로 사용 가능합니다.

---

### 방법 2 — 로컬 실행 (Node.js 필요)

```bash
# 1. 저장소 클론
git clone https://github.com/rookiejj/ai_collaboration.git
cd ai_collaboration

# 2. 프록시 서버 실행 (GPT-4o / Gemini 사용 시 필요)
node proxy-server.js
# 또는
npm start

# 3. 브라우저에서 열기
open public/ai-collaboration.html   # macOS
# Windows: 파일 탐색기에서 public/ai-collaboration.html 더블클릭
```

> Claude만 사용하는 경우 프록시 서버 없이 바로 실행 가능합니다.

---

## API 키 발급

> 토론 1회 비용은 수십 원 수준으로 매우 저렴합니다.

| 모델 | 발급 경로 | 키 형식 | 비고 |
|------|----------|---------|------|
| **Claude** | [console.anthropic.com](https://console.anthropic.com) → API Keys | `sk-ant-...` | 신규 가입 시 무료 크레딧 제공 |
| **GPT-4o** | [platform.openai.com](https://platform.openai.com/api-keys) | `sk-proj-...` | 유료 결제 필요 |
| **Gemini** (`gemini-2.5-flash`) | [aistudio.google.com](https://aistudio.google.com) → API 키 → 결제 설정 | `AIzaSy...` | 결제 계정 연결 필요 |

입력한 API 키는 브라우저 `localStorage`에만 저장됩니다. 외부 서버로 전송되지 않습니다.

---

## 파일 구조

```
ai_collaboration/
├── public/
│   └── ai-collaboration.html   # 메인 앱 (UI 전체, 의존성 없음)
├── api/
│   ├── openai.js               # Vercel: OpenAI CORS 프록시
│   └── gemini.js               # Vercel: Gemini CORS 프록시
├── proxy-server.js             # 로컬 실행용 CORS 프록시
├── vercel.json                 # Vercel 배포 설정
├── package.json
├── README.md
├── CHANGELOG.md
├── LICENSE
└── docs/
    └── ARCHITECTURE.md
```

---

## 아키텍처

```
[브라우저]
    │
    ├── Claude API ─────────────────────────→ api.anthropic.com  (직접 호출)
    │
    ├── GPT-4o
    │     ├── 로컬:  localhost:3131/proxy/openai  ──→ api.openai.com
    │     └── Vercel: /api/openai ────────────────→ api.openai.com
    │
    └── Gemini
          ├── 로컬:  localhost:3131/proxy/gemini/... ──→ generativelanguage.googleapis.com
          └── Vercel: /api/gemini?model=...&key=...  ──→ generativelanguage.googleapis.com
```

`location.hostname`으로 로컬/배포 환경을 자동 감지해 적절한 엔드포인트를 선택합니다.

### 멀티 에이전트 동작 원리

```
[사용자: 주제 입력]
        ↓
[오케스트레이터 (startDebate)]
        ↓
  라운드 1~N 순환
  ┌──────────────────────────────┐
  │ 에이전트 A (분석가/기획자)   │ → API 호출 → 응답 → history 추가
  │ 에이전트 B (비전가/개발자)   │ → 이전 history 포함 API 호출
  │ 에이전트 C (현실주의자/디자이너) │ → 이전 history 포함 API 호출
  │ 에이전트 D (악마/전략가)     │ → 이전 history 포함 API 호출
  └──────────────────────────────┘
        ↓
[진행자: Claude API로 클로징 멘트/액션 아이템 자동 생성]
```

---

## 주요 기능

- **모드 전환** — 토론 ↔ 협업 헤더 토글
- **모델 선택** — 슬롯별 Claude / GPT-4o / Gemini 선택
- **라운드 수 조절** — 2~5 라운드 선택 가능
- **파일 첨부** — PDF / 이미지 / 텍스트 파일 최대 3개 첨부, 이미지·스캔 PDF는 OCR(Tesseract.js) 자동 처리
- **PDF 저장** — 토론 완료 후 전체 대화를 프린트/PDF로 저장
- **API 키 자동 저장** — localStorage 유지
- **중단 기능** — 진행 중 언제든 중단 가능
- **진행자 클로징** — 종료 후 Claude가 자동으로 요점 정리
- **역할별 고정 색상** — 모델 변경해도 색상 유지
- **자동 재시도** — 서버 과부하(overloaded / rate_limit) 시 최대 3회 자동 재시도
- **모바일 반응형** — 하단 탭바 + 드로어 메뉴로 모바일 최적화
- **Vercel / 로컬 자동 감지** — 환경에 따라 API 경로 자동 전환

---

## 트러블슈팅

| 오류 | 원인 | 해결 |
|------|------|------|
| `Failed to fetch` | 로컬에서 프록시 서버 미실행 | `node proxy-server.js` 실행 |
| `quota exceeded` | API 크레딧 소진 | 해당 서비스 결제 페이지에서 충전 |
| `API key not valid` | 키 오류 또는 공백 포함 | 키 재입력 |
| `model not found` | 모델 deprecated | 최신 모델명으로 코드 수정 |
| `spending cap exceeded` | 프로젝트 지출 한도 초과 | AI Studio → 지출 → 한도 상향 |

---

## 로드맵

- [ ] 사용자 정의 페르소나 편집
- [ ] 토론 내용 내보내기 (Markdown / PDF)
- [ ] 라운드별 중간 요약 (협업 모드)
- [ ] 전문가 슬롯 추가 (최대 6명)
- [ ] 음성 출력 (TTS) 연동

---

## 라이선스

MIT License — 자유롭게 사용, 수정, 배포 가능합니다.

---

## 기여

PR과 이슈는 언제나 환영합니다. 새로운 페르소나 아이디어, 버그 리포트, 기능 제안 모두 좋습니다.