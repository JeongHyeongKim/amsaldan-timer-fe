"use client";

import { useMemo, useRef, useState } from "react";
import { CustomTimerPanel } from "@/components/CustomTimerPanel";
import { Field, Modal } from "@/components/Modal";
import { PartySection } from "@/components/PartySection";
import { SKILLS, SKILL_ORDER } from "@/lib/skills";
import type { RoomSnapshot, SkillType } from "@/lib/types";
import { useRoomStore } from "@/store/useRoomStore";

export function TimerScreen() {
  const roomName = useRoomStore((s) => s.roomName);
  const parties = useRoomStore((s) => s.parties);
  const connected = useRoomStore((s) => s.connected);
  const send = useRoomStore((s) => s.send);
  const leaveRoom = useRoomStore((s) => s.leaveRoom);

  const [unfolded, setUnfolded] = useState(false);
  const [timerModal, setTimerModal] = useState(false);
  const [skillType, setSkillType] = useState<SkillType>("smoke");
  const [level, setLevel] = useState(1);
  const [partyId, setPartyId] = useState("");
  const [nickname, setNickname] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const anyRunning = useMemo(
    () => parties.some((p) => p.slots.some((s) => s.startTs != null)),
    [parties],
  );

  const openTimerModal = () => {
    if (parties.length === 0) {
      alert("Please create a party first.");
      return;
    }
    setPartyId(parties[0].partyId);
    setTimerModal(true);
  };

  const submitTimer = () => {
    send({ type: "slot.create", partyId, skillType, level, nickname });
    setTimerModal(false);
    setNickname("");
    setLevel(1);
  };

  const onSave = () => {
    if (anyRunning) {
      alert("Stop all timers before saving.");
      return;
    }
    const snapshot: RoomSnapshot = { version: 3, partyCounter: parties.length, parties };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smoke_timer.smoke";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onLoadClick = () => {
    if (anyRunning) {
      alert("Stop all timers before loading.");
      return;
    }
    fileInput.current?.click();
  };

  const onFile = async (file: File) => {
    try {
      JSON.parse(await file.text()) as RoomSnapshot;
      // NOTE: 실시간 백엔드에는 아직 일괄 import 커맨드가 없어 방으로 푸시하지 못한다.
      // (frontend-contract §4.4 / 백엔드 후속 작업 필요)
      alert("불러오기 파싱 성공. 단, 방으로의 일괄 적용은 백엔드 bulk-import 커맨드가 필요합니다(MVP 범위 외).");
    } catch {
      alert("올바른 .smoke 파일이 아닙니다.");
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* 방 배너 (sticky) */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "5px 12px",
          background: "var(--bg-deep)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span style={{ color: "var(--text-dim)" }}>Room: {roomName}</span>
        <span style={{ fontSize: "9pt", color: connected ? "var(--timer-green)" : "var(--timer-red)" }}>
          ● {connected ? "연결됨" : "연결 중…"}
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={() => send({ type: "room.resetAll" })}>Reset Time</button>
        <button style={{ background: "var(--bg-card)" }} onClick={leaveRoom}>
          Leave Room
        </button>
      </header>

      {/* 메인 */}
      <main style={{ flex: 1, overflowY: "auto", padding: 8, paddingBottom: 60 }}>
        {parties.length === 0 && (
          <p style={{ color: "var(--text-dim)" }}>
            파티가 없습니다. 하단의 <b>Create Party</b> 로 시작하세요.
          </p>
        )}
        {parties.map((party) => (
          <PartySection key={party.partyId} party={party} />
        ))}
        {unfolded && <CustomTimerPanel />}
      </main>

      {/* 하단 바 (고정) */}
      <footer
        style={{
          position: "sticky",
          bottom: 0,
          display: "flex",
          gap: 8,
          padding: 6,
          background: "var(--bg-page)",
          borderTop: "1px solid var(--border)",
          zIndex: 100,
        }}
      >
        <button onClick={() => send({ type: "party.create" })}>Create Party</button>
        <button onClick={openTimerModal}>Create Timer</button>
        <button onClick={onSave}>Save</button>
        <button onClick={onLoadClick}>Load</button>
        <div style={{ flex: 1 }} />
        <button style={{ background: "var(--bg-card)" }} onClick={() => setUnfolded((v) => !v)}>
          {unfolded ? "Fold ▲" : "Unfold ▼"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".smoke,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </footer>

      {timerModal && (
        <Modal title="Create Timer" onCancel={() => setTimerModal(false)} onOk={submitTimer}>
          <Field label="Skill Type">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {SKILL_ORDER.map((st) => (
                <label key={st} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text)" }}>
                  <input
                    type="radio"
                    name="skillType"
                    checked={skillType === st}
                    onChange={() => {
                      setSkillType(st);
                      setLevel((l) => Math.min(l, SKILLS[st].maxLevel));
                    }}
                  />
                  {SKILLS[st].label} (max {SKILLS[st].maxLevel})
                </label>
              ))}
            </div>
          </Field>
          <Field label={`Skill Level (1–${SKILLS[skillType].maxLevel})`}>
            <input
              type="number"
              min={1}
              max={SKILLS[skillType].maxLevel}
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
            />
          </Field>
          <Field label="Party">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {parties.map((p) => (
                <label key={p.partyId} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text)" }}>
                  <input
                    type="radio"
                    name="party"
                    checked={partyId === p.partyId}
                    onChange={() => setPartyId(p.partyId)}
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Nickname (선택)">
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </Field>
        </Modal>
      )}
    </div>
  );
}
