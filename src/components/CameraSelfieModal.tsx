import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export interface SelfiePhotoMetadata {
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: string;
}

interface CameraSelfieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string, metadata?: SelfiePhotoMetadata) => void;
  title?: string;
}

export const CameraSelfieModal: React.FC<CameraSelfieModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Ambil Foto Selfie Langsung',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [photoMeta, setPhotoMeta] = useState<SelfiePhotoMetadata | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setPhotoMeta(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setIsInitializing(true);
    setCameraError(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsInitializing(false);
    } catch (err: any) {
      console.warn('Gagal mengakses kamera:', err);
      setCameraError(
        'Kamera diperlukan untuk melakukan selfie absensi. Pastikan izin kamera telah diberikan di browser Anda.'
      );
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    // Calculate 480p max dimension (longest edge <= 480px)
    const rawW = video.videoWidth || 640;
    const rawH = video.videoHeight || 480;
    const maxDim = 480;
    let targetW = rawW;
    let targetH = rawH;

    if (rawW >= rawH) {
      if (rawW > maxDim) {
        targetW = maxDim;
        targetH = Math.round((rawH * maxDim) / rawW);
      }
    } else {
      if (rawH > maxDim) {
        targetH = maxDim;
        targetW = Math.round((rawW * maxDim) / rawH);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontal if front facing user for natural mirror look
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Compress to JPEG 75% quality for lightweight 100-300KB storage
    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);

    // Approximate size in bytes from base64
    const stringLength = dataUrl.length - 'data:image/jpeg;base64,'.length;
    const sizeBytes = Math.round((stringLength * 3) / 4);

    // 10MB hard limit validation
    const maxSizeBytes = 10 * 1024 * 1024;
    if (sizeBytes > maxSizeBytes) {
      setCameraError('Ukuran foto terlalu besar. Silakan ambil foto kembali.');
      return;
    }

    const metadata: SelfiePhotoMetadata = {
      dataUrl,
      width: targetW,
      height: targetH,
      sizeBytes,
      mimeType: 'image/jpeg',
    };

    setPhotoMeta(metadata);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setPhotoMeta(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage, photoMeta || undefined);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl border border-zinc-800 text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Camera className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-sm sm:text-base text-zinc-100">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera Preview / Captured Picture */}
        <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-zinc-300">
              <AlertTriangle className="mx-auto h-12 w-12 text-amber-400 mb-3" />
              <p className="text-sm leading-relaxed mb-4">{cameraError}</p>
              <button
                onClick={startCamera}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2.5 text-xs font-semibold hover:bg-zinc-700 text-white transition-colors"
              >
                <RefreshCw className="h-4 w-4" /> Coba Lagi
              </button>
            </div>
          ) : capturedImage ? (
            <div className="relative h-full w-full">
              <img
                src={capturedImage}
                alt="Selfie Absensi"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 right-3 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-sm flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Foto Siap
              </div>
            </div>
          ) : (
            <div className="relative h-full w-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
              {isInitializing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-zinc-300">
                  <RefreshCw className="h-6 w-6 animate-spin text-emerald-400 mb-2" />
                </div>
              )}
              {/* Face Target Guide Oval */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-64 w-52 rounded-[50%] border-2 border-dashed border-emerald-400/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]"></div>
              </div>
              <div className="absolute bottom-3 inset-x-0 text-center">
                <span className="inline-block rounded-full bg-black/60 px-3 py-1 text-xs text-zinc-200 backdrop-blur-sm">
                  Posisikan wajah Anda di dalam lingkaran
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-zinc-800 p-4 bg-zinc-900">
          {capturedImage ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Ulangi Foto
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" /> Gunakan Foto
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                className="rounded-xl border border-zinc-800 bg-zinc-800/80 p-3 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                title="Ganti Kamera Depan/Belakang"
              >
                <RefreshCw className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={takeSnapshot}
                disabled={isInitializing || !!cameraError}
                className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <Camera className="h-5 w-5" /> Ambil Foto Sekarang
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
