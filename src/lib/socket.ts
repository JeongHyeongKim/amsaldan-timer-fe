import { Client } from "@stomp/stompjs";
import type { RoomCommand, RoomEvent } from "./types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8088/ws";

export interface RoomSocketHandlers {
  onEvent: (event: RoomEvent) => void;
  onConnect?: () => void;
  onError?: (message: string) => void;
}

/**
 * 한 방에 대한 STOMP 연결 래퍼. 룸 토큰으로 CONNECT 하고 /topic/room/{id} 구독,
 * /app/room/{id}/command 로 카드 단위 커맨드를 발행한다.
 */
export class RoomSocket {
  private client: Client | null = null;

  constructor(
    private roomId: string,
    private roomToken: string,
    private handlers: RoomSocketHandlers,
  ) {}

  connect() {
    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { "room-token": this.roomToken },
      reconnectDelay: 2000,
      onConnect: () => {
        client.subscribe(`/topic/room/${this.roomId}`, (message) => {
          try {
            this.handlers.onEvent(JSON.parse(message.body) as RoomEvent);
          } catch {
            /* 파싱 불가 메시지 무시 */
          }
        });
        this.handlers.onConnect?.();
      },
      onStompError: (frame) => this.handlers.onError?.(frame.headers["message"] ?? "STOMP error"),
      onWebSocketError: () => this.handlers.onError?.("WebSocket 연결 오류"),
    });
    client.activate();
    this.client = client;
  }

  send(command: RoomCommand) {
    this.client?.publish({
      destination: `/app/room/${this.roomId}/command`,
      body: JSON.stringify(command),
    });
  }

  disconnect() {
    this.client?.deactivate();
    this.client = null;
  }
}
