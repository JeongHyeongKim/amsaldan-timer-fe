"use client";

import { useState } from "react";
import { Field, Modal } from "@/components/Modal";
import { useTick } from "@/hooks/useTick";
import { formatMMSS } from "@/lib/time";
import type { CustomTimer } from "@/lib/types";
import { useRoomStore } from "@/store/useRoomStore";

function CustomCard({
  timer,
  categoryId,
  deleteMode,
}: {
  timer: CustomTimer;
  categoryId: string;
  deleteMode: boolean;
}) {
  useTick();
  const start = useRoomStore((s) => s.startCustomTimer);
  const remove = useRoomStore((s) => s.deleteCustomTimer);

  const remaining =
    timer.startTs == null ? timer.duration * 1000 : timer.duration * 1000 - (Date.now() - timer.startTs);
  const finished = remaining <= 0 && timer.startTs != null;

  return (
    <div
      style={{
        position: "relative",
        width: 180,
        height: 120,
        background: "var(--bg-card)",
        border: `2px solid ${finished ? "var(--finished-border)" : "var(--border)"}`,
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: 5,
      }}
    >
      {deleteMode && (
        <input
          type="checkbox"
          onChange={() => remove(categoryId, timer.id)}
          style={{ position: "absolute", top: 5, right: 5, accentColor: "var(--accent)" }}
        />
      )}
      <div
        style={{ fontWeight: "bold", fontSize: 20, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        title={timer.name}
      >
        {timer.name}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 32,
          fontWeight: "bold",
          color: finished ? "var(--timer-red)" : "var(--timer-green)",
        }}
      >
        {formatMMSS(remaining)}
      </div>
      <button onClick={() => start(categoryId, timer.id)}>Start</button>
    </div>
  );
}

export function CustomTimerPanel() {
  const categories = useRoomStore((s) => s.customCategories);
  const addCategory = useRoomStore((s) => s.addCategory);
  const deleteCategory = useRoomStore((s) => s.deleteCategory);
  const addTimer = useRoomStore((s) => s.addCustomTimer);

  const [deleteMode, setDeleteMode] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [timerModal, setTimerModal] = useState<string | null>(null);
  const [timerName, setTimerName] = useState("");
  const [timerDuration, setTimerDuration] = useState(60);

  return (
    <div style={{ background: "var(--bg-deep)", padding: 8, borderTop: "1px solid var(--border)" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button onClick={() => setCatModal(true)}>+ Create Category</button>
        <button style={{ background: "var(--bg-card)" }} onClick={() => setDeleteMode((v) => !v)}>
          Delete
        </button>
        <span style={{ alignSelf: "center", color: "var(--text-dim)" }}>
          커스텀 타이머는 방과 동기화되지 않습니다 (로컬 전용).
        </span>
      </div>

      {categories.map((cat) => (
        <div key={cat.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: "bold", color: "var(--text-dim)" }}>{cat.name}</span>
            <button onClick={() => setTimerModal(cat.id)}>+ Create Timer</button>
            {deleteMode && (
              <label style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--delete-label)" }}>
                <input type="checkbox" onChange={() => deleteCategory(cat.id)} style={{ accentColor: "var(--accent)" }} />
                Del category
              </label>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
            {cat.timers.map((t) => (
              <CustomCard key={t.id} timer={t} categoryId={cat.id} deleteMode={deleteMode} />
            ))}
          </div>
        </div>
      ))}

      {catModal && (
        <Modal
          title="Create Category"
          onCancel={() => {
            setCatModal(false);
            setCatName("");
          }}
          onOk={() => {
            if (catName.trim()) addCategory(catName.trim());
            setCatModal(false);
            setCatName("");
          }}
          okDisabled={!catName.trim()}
        >
          <Field label="Category Name">
            <input type="text" value={catName} onChange={(e) => setCatName(e.target.value)} autoFocus />
          </Field>
        </Modal>
      )}

      {timerModal && (
        <Modal
          title="Create Timer"
          onCancel={() => setTimerModal(null)}
          onOk={() => {
            if (timerName.trim() && timerDuration > 0) {
              addTimer(timerModal, timerName.trim(), timerDuration);
            }
            setTimerModal(null);
            setTimerName("");
            setTimerDuration(60);
          }}
          okDisabled={!timerName.trim() || timerDuration <= 0}
        >
          <Field label="Timer Name">
            <input type="text" value={timerName} onChange={(e) => setTimerName(e.target.value)} autoFocus />
          </Field>
          <Field label="Duration (seconds)">
            <input
              type="number"
              value={timerDuration}
              min={1}
              onChange={(e) => setTimerDuration(Number(e.target.value))}
            />
          </Field>
        </Modal>
      )}
    </div>
  );
}
