import { useEffect, useRef } from "react";

/** Shortcut key (lowercase) → action. */
export type ShortcutMap = Record<string, () => void>;

function isEditable(target: EventTarget | null): boolean {
    return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
    );
}

/**
 * Global single-key shortcuts. Ignored while typing in a field
 * or when a modifier key is held (so Ctrl+S & co. keep their browser meaning).
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap): void {
    const latest = useRef(shortcuts);
    useEffect(() => {
        latest.current = shortcuts;
    });

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey || event.altKey || isEditable(event.target)) return;
            latest.current[event.key.toLowerCase()]?.();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);
}
