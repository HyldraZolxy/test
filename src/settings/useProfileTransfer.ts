import { useCallback, useState, type ChangeEvent } from "react";
import { setAllOverlayOptions, useOverlayOptions } from "../options/store";

/** Export the current options to a JSON file, or import them back (validated). */
export function useProfileTransfer() {
    const options = useOverlayOptions();
    const [importError, setImportError] = useState<string | null>(null);

    const exportProfile = useCallback(() => {
        const blob = new Blob([JSON.stringify(options, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `beat-saber-overlay-profile-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }, [options]);

    const importProfile = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
        const input = event.currentTarget;
        const file = input.files?.[0];
        input.value = ""; // Allow re-importing the same file
        if (!file) return;
        try {
            setAllOverlayOptions(JSON.parse(await file.text()));
            setImportError(null);
        } catch {
            setImportError("Invalid profile file.");
        }
    }, []);

    return { exportProfile, importProfile, importError };
}
