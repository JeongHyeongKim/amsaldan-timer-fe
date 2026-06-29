"use client";

import { Lobby } from "@/components/Lobby";
import { TimerScreen } from "@/components/TimerScreen";
import { useRoomStore } from "@/store/useRoomStore";

export default function Home() {
  const screen = useRoomStore((s) => s.screen);
  return screen === "room" ? <TimerScreen /> : <Lobby />;
}
