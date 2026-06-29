// docs/frontend-contract.md 의 전송 계약과 1:1 대응하는 타입들.

export type SkillType = "smoke" | "threat" | "hyperBody" | "resurrection";
export type SlotState = "idle" | "running" | "finished";

export interface Slot {
  slotId: string;
  nickname: string;
  skillType: SkillType;
  level: number;
  maxDur: number; // 초. 서버 산출
  startTs: number | null; // epoch ms. idle 이면 null
  state: SlotState;
}

export interface Party {
  partyId: string;
  name: string;
  slots: Slot[];
}

export interface RoomSnapshot {
  version: number; // .smoke 파일 스키마 버전(3)
  partyCounter: number;
  parties: Party[];
}

export interface RoomSummary {
  roomId: string;
  name: string;
  memberCount?: number;
  lastActive: number;
}

export interface EnterRoomResult {
  roomToken: string;
  expiresAt: number;
  snapshot: RoomSnapshot;
}

// 서버 → 클라 봉투 (§4.1)
export interface RoomEvent {
  type:
    | "snapshot"
    | "room.reset"
    | "slot.upserted"
    | "slot.removed"
    | "party.upserted"
    | "party.removed";
  version: number;
  serverTime: number;
  partyId?: string;
  index?: number;
  slot?: Slot;
  slotId?: string;
  party?: Party;
  data?: RoomSnapshot;
}

// 클라 → 서버 커맨드 (§4.2)
export type RoomCommand =
  | { type: "slot.start"; slotId: string }
  | { type: "slot.reset"; slotId: string }
  | { type: "slot.setLevel"; slotId: string; level: number }
  | { type: "slot.setNickname"; slotId: string; nickname: string }
  | { type: "slot.create"; partyId: string; skillType: SkillType; level: number; nickname: string }
  | { type: "slot.delete"; slotId: string }
  | { type: "slot.move"; slotId: string; toPartyId: string; toIndex: number }
  | { type: "party.create" }
  | { type: "party.delete"; partyId: string }
  | { type: "room.resetAll" };

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

// 커스텀 타이머 (클라 로컬 전용, §7 — 서버와 동기화하지 않음)
export interface CustomTimer {
  id: string;
  name: string;
  duration: number; // 초
  startTs: number | null;
}

export interface CustomCategory {
  id: string;
  name: string;
  timers: CustomTimer[];
}
