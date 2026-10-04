import { useEffect, useMemo, useState } from "react";
import { HELP_BAR_AUTO_HIDE_MS, TWITCH_PRESET_SCALE } from "../config";
import { LiveSource } from "../game/sources/liveSource";
import { MockSource } from "../game/sources/mockSource";
import { useOverlayOptions } from "../options/store";
import { SettingsModal } from "../settings/SettingsModal";
import { nextSkinId, SKINS } from "../skins/registry";
import { HelpBar } from "./HelpBar";
import { parseUrlParams } from "./urlParams";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

/**
 * Root component: picks the event source (live game or simulator), hosts the active skin,
 * and handles the help bar, keyboard shortcuts and settings dialog.
 */
export function App() {
    const params = useMemo(() => parseUrlParams(window.location.search), []);
    const { uiScale } = useOverlayOptions();

    const [skinId, setSkinId] = useState(params.skin);
    const [isMock, setIsMock] = useState(params.mock);
    const [settingsOpen, setSettingsOpen] = useState(params.openSettings);
    // Bumped by every shortcut: re-shows the help bar and restarts its auto-hide timer
    const [helpBarToken, setHelpBarToken] = useState(0);
    const [helpBarHidden, setHelpBarHidden] = useState(false);

    const scale = params.scale ?? (params.twitchPreset ? TWITCH_PRESET_SCALE : uiScale);
    const skin = SKINS[skinId];
    const SkinComponent = skin.component;

    const showHelpBar = () => {
        setHelpBarHidden(false);
        setHelpBarToken((token) => token + 1);
    };
    const nextSkin = () => {
        setSkinId(nextSkinId);
        showHelpBar();
    };
    const toggleMock = () => {
        setIsMock((mock) => !mock);
        showHelpBar();
    };

    useKeyboardShortcuts({
        m: toggleMock,
        s: nextSkin,
        o: () => setSettingsOpen((open) => !open),
        escape: () => setSettingsOpen(false),
    });

    // Event source: the live game or the simulator
    useEffect(() => {
        const source = isMock ? new MockSource() : new LiveSource(params.host, params.port, params.debug);
        source.start();
        return () => source.stop();
    }, [isMock, params.host, params.port, params.debug]);

    // Auto-hide the help bar (kept visible while settings are open)
    useEffect(() => {
        if (settingsOpen) return;
        const timer = window.setTimeout(() => setHelpBarHidden(true), HELP_BAR_AUTO_HIDE_MS);
        return () => window.clearTimeout(timer);
    }, [helpBarToken, settingsOpen]);

    return (
        <div className="relative w-screen h-screen overflow-hidden" style={{ zoom: scale !== 1 ? scale : undefined }}>
            <SkinComponent />

            {(!helpBarHidden || settingsOpen) && (
                <HelpBar
                    skinName={skin.name}
                    isMock={isMock}
                    scale={scale}
                    onOpenSettings={() => setSettingsOpen(true)}
                    onNextSkin={nextSkin}
                    onToggleMock={toggleMock}
                    onDismiss={() => setHelpBarHidden(true)}
                />
            )}

            {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
        </div>
    );
}
