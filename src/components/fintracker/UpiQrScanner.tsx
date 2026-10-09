/**
 * @file UpiQrScanner.tsx
 * Google Pay & Universal UPI QR Code Scanner Component
 *
 * Provides real-time camera viewfinder with jsQR video processing,
 * flashlight/torch toggle, camera switching, gallery/file image upload,
 * haptic vibration and sound feedback, and intelligent UPI protocol parsing.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  Upload,
  RefreshCw,
  Zap,
  ZapOff,
  AlertCircle,
  X,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

export interface ParsedUpiData {
  vpa: string;
  name: string;
  amount?: number;
  note?: string;
  category?: string;
  raw: string;
  merchantParams?: Record<string, string>;
}

export function parseUpiString(rawText: string): ParsedUpiData | null {
  if (!rawText) return null;
  const trimmed = rawText.trim();

  // Case 1: Standard upi://pay or tez://upi/pay or URL with UPI parameters
  if (
    trimmed.startsWith('upi://') ||
    trimmed.startsWith('tez://') ||
    trimmed.includes('pa=')
  ) {
    try {
      let queryStr = '';
      if (trimmed.includes('?')) {
        queryStr = trimmed.split('?')[1];
      } else {
        queryStr = trimmed;
      }

      const params = new URLSearchParams(queryStr);
      const pa = params.get('pa') || '';
      const pn = params.get('pn') || '';
      const am = params.get('am');
      const tn = params.get('tn') || '';

      const merchantParams: Record<string, string> = {};
      params.forEach((value, key) => {
        if (!['pa', 'pn', 'am', 'tn'].includes(key)) {
          merchantParams[key] = value;
        }
      });

      if (pa) {
        const cleanPa = decodeURIComponent(pa).trim();
        const cleanPn = pn
          ? decodeURIComponent(pn).replace(/\+/g, ' ').trim()
          : cleanPa.split('@')[0];
        const cleanTn = tn ? decodeURIComponent(tn).replace(/\+/g, ' ').trim() : undefined;
        const parsedAmt = am ? parseFloat(am) : undefined;

        return {
          vpa: cleanPa,
          name: cleanPn || cleanPa.split('@')[0],
          amount: parsedAmt && !isNaN(parsedAmt) && parsedAmt > 0 ? parsedAmt : undefined,
          note: cleanTn,
          raw: trimmed,
          merchantParams: Object.keys(merchantParams).length > 0 ? merchantParams : undefined,
        };
      }
    } catch {
      // Fallback regex parsing
      const paMatch = trimmed.match(/[?&]pa=([^&]+)/i);
      const pnMatch = trimmed.match(/[?&]pn=([^&]+)/i);
      const amMatch = trimmed.match(/[?&]am=([^&]+)/i);
      const tnMatch = trimmed.match(/[?&]tn=([^&]+)/i);

      if (paMatch && paMatch[1]) {
        const cleanPa = decodeURIComponent(paMatch[1]).trim();
        const cleanPn = pnMatch
          ? decodeURIComponent(pnMatch[1]).replace(/\+/g, ' ').trim()
          : cleanPa.split('@')[0];
        const parsedAmt = amMatch ? parseFloat(amMatch[1]) : undefined;

        return {
          vpa: cleanPa,
          name: cleanPn || cleanPa.split('@')[0],
          amount: parsedAmt && !isNaN(parsedAmt) && parsedAmt > 0 ? parsedAmt : undefined,
          note: tnMatch ? decodeURIComponent(tnMatch[1]).replace(/\+/g, ' ').trim() : undefined,
          raw: trimmed,
        };
      }
    }
  }

  // Case 2: Plain UPI ID format (e.g. merchant@okaxis, shop@upi, etc.)
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  if (upiRegex.test(trimmed)) {
    return {
      vpa: trimmed,
      name: trimmed.split('@')[0],
      raw: trimmed,
    };
  }

  // Case 3: URL containing UPI parameters (e.g. payment gateway links)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const pa = url.searchParams.get('pa');
      if (pa) {
        return {
          vpa: decodeURIComponent(pa),
          name: decodeURIComponent(url.searchParams.get('pn') || pa.split('@')[0]),
          amount: url.searchParams.get('am') ? parseFloat(url.searchParams.get('am')!) : undefined,
          note: url.searchParams.get('tn') ? decodeURIComponent(url.searchParams.get('tn')!) : undefined,
          raw: trimmed,
        };
      }
    } catch {
      // Ignore URL parse error
    }
  }

  return null;
}

interface UpiQrScannerProps {
  onScanSuccess: (data: ParsedUpiData) => void;
  onClose: () => void;
}

export const UpiQrScanner: React.FC<UpiQrScannerProps> = ({ onScanSuccess, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [scannedResult, setScannedResult] = useState<ParsedUpiData | null>(null);

  // Play synthesized audio chime on scan success
  const playChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {
      // Audio context might be restricted before interaction
    }
  }, []);

  const triggerFeedback = useCallback((data: ParsedUpiData) => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([60, 40, 60]);
      } catch {
        // Ignore vibration error
      }
    }
    playChime();
    setScannedResult(data);
    setTimeout(() => {
      onScanSuccess(data);
    }, 600);
  }, [onScanSuccess, playChime]);

  // Stop camera tracks
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Frame processing loop
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          const parsed = parseUpiString(code.data);
          if (parsed) {
            stopCamera();
            triggerFeedback(parsed);
            return;
          }
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(scanFrame);
  }, [stopCamera, triggerFeedback]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser. Please upload a QR code image instead.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      // Check torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities ? (videoTrack.getCapabilities() as Record<string, unknown>) : {};
        setHasTorch(Boolean(capabilities && 'torch' in capabilities));
      }

      animationFrameId.current = requestAnimationFrame(scanFrame);
    } catch (err: unknown) {
      console.warn('Camera stream error:', err);
      const errorObj = err as { name?: string };
      if (errorObj?.name === 'NotAllowedError' || errorObj?.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera permissions in your browser settings or upload a QR image.');
      } else if (errorObj?.name === 'NotFoundError' || errorObj?.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. You can upload a QR image from your gallery.');
      } else {
        setCameraError('Unable to start camera viewfinder. You can upload a QR image instead.');
      }
    }
  }, [facingMode, scanFrame, stopCamera]);

  // Toggle torch/flashlight
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack && hasTorch) {
      try {
        const nextState = !isTorchOn;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (videoTrack as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      } catch (err) {
        console.warn('Torch toggle error:', err);
      }
    }
  };

  // Flip camera between environment (back) and user (front)
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Handle image upload from file or gallery
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setCameraError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = img.width;
        offscreenCanvas.height = img.height;
        const ctx = offscreenCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            const parsed = parseUpiString(code.data);
            if (parsed) {
              stopCamera();
              triggerFeedback(parsed);
              setIsProcessingFile(false);
              return;
            }
          }
        }
        setIsProcessingFile(false);
        setCameraError('No valid UPI QR code found in this image. Please select a clear picture or screenshot of the QR code.');
      };
      img.onerror = () => {
        setIsProcessingFile(false);
        setCameraError('Failed to read image file. Please try another image.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode, startCamera, stopCamera]);

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 text-white animate-fadeIn">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Header Bar */}
      <div className="w-full max-w-md flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center">
            <Camera className="w-4 h-4 text-blue-300" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
              Scan UPI QR Code
              <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-500 text-slate-950 uppercase">
                GPay
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Point at any merchant or store QR</p>
          </div>
        </div>

        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer"
          title="Close scanner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Viewfinder / Video Stream */}
      <div className="relative w-full max-w-md flex-1 flex flex-col items-center justify-center min-h-[300px]">
        {cameraError ? (
          <div className="w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-300">Scanner Notice</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                {cameraError}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => startCamera()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Camera
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Image
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-[340px] aspect-square rounded-3xl overflow-hidden border-2 border-blue-500/30 bg-black shadow-2xl flex items-center justify-center">
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />

            {/* High-tech Viewfinder Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Darkened corner mask */}
              <div className="absolute inset-0 bg-slate-950/20" />

              {/* Targeting Reticle Frame */}
              <div className="relative w-64 h-64 border-2 border-dashed border-white/40 rounded-2xl flex items-center justify-center overflow-hidden">
                {/* 4 Corner Accents */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-xl" />

                {/* Animated Scanning Laser Beam */}
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-scanBeam" />

                {/* Center Reticle Icon */}
                <Sparkles className="w-6 h-6 text-white/30 animate-pulse" />
              </div>
            </div>

            {/* Success Feedback Overlay */}
            {scannedResult && (
              <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20 animate-fadeIn">
                <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-2 animate-bounce" />
                <h4 className="text-base font-black text-white">QR Code Detected!</h4>
                <p className="text-xs text-emerald-200 mt-0.5 font-bold truncate max-w-[260px]">
                  {scannedResult.name}
                </p>
                <p className="text-[11px] text-emerald-300 font-mono mt-0.5 truncate max-w-[260px]">
                  {scannedResult.vpa}
                </p>
                {scannedResult.amount && (
                  <span className="mt-2 px-3 py-1 bg-emerald-500 text-slate-950 font-black text-xs rounded-full">
                    ₹{scannedResult.amount.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Viewfinder Instructions */}
        {!cameraError && (
          <p className="text-center text-xs text-slate-400 mt-4 font-medium flex items-center justify-center gap-1.5">
            <span>Align BharatQR, Google Pay, PhonePe, or Paytm QR code inside</span>
          </p>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="w-full max-w-md pt-4 pb-2 space-y-3">
        <div className="flex items-center justify-center gap-3">
          {/* Torch Toggle */}
          {hasTorch && (
            <button
              type="button"
              onClick={handleToggleTorch}
              className={`p-3 rounded-2xl border transition active:scale-95 cursor-pointer flex items-center justify-center ${
                isTorchOn
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
              title={isTorchOn ? 'Turn Off Flash' : 'Turn On Flash'}
            >
              {isTorchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
            </button>
          )}

          {/* Flip Camera */}
          <button
            type="button"
            onClick={handleFlipCamera}
            className="p-3 rounded-2xl bg-slate-900/80 text-slate-300 border border-slate-700 hover:bg-slate-800 transition active:scale-95 cursor-pointer flex items-center justify-center"
            title="Switch between front and back camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Upload Image / Screenshot */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingFile}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition active:scale-98 cursor-pointer flex items-center justify-center gap-2 border border-blue-400/30"
          >
            {isProcessingFile ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Reading Image...</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                <span>Upload QR Image / Screenshot</span>
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};
