/**
 * Something that feeds the game store: the live HttpSiraStatus WebSocket or the mock simulator.
 * A source owns the connection state it reports through `gameStore.setConnection`.
 */
export interface GameEventSource {
    start(): void;
    stop(): void;
}
