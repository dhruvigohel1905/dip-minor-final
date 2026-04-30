/**
 * BarcodeScanner — uses @zxing/browser to scan barcodes/QR codes via
 * webcam or uploaded image, extracts the ISBN, and matches against the
 * existing library using the same matchBooks() logic already in bookService.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { ScanBarcode, Upload, Camera, X, CheckCircle2, XCircle, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { matchBooks, type Book, type MatchResult } from "@/lib/bookService";
import { useVoiceAlert } from "@/hooks/useVoiceAlert";
import { cn } from "@/lib/utils";

interface BarcodeScannerProps {
  books: Book[];
}

type ScanState = "idle" | "scanning" | "done" | "error";

export function BarcodeScanner({ books }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [cameraActive, setCameraActive] = useState(false);
  const [lastRaw, setLastRaw] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | undefined>(undefined);

  const { isSupported: voiceSupported, announceBarcodeResult, stop: stopVoice } = useVoiceAlert();

  // Cleanup reader on unmount
  useEffect(() => {
    return () => {
      readerRef.current?.reset();
    };
  }, []);

  // Enumerate cameras
  useEffect(() => {
    BrowserMultiFormatReader.listVideoInputDevices()
      .then((devs) => {
        setDevices(devs);
        if (devs.length > 0) setSelectedDevice(devs[0].deviceId);
      })
      .catch(() => {});
  }, []);

  const processBarcode = useCallback(
    (rawText: string) => {
      setLastRaw(rawText);
      setScanState("done");

      // Extract numeric ISBN-like string (strip hyphens/spaces)
      const cleaned = rawText.replace(/[-\s]/g, "");

      // Use existing matchBooks with isbn field
      const matchResults = matchBooks(
        [{ title: cleaned, isbn: cleaned }],
        books
      );
      const res = matchResults[0] ?? null;
      setResult(res);

      if (voiceEnabled && voiceSupported) {
        announceBarcodeResult(cleaned, res?.match?.title ?? null);
      }
    },
    [books, voiceEnabled, voiceSupported, announceBarcodeResult]
  );

  const startCamera = useCallback(async () => {
    setErrorMsg(null);
    setScanState("scanning");
    setCameraActive(true);

    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      await reader.decodeFromVideoDevice(
        selectedDevice,
        videoRef.current!,
        (result, err) => {
          if (result) {
            readerRef.current?.reset();
            setCameraActive(false);
            processBarcode(result.getText());
          }
          if (err && !(err instanceof NotFoundException)) {
            console.warn("ZXing decode error:", err);
          }
        }
      );
    } catch (err) {
      setScanState("error");
      setCameraActive(false);
      setErrorMsg(err instanceof Error ? err.message : "Camera access failed");
    }
  }, [selectedDevice, processBarcode]);

  const stopCamera = useCallback(() => {
    readerRef.current?.reset();
    setCameraActive(false);
    setScanState("idle");
  }, []);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setErrorMsg(null);
      setScanState("scanning");
      try {
        const reader = new BrowserMultiFormatReader();
        const imgSrc = URL.createObjectURL(file);
        const result = await reader.decodeFromImageUrl(imgSrc);
        URL.revokeObjectURL(imgSrc);
        processBarcode(result.getText());
      } catch {
        setScanState("error");
        setErrorMsg("No barcode found in the image. Try a clearer photo.");
      }
    },
    [processBarcode]
  );

  const reset = useCallback(() => {
    stopVoice();
    readerRef.current?.reset();
    setCameraActive(false);
    setScanState("idle");
    setLastRaw(null);
    setResult(null);
    setErrorMsg(null);
  }, [stopVoice]);

  const matched = result?.match;
  const confidence = result?.confidence ?? 0;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-border">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
          <div>
            <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
              <ScanBarcode className="h-5 w-5 text-primary" />
              Barcode / ISBN Scanner
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Scan a book barcode with your camera or upload a barcode image to instantly look up the book.
            </p>
          </div>

          {/* Voice toggle */}
          {voiceSupported && (
            <button
              onClick={() => setVoiceEnabled((v) => !v)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all",
                voiceEnabled
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-muted/50 border-border text-muted-foreground"
              )}
              title={voiceEnabled ? "Voice alerts on" : "Voice alerts off"}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              {voiceEnabled ? "Voice On" : "Voice Off"}
            </button>
          )}
        </div>

        {/* Camera selection */}
        {devices.length > 1 && (
          <div className="mb-4">
            <label className="text-xs text-muted-foreground font-medium mb-1 block">Camera</label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Buttons (idle state) */}
        {scanState === "idle" && (
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={startCamera}
              className="flex-1 h-24 flex-col gap-2 bg-primary hover:bg-primary/90 text-white font-medium shadow-sm min-w-[140px]"
            >
              <Camera className="h-6 w-6" />
              Scan with Camera
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 h-24 flex-col gap-2 border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 min-w-[140px]"
            >
              <Upload className="h-6 w-6 text-primary" />
              Upload Barcode Image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
          </div>
        )}

        {/* Scanning state — live camera feed */}
        {cameraActive && (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden border-2 border-primary/30 bg-black">
              <video ref={videoRef} className="w-full max-h-72 object-cover" autoPlay playsInline muted />
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-40 border-2 border-primary rounded-lg relative">
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-primary rounded-tl-md" />
                  <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-primary rounded-tr-md" />
                  <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-primary rounded-bl-md" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-primary rounded-br-md" />
                  {/* Animated scan line */}
                  <div className="absolute left-1 right-1 h-0.5 bg-primary/70 rounded animate-[scanline_2s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1 px-4 py-2 rounded-lg bg-primary/5 border border-primary/20 animate-pulse">
                <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                <span className="text-sm text-primary font-medium">Scanning for barcode...</span>
              </div>
              <Button variant="outline" onClick={stopCamera} className="border-destructive/30 text-destructive hover:bg-destructive/5">
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Processing spinner */}
        {scanState === "scanning" && !cameraActive && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20 animate-pulse">
            <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm text-primary font-medium">Decoding barcode image...</span>
          </div>
        )}

        {/* Error state */}
        <AnimatePresence>
          {scanState === "error" && errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-3"
            >
              <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={reset}>
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Result Card */}
      <AnimatePresence>
        {scanState === "done" && result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-border overflow-hidden"
          >
            {/* Result header */}
            <div className={cn(
              "px-6 py-4 flex items-center gap-3",
              matched ? "bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900/40"
                      : "bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/40"
            )}>
              {matched
                ? <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                : <XCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              }
              <div className="flex-1">
                <p className={cn("font-semibold text-sm",
                  matched ? "text-green-700 dark:text-green-300" : "text-amber-700 dark:text-amber-300"
                )}>
                  {matched ? "Book Found in Library" : "Not Found in Library"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Scanned: <span className="font-mono">{lastRaw}</span>
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" /> New Scan
              </Button>
            </div>

            {/* Match details */}
            <div className="px-6 py-5">
              {matched ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-display font-semibold text-foreground">{matched.title}</h3>
                    {matched.author && <p className="text-muted-foreground text-sm">{matched.author}</p>}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    {matched.isbn && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground font-medium mb-1">ISBN</p>
                        <p className="font-mono text-foreground text-xs">{matched.isbn}</p>
                      </div>
                    )}
                    {matched.genre && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Genre</p>
                        <p className="text-foreground">{matched.genre}</p>
                      </div>
                    )}
                    {matched.publisher && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Publisher</p>
                        <p className="text-foreground">{matched.publisher}</p>
                      </div>
                    )}
                    {matched.year && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Year</p>
                        <p className="text-foreground">{matched.year}</p>
                      </div>
                    )}
                  </div>
                  {/* Confidence bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Match confidence</span>
                      <span className="font-medium text-primary">{confidence}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{ width: `${confidence}%` }}
                      />
                    </div>
                  </div>
                  {/* Alternative matches */}
                  {result.alternativeMatches.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Other possible matches:</p>
                      <div className="space-y-1">
                        {result.alternativeMatches.map((alt, i) => (
                          <p key={i} className="text-xs text-foreground flex items-center gap-2">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/40" />
                            {alt.book.title}
                            <span className="text-muted-foreground">({alt.score}%)</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">
                    No book with ISBN <span className="font-mono font-medium text-foreground">{lastRaw}</span> found in the library.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try importing more books via the Import tab, or check if the barcode was read correctly.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanline animation keyframe */}
      <style>{`
        @keyframes scanline {
          0%   { top: 8px; opacity: 1; }
          50%  { top: calc(100% - 8px); opacity: 0.6; }
          100% { top: 8px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
