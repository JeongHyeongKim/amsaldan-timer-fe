import type { Slot } from "./types";

// MM:SS 포맷 (만료 시 00:00)
export function formatMMSS(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// 서버 시간 앵커링: clockOffset 은 수신한 serverTime 으로 갱신된다(§6).
export function serverNow(clockOffset: number): number {
  return Date.now() + clockOffset;
}

// 남은 시간(ms). idle 이면 maxDur 전체.
export function remainingMillis(slot: Slot, clockOffset: number): number {
  if (slot.startTs == null) {
    return slot.maxDur * 1000;
  }
  return slot.maxDur * 1000 - (serverNow(clockOffset) - slot.startTs);
}

// startTs/maxDur 로부터 상태를 파생 (서버 state 와 일치하지만 틱마다 클라가 재계산).
export function deriveState(slot: Slot, clockOffset: number): Slot["state"] {
  if (slot.startTs == null) return "idle";
  return remainingMillis(slot, clockOffset) <= 0 ? "finished" : "running";
}
