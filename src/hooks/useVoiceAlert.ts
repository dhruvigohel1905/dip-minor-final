/**
 * useVoiceAlert — Web Speech API hook for librarian audio alerts.
 * No external dependencies; uses the browser's built-in SpeechSynthesis.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface VoiceAlertOptions {
  rate?: number;   // 0.1 – 10, default 1
  pitch?: number;  // 0 – 2, default 1
  volume?: number; // 0 – 1, default 1
  lang?: string;   // BCP-47 language tag, default "en-US"
}

export function useVoiceAlert(defaults?: VoiceAlertOptions) {
  const [isSupported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Cancel any pending speech on unmount
  useEffect(() => {
    return () => {
      if (isSupported) window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const speak = useCallback(
    (text: string, options?: VoiceAlertOptions) => {
      if (!isSupported || !text.trim()) return;

      // Cancel previous utterance if any
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate   = options?.rate   ?? defaults?.rate   ?? 1;
      utterance.pitch  = options?.pitch  ?? defaults?.pitch  ?? 1;
      utterance.volume = options?.volume ?? defaults?.volume ?? 1;
      utterance.lang   = options?.lang   ?? defaults?.lang   ?? "en-US";

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend   = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, defaults]
  );

  /**
   * Convenience: announce scan results in a natural sentence.
   * e.g. "3 books detected. 2 matched with library. 1 book not found."
   */
  const announceScanResults = useCallback(
    (totalDetected: number, matched: number) => {
      if (totalDetected === 0) {
        speak("No books were detected. Please try a clearer image.");
        return;
      }
      const unmatched = totalDetected - matched;
      let message = `${totalDetected} book${totalDetected !== 1 ? "s" : ""} detected. `;
      if (matched > 0) message += `${matched} matched with the library. `;
      if (unmatched > 0) message += `${unmatched} book${unmatched !== 1 ? "s" : ""} not found in the library.`;
      speak(message);
    },
    [speak]
  );

  /**
   * Convenience: announce a barcode lookup result.
   */
  const announceBarcodeResult = useCallback(
    (isbn: string, bookTitle: string | null) => {
      if (bookTitle) {
        speak(`ISBN ${isbn} matched. Book found: ${bookTitle}.`);
      } else {
        speak(`ISBN ${isbn} scanned. No matching book found in the library.`);
      }
    },
    [speak]
  );

  return {
    isSupported,
    isSpeaking,
    speak,
    stop,
    announceScanResults,
    announceBarcodeResult,
  };
}
