"use client";

import { useEffect, useRef, useState } from "react";
import { SKILLS } from "@/lib/skills";
import type { SkillType } from "@/lib/types";

const SIZE = 68;

// 스킬별 아이콘 이미지 (public/skills). BE 루트에서 받은 메이플 스킬 PNG.
const SRC: Record<SkillType, string> = {
  smoke: "/skills/smoke.png",
  threat: "/skills/threat.png",
  hyperBody: "/skills/hyperBody.png",
  resurrection: "/skills/resurrection.png",
};

interface Asset {
  color: HTMLImageElement;
  gray: HTMLCanvasElement | null;
  grayBuilt: boolean;
}

// 이미지/흑백 캔버스를 스킬 공통으로 캐시(카드가 많아도 1회만 로드/변환).
const cache = new Map<string, Asset>();

function getAsset(src: string): Asset {
  let asset = cache.get(src);
  if (!asset) {
    const color = new Image();
    color.src = src;
    asset = { color, gray: null, grayBuilt: false };
    cache.set(src, asset);
  }
  return asset;
}

// 컬러 이미지를 흑백 캔버스로 사전 변환(ctx.filter 미지원 브라우저에서도 동작).
function buildGray(asset: Asset) {
  if (asset.grayBuilt) return;
  asset.grayBuilt = true;
  const off = document.createElement("canvas");
  off.width = SIZE;
  off.height = SIZE;
  const octx = off.getContext("2d");
  if (!octx) return;
  octx.drawImage(asset.color, 0, 0, SIZE, SIZE);
  try {
    const image = octx.getImageData(0, 0, SIZE, SIZE);
    const p = image.data;
    for (let i = 0; i < p.length; i += 4) {
      const g = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
      p[i] = p[i + 1] = p[i + 2] = g;
    }
    octx.putImageData(image, 0, 0);
    asset.gray = off;
  } catch {
    // getImageData 실패(예외적) 시 흑백 없이 컬러 베이스로 폴백
    asset.gray = null;
  }
}

/**
 * 파이-스윕 아이콘 (spec §2.2.3). 대기=흑백, 실행 중=12시부터 시계방향으로 컬러 노출,
 * 완료=전체 컬러. 실제 스킬 PNG(public/skills)를 사용한다.
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
  const src = SRC[skillType];
  const [, force] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const clamped = Math.max(0, Math.min(1, progress));
    const asset = getAsset(src);

    // 이미지 로드 실패/미완료 시 폴백: 색 원 + 글자 (기존 동작 유지)
    const drawFallback = () => {
      const r = SIZE / 2 - 4;
      const paint = (color: string) => {
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
      paint("#6b6b7a");
      if (clamped > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + clamped * Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        paint(skill.color);
        ctx.restore();
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      const ready = asset.color.complete && asset.color.naturalWidth > 0;
      if (!ready) {
        drawFallback();
        return;
      }
      buildGray(asset);

      // 흑백 베이스
      if (asset.gray) ctx.drawImage(asset.gray, 0, 0);
      else ctx.drawImage(asset.color, 0, 0, SIZE, SIZE);

      // 컬러 스윕: 12시(-π/2)에서 시계방향으로 progress 만큼. 반지름을 크게 잡아
      // progress=1 이면 정사각 아이콘 전체가 컬러로 덮이도록 한다.
      if (clamped > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, SIZE, -Math.PI / 2, -Math.PI / 2 + clamped * Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(asset.color, 0, 0, SIZE, SIZE);
        ctx.restore();
      }
    };

    render();

    // 아직 로딩 중이면 로드 완료 시 재렌더
    if (!(asset.color.complete && asset.color.naturalWidth > 0)) {
      const onLoad = () => force((n) => n + 1);
      asset.color.addEventListener("load", onLoad);
      return () => asset.color.removeEventListener("load", onLoad);
    }
  }, [skillType, progress, src, skill]);

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
