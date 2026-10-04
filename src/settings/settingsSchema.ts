import type { BooleanOptionKey, PPProvider } from "../options/schema";

export interface ToggleSetting {
    key: BooleanOptionKey;
    label: string;
    description: string;
}

/** Non-toggle controls rendered below a section's toggles. */
export type SectionControl = "ppProvider" | "uiScale";

export interface SettingsSection {
    id: string;
    title: string;
    icon: string;
    toggles: ToggleSetting[];
    control?: SectionControl;
}

/** Layout of the settings panel. Adding an on/off option only requires a new entry here. */
export const SETTINGS_SECTIONS: SettingsSection[] = [
    {
        id: "song",
        title: "Song & Track",
        icon: "🎵",
        toggles: [
            { key: "showSongCard", label: "Song card", description: "Title, artist, mapper, cover and BPM" },
            { key: "showSongProgress", label: "Progress bar & time", description: "Elapsed and remaining time" },
        ],
    },
    {
        id: "performance",
        title: "Score & Performance",
        icon: "⚡",
        toggles: [
            { key: "showScore", label: "Score panel", description: "Score and accuracy" },
            { key: "showRank", label: "Rank badge", description: "Live rank letter (SS, S, A…)" },
            { key: "showPP", label: "Performance Points", description: "Live PP on ranked maps" },
            { key: "showCombo", label: "Combo counter", description: "Consecutive notes hit" },
            { key: "showMultiplier", label: "Multiplier", description: "x1 / x2 / x4 / x8 steps and progress" },
        ],
        control: "ppProvider",
    },
    {
        id: "energy",
        title: "Energy",
        icon: "🔋",
        toggles: [{ key: "showEnergy", label: "Energy gauge", description: "Remaining health" }],
    },
    {
        id: "system",
        title: "System & Visuals",
        icon: "⚙️",
        toggles: [
            { key: "showConnectionBadge", label: "Connection badge", description: "Link state with the game" },
            { key: "showStandby", label: "Standby indicator", description: "Shown in menus, between songs" },
            {
                key: "useCustomSaberColors",
                label: "Map saber colors",
                description: "Tint the overlay with the map's custom saber colors",
            },
        ],
        control: "uiScale",
    },
];

export const PP_PROVIDER_LABELS: Record<PPProvider, string> = {
    both: "Both",
    beatleader: "BeatLeader",
    scoresaber: "ScoreSaber",
};
