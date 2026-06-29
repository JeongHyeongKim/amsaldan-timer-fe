import { useEffect, useRef } from "react";
import { remainingMillis } from "@/lib/time";
import type { Slot } from "@/lib/types";

interface Tracker {
  startTs: number | null;
  spoken: Set<string>;
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ko-KR";
  window.speechSynthesis.speak(utter);
}

/**
 * 연막(Smoke) 타이머가 꺼지기 10초 전부터 TTS 카운팅 경고를 한다 (spec_ko.md §2.3 만료 경고).
 * - 남은 시간이 10초가 되면 "10초 남았습니다"
 * - 이후 3 / 2 / 1 초에 각각 "삼" "이" "일" 카운트
 * 각 안내는 한 번의 실행(run, startTs)당 1회만 발화한다. 타이머가 재시작되면 초기화.
 * <p>카드 단위로 켜고 끌 수 있으며(enabled), Smoke 스킬에만 적용된다.
 */
export function useExpiryTts(slot: Slot, clockOffset: number, enabled: boolean) {
  const tracker = useRef<Tracker>({ startTs: null, spoken: new Set() });

  useEffect(() => {
    if (!enabled || slot.skillType !== "smoke" || slot.startTs == null) return;

    // 새 실행이면 발화 기록 초기화
    if (tracker.current.startTs !== slot.startTs) {
      tracker.current = { startTs: slot.startTs, spoken: new Set() };
    }
    const spoken = tracker.current.spoken;
    const once = (key: string, text: string) => {
      if (!spoken.has(key)) {
        spoken.add(key);
        speak(text);
      }
    };

    const secs = Math.ceil(remainingMillis(slot, clockOffset) / 1000);
    if (secs <= 10 && secs > 3) once("warn10", "10초 남았습니다");
    if (secs <= 3) once("3", "삼");
    if (secs <= 2) once("2", "이");
    if (secs <= 1) once("1", "일");
  });
}
