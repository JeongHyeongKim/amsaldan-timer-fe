import { create } from "zustand";
import { api } from "@/lib/api";
import { RoomSocket } from "@/lib/socket";
import type {
  CustomCategory,
  Party,
  RoomCommand,
  RoomEvent,
  RoomSummary,
  Slot,
} from "@/lib/types";

// 소켓은 직렬화 대상이 아니므로 모듈 스코프에 보관한다.
let socket: RoomSocket | null = null;
let idSeq = 0;
const localId = (p: string) => `${p}_${Date.now()}_${idSeq++}`;

interface RoomState {
  screen: "lobby" | "room";
  rooms: RoomSummary[];
  selectedRoomId: string | null;

  roomId: string | null;
  roomName: string;
  parties: Party[];
  version: number;
  clockOffset: number;
  connected: boolean;
  errorMessage: string | null;

  customCategories: CustomCategory[];

  refreshRooms: () => Promise<void>;
  selectRoom: (id: string | null) => void;
  createRoom: (name: string, password: string) => Promise<string>;
  deleteRoom: (id: string, password: string) => Promise<void>;
  joinRoom: (id: string, name: string, password: string) => Promise<void>;
  leaveRoom: () => void;
  send: (command: RoomCommand) => void;
  clearError: () => void;

  addCategory: (name: string) => void;
  deleteCategory: (id: string) => void;
  addCustomTimer: (categoryId: string, name: string, duration: number) => void;
  startCustomTimer: (categoryId: string, timerId: string) => void;
  deleteCustomTimer: (categoryId: string, timerId: string) => void;
}

function relocateSlot(parties: Party[], slot: Slot, partyId: string, index: number): Party[] {
  const cleaned = parties.map((p) => ({
    ...p,
    slots: p.slots.filter((s) => s.slotId !== slot.slotId),
  }));
  return cleaned.map((p) => {
    if (p.partyId !== partyId) return p;
    const slots = [...p.slots];
    const at = Math.max(0, Math.min(slots.length, index));
    slots.splice(at, 0, slot);
    return { ...p, slots };
  });
}

function applyEvent(state: RoomState, e: RoomEvent): Partial<RoomState> {
  const clockOffset = e.serverTime - Date.now();

  if (e.type === "snapshot" || e.type === "room.reset") {
    if (e.data && e.version >= state.version) {
      return { parties: e.data.parties, version: e.version, clockOffset };
    }
    return { clockOffset };
  }

  if (e.version <= state.version) return { clockOffset }; // 오래된/중복 delta 무시

  let parties = state.parties;
  switch (e.type) {
    case "slot.upserted":
      if (e.slot && e.partyId != null) {
        parties = relocateSlot(parties, e.slot, e.partyId, e.index ?? 0);
      }
      break;
    case "slot.removed":
      if (e.slotId) {
        parties = parties.map((p) => ({
          ...p,
          slots: p.slots.filter((s) => s.slotId !== e.slotId),
        }));
      }
      break;
    case "party.upserted":
      if (e.party) {
        const party = e.party;
        parties = parties.some((p) => p.partyId === party.partyId)
          ? parties.map((p) => (p.partyId === party.partyId ? party : p))
          : [...parties, party];
      }
      break;
    case "party.removed":
      if (e.partyId) parties = parties.filter((p) => p.partyId !== e.partyId);
      break;
  }
  return { parties, version: e.version, clockOffset };
}

export const useRoomStore = create<RoomState>((set, get) => ({
  screen: "lobby",
  rooms: [],
  selectedRoomId: null,
  roomId: null,
  roomName: "",
  parties: [],
  version: 0,
  clockOffset: 0,
  connected: false,
  errorMessage: null,
  customCategories: [],

  refreshRooms: async () => {
    try {
      set({ rooms: await api.listRooms() });
    } catch {
      /* 목록 폴링 실패는 조용히 무시 */
    }
  },

  selectRoom: (id) => set({ selectedRoomId: id }),

  createRoom: async (name, password) => {
    const { roomId } = await api.createRoom(name, password);
    await get().refreshRooms();
    set({ selectedRoomId: roomId });
    return roomId;
  },

  deleteRoom: async (id, password) => {
    await api.deleteRoom(id, password);
    set({ selectedRoomId: null });
    await get().refreshRooms();
  },

  joinRoom: async (id, name, password) => {
    const res = await api.enterRoom(id, password);
    set({
      screen: "room",
      roomId: id,
      roomName: name,
      parties: res.snapshot.parties,
      version: 0,
      connected: false,
      errorMessage: null,
    });
    socket?.disconnect();
    socket = new RoomSocket(id, res.roomToken, {
      onEvent: (event) => set((s) => applyEvent(s, event)),
      onConnect: () => set({ connected: true }),
      onError: (message) => set({ errorMessage: message }),
    });
    socket.connect();
  },

  leaveRoom: () => {
    socket?.disconnect();
    socket = null;
    set({ screen: "lobby", roomId: null, roomName: "", parties: [], version: 0, connected: false });
  },

  send: (command) => socket?.send(command),

  clearError: () => set({ errorMessage: null }),

  addCategory: (name) =>
    set((s) => ({
      customCategories: [...s.customCategories, { id: localId("cat"), name, timers: [] }],
    })),

  deleteCategory: (id) =>
    set((s) => ({ customCategories: s.customCategories.filter((c) => c.id !== id) })),

  addCustomTimer: (categoryId, name, duration) =>
    set((s) => ({
      customCategories: s.customCategories.map((c) =>
        c.id === categoryId
          ? { ...c, timers: [...c.timers, { id: localId("t"), name, duration, startTs: null }] }
          : c,
      ),
    })),

  startCustomTimer: (categoryId, timerId) =>
    set((s) => ({
      customCategories: s.customCategories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              timers: c.timers.map((t) =>
                t.id === timerId ? { ...t, startTs: Date.now() } : t,
              ),
            }
          : c,
      ),
    })),

  deleteCustomTimer: (categoryId, timerId) =>
    set((s) => ({
      customCategories: s.customCategories.map((c) =>
        c.id === categoryId ? { ...c, timers: c.timers.filter((t) => t.id !== timerId) } : c,
      ),
    })),
}));
