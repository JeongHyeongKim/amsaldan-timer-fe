"use client";

import { useEffect, useRef } from "react";
import { SKILLS } from "@/lib/skills";
import type { SkillType } from "@/lib/types";

const SIZE = 68;

/**
 * 파이-스윕 아이콘 (spec §2.2.3). 대기=흑백, 실행 중=12시부터 시계방향 컬러 노출,
 * 완료=전체 컬러. 자체 도형(스킬 색 + 글자)로 그린다(원본 이미지 미사용).
 */
export function SkillIcon({
  skillType,
  progress,
  onClick,
}: {
  skillType: SkillType;
  progress: number; // 0(idle) ~ 1(finished)
  onClick?: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const skill = SKILLS[skillType];

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const r = SIZE / 2 - 4;

    const draw = (color: string) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = "#14141f";
      ctx.font = "bold 30px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(skill.letter, cx, cy + 1);
    };

    ctx.clearRect(0, 0, SIZE, SIZE);
    // 흑백 베이스
    draw("#6b6b7a");

    // 컬러 스윕: 12시(-π/2)에서 시계방향으로 progress 만큼
    const clamped = Math.max(0, Math.min(1, progress));
    if (clamped > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + clamped * Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      draw(skill.color);
      ctx.restore();
    }
  }, [skillType, progress, skill.color, skill.letter]);

  return (
    <canvas
      ref={ref}
      width={SIZE}
      height={SIZE}
      onClick={onClick}
      style={{ width: SIZE, height: SIZE, cursor: onClick ? "pointer" : "default" }}
      title={skill.label}
    />
  );
}
