import type { ApiResponse, EnterRoomResult, RoomSnapshot, RoomSummary } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8088";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = (await res.json()) as ApiResponse<T>;
  if (!body.success) {
    throw new ApiError(body.error?.code ?? "UNKNOWN", body.error?.message ?? "요청 실패");
  }
  return body.data as T;
}

export class ApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const api = {
  listRooms: () => request<RoomSummary[]>("/api/rooms"),

  createRoom: (name: string, password: string) =>
    request<{ roomId: string }>("/api/rooms", {
      method: "POST",
      body: JSON.stringify({ name, password }),
    }),

  deleteRoom: (roomId: string, password: string) =>
    request<void>(`/api/rooms/${roomId}`, {
      method: "DELETE",
      body: JSON.stringify({ password }),
    }),

  enterRoom: (roomId: string, password: string) =>
    request<EnterRoomResult>(`/api/rooms/${roomId}/enter`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  snapshot: (roomId: string) => request<RoomSnapshot>(`/api/rooms/${roomId}/snapshot`),
};
