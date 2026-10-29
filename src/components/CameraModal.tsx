import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, Upload } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string, filename: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isStarting, setIsStarting] = useState<boolean>(false);

  // Helper to reliably stop all active media stream tracks
  const stopCurrentStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping media track:', e);
        }
      });
      streamRef.current = null;
    }
    setStream(null);
  };

  // Main lifecycle effect: starts camera on open/facingMode change, cleans up tracks on close/unmount
  useEffect(() => {
    if (!isOpen) {
      stopCurrentStream();
      setCapturedImage(null);
      setCameraError(null);
      setIsStarting(false);
      return;
    }

    let isCurrent = true;

    const initCamera = async () => {
      // 1. Release previous stream before requesting another
      stopCurrentStream();
      setCameraError(null);
      setIsStarting(true);

      // 2. Check browser environment requirements (HTTPS / localhost)
      const isSecure =
        typeof window !== 'undefined' &&
        (window.isSecureContext ||
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1');

      if (!isSecure) {
        if (isCurrent) {
          setIsStarting(false);
          setCameraError(
            'Camera access requires a secure connection (HTTPS or localhost). If running inside an embedded preview iframe, camera permissions might be restricted by the browser.'
          );
        }
        return;
      }

      // 3. Verify mediaDevices support
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isCurrent) {
          setIsStarting(false);
          setCameraError(
            'Camera access is not supported by this browser or is blocked by your current browser environment settings.'
          );
        }
        return;
      }

      try {
        let mediaStream: MediaStream | null = null;

        // Multi-tier fallback for camera constraints
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch (e1) {
          try {
            console.warn('Retrying with simple facingMode constraint...', e1);
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: facingMode } },
              audio: false,
            });
          } catch (e2) {
            console.warn('Retrying with default video:true constraint...', e2);
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          }
        }

        if (!mediaStream) {
          throw new Error('Unable to acquire camera stream.');
        }

        // If component unmounted or mode changed during await, cancel stream immediately
        if (!isCurrent) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = mediaStream;
        setStream(mediaStream);
        setIsStarting(false);

        // Attach stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch((playErr) => {
            if (playErr.name !== 'AbortError') {
              console.warn('Video play warning:', playErr);
            }
          });
        }
      } catch (err: any) {
        if (!isCurrent) return;
        setIsStarting(false);
        console.warn('Camera initialization error:', err);

        // Detailed error diagnosis
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError(
            'Camera permission was denied. Please click the lock or camera icon in your browser address bar to allow camera access, or use the "Device Camera / Photos" button below.'
          );
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError(
            'No camera hardware device found on this system. You can easily take or upload a photo using the button below.'
          );
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setCameraError(
            'The camera is currently in use by another app or browser tab. Please close other camera apps and try again.'
          );
        } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
          setCameraError(
            'The requested camera resolution or facing mode is not supported by your camera hardware.'
          );
        } else if (err.name === 'SecurityError') {
          setCameraError(
            'Camera access is blocked by browser security or iframe sandbox policy. Please use the "Device Camera / Photos" button below to capture or select a photo directly.'
          );
        } else {
          setCameraError(err.message || 'Could not access camera device. Please check your browser settings or use the photo button.');
        }
      }
    };

    initCamera();

    return () => {
      isCurrent = false;
      stopCurrentStream();
    };
  }, [isOpen, facingMode]);

  // Video attachment effect: ensures video element receives stream whenever mounted or stream updates
  useEffect(() => {
    if (stream && videoRef.current && !capturedImage && !cameraError) {
      const video = videoRef.current;
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.play().catch((err) => {
        if (err.name !== 'AbortError') {
          console.warn('Video play error:', err);
        }
      });
    }
  }, [stream, capturedImage, cameraError]);

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontal if selfie camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(dataUrl);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      const filename = `camera_photo_${Date.now()}.jpg`;
      onCapture(capturedImage, filename);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleFallbackFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCapturedImage(reader.result);
          setCameraError(null);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Hidden Fallback File Input for photos */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFallbackFileSelect}
        />

        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Camera className="w-4 h-4 text-purple-400" />
            <span>Camera Capture</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700/80 transition cursor-pointer"
              title="Take a photo with your device camera or pick from gallery"
            >
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Device Camera / File</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close camera"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video or Snapshot Preview */}
        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-xs sm:text-sm text-rose-300 flex flex-col items-center gap-3">
              <AlertCircle className="w-8 h-8 text-rose-400 shrink-0" />
              <p className="max-w-md leading-relaxed">{cameraError}</p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCameraError(null);
                    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                >
                  Retry Camera
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Photo / Take Photo</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                You can also use the &quot;Photos&quot; button in the chat interface.
              </p>
            </div>
          ) : capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => {
                  videoRef.current?.play().catch(() => {});
                }}
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
              {isStarting && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-slate-300 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2 text-purple-400" />
                  Connecting camera...
                </div>
              )}
            </>
          )}

          {/* Switch Camera Button (Front / Back) */}
          {!capturedImage && !cameraError && (
            <button
              onClick={toggleCameraFacing}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 transition shadow-md"
              title="Flip camera (front / back)"
              aria-label="Switch camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          {capturedImage ? (
            <>
              <button
                onClick={handleRetake}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Retake
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg transition"
              >
                <Check className="w-4 h-4" />
                <span>Use Photo</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={takeSnapshot}
                disabled={!!cameraError || isStarting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg transition disabled:opacity-40"
              >
                <Camera className="w-4 h-4" />
                <span>Snap Photo</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
