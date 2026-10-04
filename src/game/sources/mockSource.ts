import { INITIAL_ENERGY, MAX_MULTIPLIER } from "../../config";
import { DEFAULT_BEATLEADER_MODIFIER_VALUES } from "../../pp/beatleader";
import { registerStaticRankedData } from "../../pp/rankedService";
import { maxScoreForNotes } from "../../utils/format";
import type { BeatmapInfo, BSEvent, GameInfo, ModInfo, Performance, Rank } from "../protocol";
import { gameStore } from "../store";
import type { GameEventSource } from "./EventSource";

/** Hash of the simulated map; the PP module serves static ranked data for it. */
export const MOCK_SONG_HASH = "MOCK_CAMELLIA_GHOST";

const TICK_MS = 250;
const MENU_TO_SONG_DELAY_MS = 1500;
const FINISH_TO_MENU_DELAY_MS = 3000;
const MENU_TO_RESTART_DELAY_MS = 2500;
const SONG_LENGTH_MS = 215_000;
/** One note per tick. */
const NOTES_COUNT = SONG_LENGTH_MS / TICK_MS;

/** Real ratings of Camellia - GHOST (Expert+) so the PP display can be previewed offline. */
const MOCK_RANKED_KEY = `${MOCK_SONG_HASH}_ExpertPlus_Standard`;

const MOCK_GAME: GameInfo = { pluginVersion: "mock", gameVersion: "1.37.0", scene: "Menu", mode: "Solo" };

const MOCK_MODS: ModInfo = {
    multiplier: 1,
    obstacles: "All",
    instaFail: false,
    noFail: false,
    batteryEnergy: false,
    batteryLives: null,
    disappearingArrows: false,
    noBombs: false,
    songSpeed: "Normal",
    songSpeedMultiplier: 1,
    noArrows: false,
    ghostNotes: false,
    failOnSaberClash: false,
    strictAngles: false,
    fastNotes: false,
    smallNotes: false,
    proMode: false,
    zenMode: false,
};

const MOCK_BEATMAP: Omit<BeatmapInfo, "start"> = {
    songName: "GHOST",
    songSubName: "Camellia",
    songAuthorName: "Camellia",
    levelAuthorName: "Kroytz",
    songCover: null,
    songHash: MOCK_SONG_HASH,
    songBPM: 220,
    paused: null,
    length: SONG_LENGTH_MS,
    difficulty: "ExpertPlus",
    difficultyEnum: "ExpertPlus",
    characteristic: "Standard",
    notesCount: NOTES_COUNT,
    maxScore: maxScoreForNotes(NOTES_COUNT),
    maxRank: "SSS",
    color: {
        saberA: [0.93, 0.27, 0.35],
        saberB: [0.05, 0.72, 0.85],
        environment0: [0.65, 0.33, 0.96],
        environment1: [0.13, 0.82, 0.93],
        obstacle: [0.9, 0.1, 0.1],
    },
};

/** Beat Saber rank thresholds. */
function rankFor(acc: number): Rank {
    if (acc >= 1) return "SSS";
    if (acc >= 0.9) return "SS";
    if (acc >= 0.8) return "S";
    if (acc >= 0.65) return "A";
    if (acc >= 0.5) return "B";
    if (acc >= 0.35) return "C";
    if (acc >= 0.2) return "D";
    return "E";
}

/**
 * Plays a fake song in a loop so the overlay can be positioned and styled in OBS without the game.
 * Toggle with the `M` key or `?mock=true`.
 */
export class MockSource implements GameEventSource {
    private readonly timers = new Set<number>();
    private running = false;
    private songTimeMs = 0;
    private score = 0;
    private passedNotes = 0;
    private combo = 0;
    private multiplier = 1;
    private multiplierProgress = 0;
    private energy = INITIAL_ENERGY;

    start(): void {
        if (this.running) return;
        this.running = true;
        registerStaticRankedData({
            key: MOCK_RANKED_KEY,
            scoresaber: { info: { stars: 8.89, maxPP: 374.39, positiveModifiers: false }, source: "mock" },
            beatleader: {
                info: {
                    stars: 9.49,
                    passRating: 8.248,
                    accRating: 10.504,
                    techRating: 3.428,
                    modifierValues: DEFAULT_BEATLEADER_MODIFIER_VALUES,
                    speedRatings: null,
                },
                source: "mock",
            },
        });
        gameStore.setConnection("connected");
        this.goToMenu();
        this.later(MENU_TO_SONG_DELAY_MS, () => this.startSong());
    }

    stop(): void {
        this.running = false;
        this.timers.forEach((id) => window.clearTimeout(id));
        this.timers.clear();
        this.goToMenu();
        gameStore.setConnection("disconnected");
    }

    private later(delayMs: number, fn: () => void): void {
        const id = window.setTimeout(() => {
            this.timers.delete(id);
            if (this.running) fn();
        }, delayMs);
        this.timers.add(id);
    }

    private emit(event: BSEvent["event"], status: BSEvent["status"]): void {
        gameStore.dispatch({ event, time: Date.now(), status });
    }

    private goToMenu(): void {
        this.emit("menu", { game: { ...MOCK_GAME, scene: "Menu" }, beatmap: null, performance: null });
    }

    private startSong(): void {
        this.songTimeMs = 0;
        this.score = 0;
        this.passedNotes = 0;
        this.combo = 0;
        this.multiplier = 1;
        this.multiplierProgress = 0;
        this.energy = INITIAL_ENERGY;

        this.emit("songStart", {
            game: { ...MOCK_GAME, scene: "Song" },
            beatmap: { ...MOCK_BEATMAP, start: Date.now() },
            performance: this.performance(),
            mod: MOCK_MODS,
        });
        this.later(TICK_MS, () => this.tick());
    }

    private tick(): void {
        this.songTimeMs += TICK_MS;
        this.passedNotes++;
        this.combo++;

        if (this.multiplier < MAX_MULTIPLIER) {
            this.multiplierProgress += 0.25;
            if (this.multiplierProgress >= 1) {
                this.multiplier *= 2;
                this.multiplierProgress = 0;
            }
        } else {
            this.multiplierProgress = 1;
        }

        // Realistic cuts: 100..115 points, i.e. ~93-99% accuracy
        const cutScore = 100 + Math.round(Math.random() * 15);
        this.score += cutScore * this.multiplier;
        this.energy = Math.min(1, Math.max(0.2, this.energy + (Math.random() * 0.08 - 0.035)));

        const performance = this.performance();
        this.emit("noteCut", { performance, energy: this.energy });

        if (this.songTimeMs < SONG_LENGTH_MS) {
            this.later(TICK_MS, () => this.tick());
            return;
        }

        this.emit("finished", { performance });
        this.later(FINISH_TO_MENU_DELAY_MS, () => {
            this.goToMenu();
            this.later(MENU_TO_RESTART_DELAY_MS, () => this.startSong());
        });
    }

    private performance(): Performance {
        const currentMaxScore = maxScoreForNotes(this.passedNotes);
        const acc = currentMaxScore > 0 ? this.score / currentMaxScore : 0;
        return {
            rawScore: this.score,
            score: this.score,
            currentMaxScore,
            rank: rankFor(acc),
            relativeScore: acc,
            passedNotes: this.passedNotes,
            hitNotes: this.passedNotes,
            missedNotes: 0,
            combo: this.combo,
            maxCombo: this.combo,
            multiplier: this.multiplier,
            multiplierProgress: this.multiplierProgress,
            batteryEnergy: null,
            currentSongTime: this.songTimeMs / 1000,
            softFailed: false,
            energy: this.energy,
        };
    }
}
