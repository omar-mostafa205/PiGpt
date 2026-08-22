import { useEffect, useState } from "react";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";

/** Metering is what drives the live waveform, so it has to be switched on. */
const OPTIONS = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

/** Poll fast enough for a hundredths timer and a waveform that moves. */
const POLL_MS = 80;

/**
 * Wraps expo-audio for the lecture recorder: permissions, start/stop, live
 * level metering, and reading the finished file back as base64.
 */
export function useRecorder() {
  const recorder = useAudioRecorder(OPTIONS);
  const state = useAudioRecorderState(recorder, POLL_MS);
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }).catch(() => {});
  }, []);

  const start = async () => {
    setError(null);
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      setError("Microphone access is needed to record a lecture.");
      return false;
    }
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setUri(null);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  };

  const stop = async (): Promise<string | null> => {
    try {
      await recorder.stop();
      const finalUri = recorder.uri ?? null;
      setUri(finalUri);
      return finalUri;
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  };

  const readBase64 = async (fileUri: string) =>
    FileSystem.readAsStringAsync(fileUri, { encoding: "base64" });

  const reset = () => {
    setUri(null);
    setError(null);
  };

  return {
    start,
    stop,
    reset,
    readBase64,
    uri,
    error,
    isRecording: state.isRecording,
    /** Elapsed milliseconds while recording. */
    durationMs: state.durationMillis ?? 0,
    /** Input level in dBFS (roughly -160 silent to 0 loudest), if available. */
    metering: state.metering,
  };
}

/** Map a dBFS reading onto 0..1 for the waveform. */
export function levelFromMetering(db: number | undefined): number {
  if (db == null || !Number.isFinite(db)) return 0;
  const FLOOR = -55; // below this is effectively silence for speech
  const clamped = Math.max(FLOOR, Math.min(0, db));
  return (clamped - FLOOR) / -FLOOR;
}
