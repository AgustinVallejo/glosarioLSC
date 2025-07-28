
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VideoCameraIcon, StopIcon, PlayIcon, CheckIcon, XMarkIcon, ArrowPathIcon } from './icons';

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  // This signature should match App.tsx's handleSaveWord.
  onSaveWord: (wordName: string, videoBlob: Blob, note?: string, location?: { latitude: number; longitude: number }) => void; 
  existingWordName?: string | null;
  newWordName?: string | null;
}

export const AddWordModal: React.FC<AddWordModalProps> = ({ isOpen, onClose, onSaveWord, existingWordName, newWordName }) => {
  const [wordName, setWordName] = useState('');
  const [note, setNote] = useState('');
  const [useLocation, setUseLocation] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null); // For photo capture

  useEffect(() => {
    if (existingWordName) {
      setWordName(existingWordName);
    } else if (newWordName) {
      setWordName(newWordName);
    } else {
      setWordName('');
    }
    setNote('');
    setUseLocation(false);
    setLocation(null);
    setLocationError(null);
    setIsRecording(false);
    setRecordedVideoUrl(null);
    setRecordedVideoBlob(null);
    setError(null);
    recordedChunksRef.current = [];
  }, [isOpen, existingWordName, newWordName]);

  const cleanupVideoStream = useCallback(() => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [videoStream]);

  useEffect(() => {
    return () => {
      cleanupVideoStream();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [cleanupVideoStream]);
  

  const startCamera = useCallback(async () => {
    setError(null);
    setRecordedVideoUrl(null);
    setRecordedVideoBlob(null);
    recordedChunksRef.current = [];
    if (videoStream) {
      if (videoRef.current) videoRef.current.srcObject = videoStream;
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      setVideoStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error("Error playing video preview:", e));
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("No se pudo acceder a la cámara. Revisa los permisos.");
      cleanupVideoStream();
    }
  }, [videoStream, cleanupVideoStream]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      cleanupVideoStream();
    }
  }, [isOpen, startCamera, cleanupVideoStream]);


  const handleStartRecording = () => {
    if (!videoStream) {
      setError("La cámara no está activa. Intenta de nuevo.");
      startCamera();
      return;
    }
    recordedChunksRef.current = [];
    setRecordedVideoUrl(null);
    setRecordedVideoBlob(null);
    try {
      const options = { mimeType: 'video/webm; codecs=vp9' }; 
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
         mediaRecorderRef.current = new MediaRecorder(videoStream);
      } else {
         mediaRecorderRef.current = new MediaRecorder(videoStream, options);
      }
     
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: recordedChunksRef.current[0]?.type || 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideoUrl(videoUrl);
        setRecordedVideoBlob(blob);
        setIsRecording(false);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError(null);
    } catch (e) {
      console.error("Error starting media recorder:", e);
      setError("No se pudo iniciar la grabación.");
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };
  
  const handleGetLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("La geolocalización no está soportada en este navegador.");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationError(null);
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationError("No se pudo obtener la ubicación. Verifica los permisos.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000 // 10 minutes
      }
    );
  };
  
  const handleCloseModal = () => {
    cleanupVideoStream();
    onClose();
  };

  const handleRetake = () => {
    setRecordedVideoUrl(null);
    setRecordedVideoBlob(null);
    // setPhotoDataUrl(null);
    recordedChunksRef.current = [];
    startCamera(); 
  };

  if (!isOpen) return null;

  const isMediaCaptured = recordedVideoUrl; // Simplified for now

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-sky-700">
            {existingWordName ? `Añadir Seña Alternativa para "${existingWordName}"` : "Añadir Nueva Palabra"}
          </h2>
          <button onClick={handleCloseModal} className="text-slate-500 hover:text-slate-700">
            <XMarkIcon className="w-7 h-7" />
          </button>
        </div>

        <div className="overflow-y-auto pr-2 flex-grow">
          {!existingWordName && (
            <div className="mb-5">
              <label htmlFor="wordName" className="block text-sm font-medium text-slate-700 mb-1">
                Palabra
              </label>
              <input
                type="text"
                id="wordName"
                value={wordName}
                onChange={(e) => setWordName(e.target.value)}
                placeholder="Ej: Hola, Gracias, Casa"
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                disabled={!!existingWordName}
              />
            </div>
          )}

          {/* Note field */}
          <div className="mb-5">
            <label htmlFor="note" className="block text-sm font-medium text-slate-700 mb-1">
              Nota (opcional)
            </label>
            <input
              type="text"
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Solo se usa en Medellín, Jerga juvenil, etc."
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Location section */}
          <div className="mb-5">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="useLocation"
                checked={useLocation}
                onChange={(e) => setUseLocation(e.target.checked)}
                className="mr-2 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <label htmlFor="useLocation" className="text-sm font-medium text-slate-700">
                Añadir ubicación (opcional)
              </label>
            </div>
            
            {useLocation && (
              <div className="pl-6 space-y-3">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={!!location}
                    className="flex items-center bg-slate-500 hover:bg-slate-600 text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    📍 Obtener mi ubicación
                  </button>
                  {location && (
                    <button
                      type="button"
                      onClick={() => setLocation(null)}
                      className="text-slate-500 hover:text-slate-700 text-sm"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                
                {location && (
                  <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                    📍 {location.latitude.toFixed(4)}°{location.latitude >= 0 ? 'N' : 'S'}, {location.longitude.toFixed(4)}°{location.longitude >= 0 ? 'E' : 'W'}
                  </div>
                )}
                
                {locationError && (
                  <div className="text-sm text-red-600">
                    {locationError}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Grabar Seña (video corto)
            </label>
            <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden relative shadow-inner">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${isMediaCaptured ? 'hidden' : 'block'}`}
                playsInline
                muted
                autoPlay 
              />
              {recordedVideoUrl && (
                <video
                  src={recordedVideoUrl}
                  className="w-full h-full object-cover block"
                  playsInline
                  controls
                  autoPlay
                  loop
                />
              )}
               {!videoStream && !isMediaCaptured && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4">
                  <VideoCameraIcon className="w-16 h-16 mb-2" />
                  <p>Iniciando cámara...</p>
                </div>
              )}
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-2">
            {!isMediaCaptured ? (
              // captureMode === 'video' ? (
                isRecording ? (
                  <button
                    onClick={handleStopRecording}
                    className="w-full sm:w-auto flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <StopIcon className="w-5 h-5 mr-2" />
                    Detener Grabación
                  </button>
                ) : (
                  <button
                    onClick={handleStartRecording}
                    disabled={!videoStream || isRecording}
                    className="w-full sm:w-auto flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlayIcon className="w-5 h-5 mr-2" />
                    Grabar Seña
                  </button>
                )
            ) : (
              <>
                <button
                  onClick={handleRetake}
                  className="w-full sm:w-auto flex items-center justify-center bg-slate-500 hover:bg-slate-600 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <ArrowPathIcon className="w-5 h-5 mr-2" />
                  {/* {recordedVideoUrl ? "Volver a Grabar" : "Volver a Tomar"} */}
                  Volver a Grabar
                </button>
                <button
                  onClick={() => recordedVideoBlob && onSaveWord(
                    wordName, 
                    recordedVideoBlob,
                    note.trim() || undefined,
                    useLocation ? location || undefined : undefined
                  )}
                  disabled={!recordedVideoBlob}
                  className="w-full sm:w-auto flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckIcon className="w-5 h-5 mr-2" />
                  {/* {recordedVideoUrl ? "Guardar Seña" : "Guardar Foto"} */}
                  Guardar Seña
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
};
