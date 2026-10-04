import {
    RECONNECT_BACKOFF_FACTOR,
    RECONNECT_BASE_DELAY_MS,
    RECONNECT_MAX_DELAY_MS,
} from "../../config";
import type { BSEvent } from "../protocol";
import { gameStore } from "../store";
import type { GameEventSource } from "./EventSource";

/**
 * Connects to the HttpSiraStatus WebSocket (`ws://host:port/socket`) and keeps reconnecting
 * with exponential backoff until stopped.
 */
export class LiveSource implements GameEventSource {
    private ws: WebSocket | null = null;
    private reconnectTimer: number | null = null;
    private reconnectAttempts = 0;
    private stopped = true;
    private readonly host: string;
    private readonly port: number;

    constructor(host: string, port: number) {
        this.host = host;
        this.port = port;
    }

    start(): void {
        this.stopped = false;
        this.connect();
    }

    stop(): void {
        this.stopped = true;
        if (this.reconnectTimer !== null) {
            window.clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.onopen = this.ws.onmessage = this.ws.onclose = this.ws.onerror = null;
            this.ws.close();
            this.ws = null;
        }
        gameStore.setConnection("disconnected");
    }

    private connect(): void {
        if (this.stopped) return;
        gameStore.setConnection("connecting");

        let ws: WebSocket;
        try {
            ws = new WebSocket(`ws://${this.host}:${this.port}/socket`);
        } catch (err) {
            console.warn("[LiveSource] Invalid WebSocket endpoint:", err);
            gameStore.setConnection("disconnected");
            this.scheduleReconnect();
            return;
        }
        this.ws = ws;

        ws.onopen = () => {
            this.reconnectAttempts = 0;
            gameStore.setConnection("connected");
        };
        ws.onmessage = (message: MessageEvent<string>) => {
            const event = parseEvent(message.data);
            if (event) gameStore.dispatch(event);
        };
        ws.onclose = () => {
            gameStore.setConnection("disconnected");
            this.scheduleReconnect();
        };
        ws.onerror = () => ws.close();
    }

    private scheduleReconnect(): void {
        if (this.stopped) return;
        if (this.reconnectTimer !== null) window.clearTimeout(this.reconnectTimer);

        const delay = Math.min(
            RECONNECT_BASE_DELAY_MS * RECONNECT_BACKOFF_FACTOR ** this.reconnectAttempts,
            RECONNECT_MAX_DELAY_MS,
        );
        this.reconnectAttempts++;
        this.reconnectTimer = window.setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, delay);
    }
}

/** Parses a WebSocket message, ignoring anything that is not an HttpSiraStatus event. */
function parseEvent(raw: string): BSEvent | null {
    try {
        const data: unknown = JSON.parse(raw);
        if (data && typeof data === "object" && typeof (data as BSEvent).event === "string") {
            return data as BSEvent;
        }
    } catch {
        // Not JSON: ignore
    }
    return null;
}
