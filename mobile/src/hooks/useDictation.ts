import { useState } from "react";
import { useRecorder } from "./useRecorder";
import { transcribeApi } from "../services/api/transcribe";

/**
 * Dictation for the composer: hold a recording, then transcribe it to text.
 * Deliberately separate from the lecture recorder screen — this one never
 * navigates, it just hands text back to whoever called it.
 */
export function useDictation(onText: (text: string) => void) {
  const { start, stop, readBase64, isRecording, durationMs, metering } = useRecorder();
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    if (isRecording) {
      const uri = await stop();
      if (!uri) return;
      setTranscribing(true);
      setError(null);
      try {
        const audioBase64 = await readBase64(uri);
        const { text } = await transcribeApi.fromAudio({ audioBase64, mimeType: "audio/m4a" });
        if (text) onText(text);
        else setError("Didn't catch that — try again.");
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setTranscribing(false);
      }
      return;
    }
    setError(null);
    await start();
  };

  return { toggle, isRecording, transcribing, durationMs, metering, error };
}
