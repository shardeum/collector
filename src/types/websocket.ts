import WebSocket from 'ws'

export type WebSocketWithId = WebSocket & { id: string }
