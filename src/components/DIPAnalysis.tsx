import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, BarChart } from "lucide-react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type HistogramData = {
  intensity: number;
  count: number;
};

export const DIPAnalysis = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [histogramData, setHistogramData] = useState<HistogramData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
        setHistogramData([]); // Reset
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (imageSrc && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize logic to fit canvas width
        const maxWidth = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Store original data for filters
        const imgData = ctx.getImageData(0, 0, width, height);
        setOriginalImageData(imgData);
        setHistogramData([]);
      };
      img.src = imageSrc;
    }
  }, [imageSrc]);

  const applyFilter = (filterType: string) => {
    if (!canvasRef.current || !originalImageData) return;
    setIsProcessing(true);

    // Timeout allows UI to update the loading state before heavy processing
    setTimeout(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const newImageData = new ImageData(
        new Uint8ClampedArray(originalImageData.data),
        originalImageData.width,
        originalImageData.height
      );

      const d = newImageData.data;

      switch (filterType) {
        case 'grayscale':
          for (let i = 0; i < d.length; i += 4) {
            const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
            d[i] = avg;
            d[i + 1] = avg;
            d[i + 2] = avg;
          }
          break;
        case 'invert':
          for (let i = 0; i < d.length; i += 4) {
            d[i] = 255 - d[i];
            d[i + 1] = 255 - d[i + 1];
            d[i + 2] = 255 - d[i + 2];
          }
          break;
        case 'sepia':
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i + 1], b = d[i + 2];
            d[i] = (r * 0.393) + (g * 0.769) + (b * 0.189);
            d[i + 1] = (r * 0.349) + (g * 0.686) + (b * 0.168);
            d[i + 2] = (r * 0.272) + (g * 0.534) + (b * 0.131);
          }
          break;
        case 'edge':
          // Simple 3x3 Edge Detection (Laplacian)
          const side = Math.round(Math.sqrt(9));
          const halfSide = Math.floor(side / 2);
          const src = originalImageData.data;
          const sw = originalImageData.width;
          const sh = originalImageData.height;
          const w = sw;
          const h = sh;

          const kernel = [
             0, -1,  0,
            -1,  4, -1,
             0, -1,  0
          ];

          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const dstOff = (y * w + x) * 4;
              let r = 0, g = 0, b = 0;

              for (let cy = 0; cy < side; cy++) {
                for (let cx = 0; cx < side; cx++) {
                  const scy = y + cy - halfSide;
                  const scx = x + cx - halfSide;

                  if (scy >= 0 && scy < h && scx >= 0 && scx < w) {
                    const srcOff = (scy * w + scx) * 4;
                    const wt = kernel[cy * side + cx];
                    r += src[srcOff] * wt;
                    g += src[srcOff + 1] * wt;
                    b += src[srcOff + 2] * wt;
                  }
                }
              }
              
              d[dstOff] = r;
              d[dstOff + 1] = g;
              d[dstOff + 2] = b;
              d[dstOff + 3] = 255; // Preserve original alpha roughly or set 255
            }
          }
          break;
        case 'histogram':
          ctx.putImageData(originalImageData, 0, 0); // show original while viewing histogram
          
          const hist = new Array(256).fill(0);
          for (let i = 0; i < d.length; i += 4) {
             const intensity = Math.floor((d[i] + d[i+1] + d[i+2]) / 3);
             hist[intensity]++;
          }
          
          const formattedHist = hist.map((count, intensity) => ({
             intensity,
             count
          }));
          
          setHistogramData(formattedHist);
          setIsProcessing(false);
          return;
        case 'reset':
          ctx.putImageData(originalImageData, 0, 0);
          setHistogramData([]);
          setIsProcessing(false);
          return;
      }

      ctx.putImageData(newImageData, 0, 0);
      setHistogramData([]); // Clear old histogram
      setIsProcessing(false);
    }, 10);
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-xl font-display font-semibold mb-4">Digital Image Processing (DIP)</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Upload an image and run various standard image processing algorithms directly in your browser.
        </p>

        <div className="mb-6 flex gap-2 flex-wrap">
          <label className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors text-sm font-medium">
            <Upload className="w-4 h-4" />
            Upload Image
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload} 
            />
          </label>
          
          {originalImageData && (
            <>
              <Button variant="outline" onClick={() => applyFilter('grayscale')} disabled={isProcessing}>Grayscale</Button>
              <Button variant="outline" onClick={() => applyFilter('invert')} disabled={isProcessing}>Negative</Button>
              <Button variant="outline" onClick={() => applyFilter('sepia')} disabled={isProcessing}>Sepia</Button>
              <Button variant="outline" onClick={() => applyFilter('edge')} disabled={isProcessing}>Edge Detection</Button>
              <Button variant="outline" onClick={() => applyFilter('histogram')} disabled={isProcessing}>
                <BarChart className="w-4 h-4 mr-2" /> Histogram
              </Button>
              <Button variant="ghost" onClick={() => applyFilter('reset')} disabled={isProcessing}>Reset</Button>
            </>
          )}
        </div>

        <div className={`grid grid-cols-1 ${histogramData.length > 0 ? 'lg:grid-cols-2' : ''} gap-8`}>
          <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg min-h-[300px] border border-border">
            {!imageSrc ? (
              <div className="flex flex-col items-center text-muted-foreground">
                <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                <p>No image selected for Analysis</p>
              </div>
            ) : (
                <canvas 
                  ref={canvasRef} 
                  className={`max-w-full rounded-md shadow-md ${isProcessing ? 'opacity-50' : 'opacity-100'} transition-opacity`}
                />
            )}
            {isProcessing && <p className="mt-4 text-sm font-medium animate-pulse duration-700">Analysing Image...</p>}
          </div>

          {histogramData.length > 0 && (
            <div className="p-4 bg-muted/30 rounded-lg border border-border flex flex-col h-[300px] lg:h-auto min-h-[300px]">
              <h3 className="text-sm font-medium mb-4 text-center">Intensity Histogram</h3>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="intensity" tick={{fontSize: 10}} minTickGap={20} />
                  <YAxis tick={{fontSize: 10}} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{borderRadius: '8px', fontSize: '12px'}}
                  />
                  <Bar dataKey="count" fill="currentColor" className="fill-primary" opacity={0.8} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
