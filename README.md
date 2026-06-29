# chaos-zaqqum-timer-fe

Smoke Timer(암살단 타이머)의 **프론트엔드**. 실시간 협동 쿨다운 추적기로,
백엔드(`chaos-zaqqum-timer-be`)의 REST + WebSocket(STOMP) 채널을 소비합니다.

- 디자인: [amsaldan 라이브 버전](https://amsaldan.dothome.co.kr/) 및 `../chaos-zaqqum-timer-be/spec_ko.md §3` 기준
- 연동 계약: `../chaos-zaqqum-timer-be/docs/frontend-contract.md`

## 기술 스택

| 구분 | 내용 |
| --- | --- |
| Framework | Next.js 16 (App Router, TypeScript) |
| 상태 관리 | Zustand |
| 실시간 | `@stomp/stompjs` (WebSocket + STOMP) |
| 스타일 | CSS 변수 기반 디자인 토큰(`globals.css`) + 인라인 스타일 |

## 실행

```bash
npm install
npm run dev      # http://localhost:3000
```

백엔드를 먼저 띄워야 방 생성/입장이 동작합니다(기본 `http://localhost:8088`).

### 환경 변수 (`.env.local`)

| 키 | 기본값 | 설명 |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE` | `http://localhost:8088` | 백엔드 REST 베이스 |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8088/ws` | STOMP 핸드셰이크 |

> 백엔드 CORS 허용 origin 에 `http://localhost:3000` 이 포함되어 있어야 합니다
> (`application.yml` 의 `app.cors.allowed-origins`).

## 구조

```
src/
├── app/                  # layout, globals.css(디자인 토큰), page(로비/타이머 분기)
├── lib/
│   ├── types.ts          # 연동 계약 타입
│   ├── skills.ts         # 스킬 4종 지속시간 규칙
│   ├── time.ts           # serverTime 앵커링 + MM:SS 계산
│   ├── api.ts            # REST 클라이언트
│   └── socket.ts         # STOMP 래퍼 (room-token CONNECT, 구독/발행)
├── store/useRoomStore.ts # zustand: 연결/스냅샷/delta 적용/커맨드/커스텀타이머
├── hooks/useTick.ts      # 카운트다운 리렌더 틱(100ms)
└── components/
    ├── Lobby.tsx         # 방 목록(3s 폴링)·생성·삭제·입장
    ├── TimerScreen.tsx   # 방 배너·파티·하단바·Create Timer·Save/Load
    ├── PartySection.tsx  # 파티 + 드래그앤드롭 재정렬 + 삭제 모드
    ├── SmokeSlotCard.tsx # 260×120 스킬 카드(닉네임·아이콘·MM:SS·레벨·초기화)
    ├── SkillIcon.tsx     # 파이-스윕 canvas 아이콘
    ├── CustomTimerPanel.tsx # 커스텀 타이머(로컬 전용, 미동기화)
    └── Modal.tsx         # 공통 모달
```

## 동작 원칙 (백엔드 계약 반영)

- **서버 권위 타이머**: 서버가 주는 `startTs + maxDur` 만 신뢰하고, 남은 시간은
  매 메시지의 `serverTime` 으로 시계를 앵커링해 클라가 계산한다(`lib/time.ts`).
- **카드 단위 delta**: 변경된 엔티티만 수신/적용해 동시 편집 충돌을 피한다.
- **커스텀 타이머·TTS·깜빡임**은 클라 로컬 책임(서버 미동기화).

## 알려진 제약 (MVP)

- **Load(.smoke 불러오기)**: 파일 파싱까지만 동작. 방으로의 일괄 적용은 백엔드의
  bulk-import 커맨드가 필요해 보류(Save 는 정상 동작).
- 일부 연동 항목(룸 토큰 전송 방식 등)은 계약서의 ⚠️ 항목을 따르며, 백엔드 확정 시
  `lib/socket.ts`·`lib/api.ts` 어댑터만 조정하면 된다.
