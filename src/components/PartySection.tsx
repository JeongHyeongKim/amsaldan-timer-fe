"use client";

import { useRef, useState } from "react";
import { SmokeSlotCard } from "@/components/SmokeSlotCard";
import type { Party } from "@/lib/types";
import { useRoomStore } from "@/store/useRoomStore";

export function PartySection({ party }: { party: Party }) {
  const send = useRoomStore((s) => s.send);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteWholeParty, setDeleteWholeParty] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const rowRef = useRef<HTMLDivElement>(null);

  const toggleCheck = (slotId: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });

  const exitDeleteMode = () => {
    setDeleteMode(false);
    setDeleteWholeParty(false);
    setChecked(new Set());
  };

  const confirmDelete = () => {
    if (deleteWholeParty) {
      send({ type: "party.delete", partyId: party.partyId });
    } else {
      checked.forEach((slotId) => send({ type: "slot.delete", slotId }));
    }
    exitDeleteMode();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const slotId = e.dataTransfer.getData("text/slotId");
    if (!slotId) return;
    let index = party.slots.length;
    const cards = Array.from(rowRef.current?.querySelectorAll<HTMLElement>("[data-slot-card]") ?? []);
    for (let i = 0; i < cards.length; i++) {
      const r = cards[i].getBoundingClientRect();
      if (e.clientX < r.left + r.width / 2) {
        index = i;
        break;
      }
    }
    send({ type: "slot.move", slotId, toPartyId: party.partyId, toIndex: index });
  };

  return (
    <section style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px" }}>
        <span style={{ fontSize: "11pt", fontWeight: "bold", color: "var(--text-dim)" }}>
          {party.name}
        </span>
        {deleteMode ? (
          <>
            <button onClick={confirmDelete}>Confirm</button>
            <button style={{ background: "var(--bg-card)" }} onClick={exitDeleteMode}>
              Cancel
            </button>
            <label style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--delete-label)" }}>
              <input
                type="checkbox"
                checked={deleteWholeParty}
                onChange={(e) => setDeleteWholeParty(e.target.checked)}
                style={{ accentColor: "var(--accent)" }}
              />
              Delete entire party
            </label>
          </>
        ) : (
          <button style={{ background: "var(--bg-card)" }} onClick={() => setDeleteMode(true)}>
            Delete
          </button>
        )}
      </div>

      <div
        ref={rowRef}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 9,
          padding: "4px 6px",
          minHeight: 40,
        }}
      >
        {party.slots.map((slot) => (
          <div data-slot-card key={slot.slotId} style={{ opacity: deleteMode && checked.has(slot.slotId) ? 0.5 : 1 }}>
            <SmokeSlotCard
              slot={slot}
              deleteMode={deleteMode}
              checked={checked.has(slot.slotId)}
              onToggleCheck={toggleCheck}
            />
          </div>
        ))}
        {party.slots.length === 0 && (
          <span style={{ color: "var(--text-dim)", padding: 8 }}>슬롯이 없습니다. Create Timer 로 추가하세요.</span>
        )}
      </div>
    </section>
  );
}
