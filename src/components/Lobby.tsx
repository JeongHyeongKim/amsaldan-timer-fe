"use client";

import { useEffect, useState } from "react";
import { Field, Modal } from "@/components/Modal";
import { ApiError } from "@/lib/api";
import { useRoomStore } from "@/store/useRoomStore";

type Dialog = "create" | "delete" | "join" | null;

export function Lobby() {
  const rooms = useRoomStore((s) => s.rooms);
  const selectedRoomId = useRoomStore((s) => s.selectedRoomId);
  const selectRoom = useRoomStore((s) => s.selectRoom);
  const refreshRooms = useRoomStore((s) => s.refreshRooms);
  const createRoom = useRoomStore((s) => s.createRoom);
  const deleteRoom = useRoomStore((s) => s.deleteRoom);
  const joinRoom = useRoomStore((s) => s.joinRoom);

  const [dialog, setDialog] = useState<Dialog>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  // 로비 표시 동안 방 목록 3초 폴링 (§2.1.1)
  useEffect(() => {
    refreshRooms();
    const id = setInterval(refreshRooms, 3000);
    return () => clearInterval(id);
  }, [refreshRooms]);

  const selectedRoom = rooms.find((r) => r.roomId === selectedRoomId) ?? null;

  const close = () => {
    setDialog(null);
    setName("");
    setPassword("");
  };

  const handle = async (fn: () => Promise<void>) => {
    try {
      await fn();
      close();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "요청에 실패했습니다.");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50000,
        background: "var(--bg-page)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 760, padding: "48px 28px", display: "flex", flexDirection: "column", gap: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "26pt", fontWeight: "bold", letterSpacing: 2, color: "var(--title)" }}>
            SMOKE TIMER
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--text-dim)" }}>암살단 타이머 · 실시간 협동 쿨다운 추적</p>
        </div>

        <p style={{ margin: 0, color: "var(--text-dim)" }}>Click a room to select it</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {rooms.length === 0 && <span style={{ color: "var(--text-dim)" }}>방이 없습니다. Create Room 으로 만드세요.</span>}
          {rooms.map((room) => {
            const selected = room.roomId === selectedRoomId;
            return (
              <button
                key={room.roomId}
                onClick={() => selectRoom(room.roomId)}
                style={{
                  width: 160,
                  height: 80,
                  borderRadius: 6,
                  background: "var(--bg-card)",
                  border: `2px solid ${selected ? "var(--selected)" : "var(--border)"}`,
                  boxShadow: selected ? "0 0 10px #00ff9966" : "none",
                  fontSize: "12pt",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: 6,
                }}
              >
                {room.name}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="big" onClick={() => setDialog("create")}>
            Create Room
          </button>
          <button className="big" style={{ background: "var(--bg-card)" }} disabled={!selectedRoom} onClick={() => setDialog("delete")}>
            Delete Room
          </button>
          <button className="big" disabled={!selectedRoom} onClick={() => setDialog("join")}>
            Join
          </button>
        </div>
      </div>

      {dialog === "create" && (
        <Modal
          title="Create Room"
          onCancel={close}
          okDisabled={!name.trim() || !password}
          onOk={() => handle(() => createRoom(name.trim(), password).then(() => undefined))}
        >
          <Field label="Room Name">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label="Password">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
        </Modal>
      )}

      {dialog === "delete" && selectedRoom && (
        <Modal
          title={`Delete Room — ${selectedRoom.name}`}
          onCancel={close}
          okLabel="Delete"
          okDisabled={!password}
          onOk={() => handle(() => deleteRoom(selectedRoom.roomId, password))}
        >
          <Field label="Password">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          </Field>
        </Modal>
      )}

      {dialog === "join" && selectedRoom && (
        <Modal
          title={`Join — ${selectedRoom.name}`}
          onCancel={close}
          okLabel="Join"
          okDisabled={!password}
          onOk={() => handle(() => joinRoom(selectedRoom.roomId, selectedRoom.name, password))}
        >
          <Field label="Password">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          </Field>
        </Modal>
      )}
    </div>
  );
}
