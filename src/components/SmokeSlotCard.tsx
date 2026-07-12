"use client";

import { useEffect, useRef, useState } from "react";
import { SkillIcon } from "@/components/SkillIcon";
import { useExpiryTts } from "@/hooks/useExpiryTts";
import { useTick } from "@/hooks/useTick";
import { SKILLS, smokeDurationSeconds } from "@/lib/skills";
import { deriveState, formatMMSS, remainingMillis, serverNow } from "@/lib/time";
import type { Slot } from "@/lib/types";
import { useRoomStore } from "@/store/useRoomStore";

export function SmokeSlotCard({
  slot,
  deleteMode,
  checked,
  onToggleCheck,
}: {
  slot: Slot;
  deleteMode: boolean;
  checked: boolean;
  onToggleCheck: (slotId: string) => void;
}) {
  useTick();
  const send = useRoomStore((s) => s.send);
  const clockOffset = useRoomStore((s) => s.clockOffset);

  const [nick, setNick] = useState(slot.nickname);
  const [ttsOn, setTtsOn] = useState(slot.skillType === "smoke");
  const focused = useRef(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 연막 만료 10초 전 TTS 카운팅 경고 (카드 단위 토글, Smoke 전용)
  useExpiryTts(slot, clockOffset, ttsOn);

  // 외부(서버) 갱신은 입력 중이 아닐 때만 반영해 타이핑을 덮어쓰지 않는다.
  useEffect(() => {
    if (!focused.current) setNick(slot.nickname);
  }, [slot.nickname]);

  const remaining = remainingMillis(slot, clockOffset);
  const state = deriveState(slot, clockOffset);
  const progress = slot.startTs == null ? 0 : Math.min(1, 1 - remaining / (slot.maxDur * 1000));
  const finished = state === "finished";
  const skill = SKILLS[slot.skillType];

  // 연막탄 전용: 쿨다운(maxDur, 600초)과 별개인 "지속 시간" 남은 값.
  // idle 이면 레벨 기준 전체 지속 시간을, running 이면 startTs 기준 남은 시간을 표시한다.
  const isSmoke = slot.skillType === "smoke";
  const smokeDurMs = smokeDurationSeconds(slot.level) * 1000;
  const durationRemaining =
    slot.startTs == null ? smokeDurMs : smokeDurMs - (serverNow(clockOffset) - slot.startTs);
  // 지속 효과가 살아있는 동안 마지막 10초 → 테두리 경고 깜빡임
  const durationWarn =
    isSmoke && slot.startTs != null && durationRemaining > 0 && durationRemaining <= 10_000;
  const durationEnded = isSmoke && slot.startTs != null && durationRemaining <= 0;

  const onNickChange = (value: string) => {
    setNick(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      send({ type: "slot.setNickname", slotId: slot.slotId, nickname: value });
    }, 2000); // §2.3 닉네임 2초 디바운스
  };

  const changeLevel = (delta: number) => {
    const next = Math.max(1, Math.min(skill.maxLevel, slot.level + delta));
    if (next !== slot.level) send({ type: "slot.setLevel", slotId: slot.slotId, level: next });
  };

  return (
    <div
      className={durationWarn ? "smoke-duration-warn" : undefined}
      style={{
        position: "relative",
        width: 260,
        height: 120,
        background: "var(--bg-card)",
        border: `2px solid ${finished ? "var(--finished-border)" : "var(--border)"}`,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      {/* 닉네임 입력 (전체 너비) */}
      <input
        type="text"
        value={nick}
        placeholder="Nickname"
        onFocus={() => (focused.current = true)}
        onBlur={() => (focused.current = false)}
        onChange={(e) => onNickChange(e.target.value)}
        style={{
          width: "100%",
          padding: "4px 26px 4px 4px",
          fontSize: 13,
          fontWeight: "bold",
          border: "none",
          borderBottom: "1px solid var(--border)",
          borderRadius: 0,
        }}
      />

      {/* 우측 상단: 삭제 모드면 Del 체크박스, 아니면 (연막) TTS 토글 + ↺ 초기화 */}
      {deleteMode ? (
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggleCheck(slot.slotId)}
          title="Del"
          style={{ position: "absolute", top: 5, right: 5, accentColor: "var(--accent)" }}
        />
      ) : (
        <>
          {slot.skillType === "smoke" && (
            <button
              onClick={() => setTtsOn((v) => !v)}
              title={ttsOn ? "TTS 경고 끄기 (만료 10초 전)" : "TTS 경고 켜기 (만료 10초 전)"}
              style={{
                position: "absolute",
                top: 3,
                right: 30,
                padding: "2px 6px",
                background: "transparent",
                opacity: ttsOn ? 1 : 0.45,
              }}
            >
              {ttsOn ? "🔊" : "🔇"}
            </button>
          )}
          <button
            onClick={() => send({ type: "slot.reset", slotId: slot.slotId })}
            title="Reset this card"
            style={{ position: "absolute", top: 3, right: 3, padding: "2px 6px", background: "transparent" }}
          >
            ↺
          </button>
        </>
      )}

      {/* 본문: 아이콘 | 타이머 | 레벨 컨트롤 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 6px" }}>
        <SkillIcon
          skillType={slot.skillType}
          progress={finished ? 1 : progress}
          onClick={() => send({ type: "slot.start", slotId: slot.slotId })}
        />

        <div
          draggable
          onDragStart={(e) => e.dataTransfer.setData("text/slotId", slot.slotId)}
          title="드래그하여 이동"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "grab",
            userSelect: "none",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 32,
              fontWeight: "bold",
              lineHeight: 1,
              color: finished ? "var(--timer-red)" : "var(--timer-green)",
            }}
          >
            {formatMMSS(remaining)}
          </div>
          {/* 연막탄 전용: 쿨다운과 별개인 지속 시간(레벨별 31~60초). §1 알려진 이슈 대응 */}
          {isSmoke && (
            <div
              title="연막 지속 시간 (레벨에 비례, 쿨다운과 별개)"
              style={{
                marginTop: 2,
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                fontWeight: "bold",
                lineHeight: 1,
                color: durationWarn
                  ? "var(--timer-red)"
                  : durationEnded
                    ? "var(--text-dim)"
                    : "var(--title)",
              }}
            >
              지속 {formatMMSS(durationRemaining)}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <button onClick={() => changeLevel(1)} style={{ width: 26, height: 20, padding: 0 }}>
            ▲
          </button>
          <span style={{ minWidth: 28, textAlign: "center", fontWeight: "bold" }}>{slot.level}</span>
          <button onClick={() => changeLevel(-1)} style={{ width: 26, height: 20, padding: 0 }}>
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}
