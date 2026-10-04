import { describe, expect, it } from "vitest";
import { parseUrlParams } from "./urlParams";

describe("parseUrlParams", () => {
    it("uses defaults without parameters", () => {
        expect(parseUrlParams("")).toEqual({
            host: "127.0.0.1",
            port: 6557,
            skin: "horizon",
            mock: false,
            openSettings: false,
            scale: null,
            twitchPreset: false,
            debug: false,
        });
    });

    it("reads every parameter", () => {
        expect(parseUrlParams("?host=192.168.1.10&port=7000&skin=neon&mock=1&settings=true&scale=1.25&twitch=true&debug=1"))
            .toEqual({
                host: "192.168.1.10",
                port: 7000,
                skin: "neon",
                mock: true,
                openSettings: true,
                scale: 1.25,
                twitchPreset: true,
                debug: true,
            });
    });

    it("supports aliases", () => {
        const params = parseUrlParams("?config=1&stream=1");
        expect(params.openSettings).toBe(true);
        expect(params.twitchPreset).toBe(true);
    });

    it("rejects invalid values", () => {
        const params = parseUrlParams("?port=abc&skin=unknown&scale=huge");
        expect(params.port).toBe(6557);
        expect(params.skin).toBe("horizon");
        expect(params.scale).toBeNull();
    });
});
