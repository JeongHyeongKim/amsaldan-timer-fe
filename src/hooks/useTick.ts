import { useEffect, useState } from "react";

/** 카운트다운 표시를 주기적으로 다시 그리기 위한 틱(기본 100ms, spec §2.2.3). */
export function useTick(intervalMs = 100): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 1_000_000), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}
