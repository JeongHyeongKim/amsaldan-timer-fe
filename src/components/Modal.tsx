"use client";

import type { ReactNode } from "react";

// spec §3.5 모달: 백드롭(z 60000) + 박스.
export function Modal({
  title,
  children,
  onCancel,
  onOk,
  okLabel = "OK",
  okDisabled = false,
}: {
  title: string;
  children: ReactNode;
  onCancel: () => void;
  onOk?: () => void;
  okLabel?: string;
  okDisabled?: boolean;
}) {
  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        zIndex: 60000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "var(--bg-page)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "20px 24px",
          minWidth: 290,
          maxWidth: 420,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ fontSize: "13pt", fontWeight: "bold", color: "var(--title)", marginBottom: 16 }}>
          {title}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <button style={{ background: "var(--bg-card)" }} onClick={onCancel}>
            Cancel
          </button>
          {onOk && (
            <button onClick={onOk} disabled={okDisabled}>
              {okLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "10pt", color: "var(--text-dim)" }}>
      {label}
      {children}
    </label>
  );
}
