import type { SkillType } from "./types";

// spec_ko.md §2.2.2 스킬 규칙. maxDur 은 서버 권위지만, 레벨 조정 UI 의 즉시
// 미리보기를 위해 동일 규칙을 클라에도 둔다.
export const SKILLS: Record<
  SkillType,
  { label: string; maxLevel: number; color: string; letter: string }
> = {
  smoke: { label: "Smoke", maxLevel: 30, color: "#7da0ff", letter: "S" },
  threat: { label: "Threat", maxLevel: 20, color: "#ff8a8a", letter: "T" },
  hyperBody: { label: "Hyper Body", maxLevel: 30, color: "#ffcc66", letter: "H" },
  resurrection: { label: "Resurrection", maxLevel: 10, color: "#b98aff", letter: "R" },
};

export const SKILL_ORDER: SkillType[] = ["smoke", "threat", "hyperBody", "resurrection"];

export function clampLevel(skillType: SkillType, level: number): number {
  return Math.max(1, Math.min(SKILLS[skillType].maxLevel, level));
}

// 연막탄(Smoke) 지속 시간(초). 쿨다운(maxDur, 고정 600초)과 별개로 연막 효과가
// 유지되는 시간이며 레벨에 비례한다. Lv1 → 31초 … Lv30 → 60초 (= 30 + level).
export function smokeDurationSeconds(level: number): number {
  return 30 + clampLevel("smoke", level);
}

export function maxDurSeconds(skillType: SkillType, level: number): number {
  const lvl = clampLevel(skillType, level);
  switch (skillType) {
    case "smoke":
      return 600;
    case "threat":
      return 80;
    case "hyperBody":
      return 10 + (lvl - 1) * 5;
    case "resurrection":
      return (60 - 3 * lvl) * 60;
  }
}
