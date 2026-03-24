# AI Collaboration 🤖

**여러 AI 모델이 실시간으로 토론하거나 협업 논의를 펼치는 멀티 에이전트 웹앱**

Claude, GPT-4o, Gemini가 각자의 페르소나를 가지고 한 주제에 대해 대화를 이어갑니다.  
브라우저에서 바로 실행되며, API 키만 있으면 됩니다.

---

## 데모

### ⚔ 토론 모드
네 명의 AI가 서로 다른 관점에서 주제를 놓고 토론합니다.

| 역할 | 성격 |
|------|------|
| 분석가 | 논리·데이터 중심의 체계적 분석 |
| 비전가 | 창의적·미래지향적 가능성 제시 |
| 현실주의자 | 실용적·구체적 실현 가능성 중심 |
| 악마의 변호인 | 항상 반론, 허점 공격, 날카로운 비판 |

### 🤝 협업 모드
네 명의 전문가가 하나의 문제를 함께 해결해 나갑니다.

| 역할 | 성격 |
|------|------|
| 기획자 | 문제 구조화 및 요구사항 정의 |
| 개발자 | 기술적 구현 방안 제시 |
| 디자이너 | UX·사용자 경험 관점 |
| 비즈니스 전략가 | 비용·수익·시장 현실 검토 |

---

## 시작하기

### 사전 조건

- [Node.js](https://nodejs.org) LTS 버전 이상

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/your-username/ai-collaboration.git
cd ai-collaboration

# 2. 프록시 서버 실행 (GPT-4o / Gemini 사용 시 필요)
node proxy-server.js

# 3. 브라우저에서 열기
open ai-collaboration.html   # macOS
# 또는 파일 탐색기에서 ai-collaboration.html 더블클릭
```

> **Claude만 사용하는 경우** 프록시 서버 없이 바로 실행 가능합니다.

---

## API 키 발급

> 모든 API는 유료입니다. 단, 토론 1회 비용은 수십 원 수준으로 매우 저렴합니다.

| 모델 | 발급 경로 | 키 형식 | 비고 |
|------|----------|---------|------|
| **Claude** | [console.anthropic.com](https://console.anthropic.com) → API Keys | `sk-ant-...` | 신규 가입 시 무료 크레딧 제공 |
| **GPT-4o** | [platform.openai.com](https://platform.openai.com/api-keys) → API Keys | `sk-proj-...` | 프록시 서버 필요 |
| **Gemini** | [aistudio.google.com](https://aistudio.google.com) → API 키 → 결제 설정 | `AIzaSy...` | 프록시 서버 필요 |

입력한 API 키는 브라우저 `localStorage`에 저장되며, 서버로 전송되지 않습니다.

---

## 아키텍처

```
ai-collaboration.html        # 메인 UI (단일 파일, 의존성 없음)
proxy-server.js             # 로컬 CORS 프록시 (Node.js 내장 모듈만 사용)
```

### 왜 프록시 서버가 필요한가?

브라우저 보안 정책(CORS)상 OpenAI·Google API는 브라우저에서 직접 호출이 차단됩니다.  
`proxy-server.js`는 이를 우회하기 위한 로컬 중계 서버로, 외부 npm 패키지 없이 Node.js 내장 모듈(`http`, `https`)만 사용합니다.

Anthropic(Claude)은 `anthropic-dangerous-direct-browser-access` 헤더를 통해 브라우저 직접 호출을 허용하므로 프록시가 불필요합니다.

### 멀티 에이전트 동작 원리

```
[사용자: 주제 입력]
        ↓
[오케스트레이터 (startDebate)]
        ↓
  라운드 1~N 순환
  ┌─────────────────────┐
  │ 에이전트 A (분석가) │ → API 호출 → 응답 → history에 추가
  │ 에이전트 B (비전가) │ → 이전 전체 history 포함하여 API 호출
  │ 에이전트 C (현실)   │ → 이전 전체 history 포함하여 API 호출
  │ 에이전트 D (악마)   │ → 이전 전체 history 포함하여 API 호출
  └─────────────────────┘
        ↓
[진행자: Claude API로 클로징 멘트 자동 생성]
```

각 에이전트는 **독립적인 system prompt(페르소나)**와 **공유 대화 히스토리**를 가집니다.  
히스토리는 최근 6개 발언만 전달하여 토큰 비용을 관리합니다.

---

## 주요 기능

- **모드 전환** — 토론 ↔ 협업 모드를 헤더에서 즉시 전환
- **모델 선택** — 비전가·현실주의자 슬롯을 Claude / GPT-4o / Gemini 중 선택
- **API 키 저장** — localStorage 자동 저장, 페이지 재시작 후에도 유지
- **중단 기능** — 토론 진행 중 언제든 중단 가능
- **진행자 클로징** — 토론·논의 종료 후 Claude가 자동으로 요점 정리
- **역할별 고정 색상** — 어떤 모델을 선택해도 역할 색상은 유지

---

## 트러블슈팅

| 오류 | 원인 | 해결 |
|------|------|------|
| `Failed to fetch` | 프록시 서버 미실행 | `node proxy-server.js` 실행 |
| `quota exceeded` | API 크레딧 소진 | 해당 서비스 결제 페이지에서 충전 |
| `API key not valid` | 키 오류 또는 공백 포함 | 키 재입력 (복사 시 공백 주의) |
| `model not found` | 모델명 deprecated | 최신 모델명으로 코드 수정 필요 |
| `spending cap exceeded` | 프로젝트 지출 한도 초과 | AI Studio → 지출 → 한도 상향 |

---

## 로드맵

- [ ] 사용자 정의 페르소나 편집 기능
- [ ] 토론 내용 내보내기 (Markdown / PDF)
- [ ] 라운드별 중간 요약 (협업 모드)
- [ ] 더 많은 전문가 슬롯 추가 (최대 6명)
- [ ] 음성 출력 (TTS) 연동

---

## 라이선스

MIT License — 자유롭게 사용, 수정, 배포 가능합니다.

---

## 기여

PR과 이슈는 언제나 환영합니다.  
새로운 페르소나 아이디어, 버그 리포트, 기능 제안 모두 좋습니다.