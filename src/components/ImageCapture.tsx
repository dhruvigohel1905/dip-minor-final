import { useState, useCallback, useRef } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageCaptureProps {
  onImageCapture: (base64: string) => void;
  isProcessing: boolean;
}

export function ImageCapture({ onImageCapture, isProcessing }: ImageCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      onImageCapture(base64);
    };
    reader.readAsDataURL(file);
  }, [onImageCapture]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPreview(dataUrl);
    onImageCapture(dataUrl.split(",")[1]);
    stopCamera();
  }, [onImageCapture]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  return (
    <div className="space-y-4">
      {!cameraActive && !preview && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-32 flex-col gap-2 border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            <Upload className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-foreground">Upload Image</span>
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-32 flex-col gap-2 border-2 border-secondary/20 hover:border-secondary/50 hover:bg-secondary/5 transition-colors"
            onClick={startCamera}
            disabled={isProcessing}
          >
            <Camera className="h-8 w-8 text-secondary" />
            <span className="text-sm font-medium text-foreground">Use Camera</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}

          />
        </div>
      )}

      {cameraActive && (
        <div className="relative rounded-lg overflow-hidden border-2 border-border">
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <Button onClick={capturePhoto} className="bg-primary hover:bg-primary/90 text-white font-medium">
              <span>Capture Photo</span>
            </Button>
            <Button variant="outline" onClick={stopCamera} className="bg-white/90 backdrop-blur-sm hover:bg-white">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {preview && (
        <div className="relative animate-scale-in">
          <img src={preview} alt="Captured" className="w-full max-h-64 object-contain rounded-lg border-2 border-primary/20" />
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={clearPreview}
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
