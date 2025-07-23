
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Word } from '../types'; // Assuming types.ts has Word and SignVideo
import { VideoCameraIcon, StopIcon, PlayIcon, CheckIcon, XMarkIcon, ArrowPathIcon } from './icons'; // Removed CameraIcon, assuming it's not used if photo functionality isn't being re-added here.

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  // This signature should match App.tsx's handleSaveWord.
  // If App.tsx expects (wordName: string, videoDataUrl: string), this is correct.
  // If App.tsx expects (wordName: string, mediaDataUrl: string, mediaType: 'video' | 'photo'), this needs update.
  // Sticking to the provided files, it's (wordName: string, videoDataUrl: string)
  onSaveWord: (wordName: string, videoDataUrl: string) => void; 
  existingWordName?: string | null;
}

export const AddWordModal: React.FC<AddWordModalProps> = ({ isOpen, onClose, onSaveWord, existingWordName }) => {
  const [wordName, setWordName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // States for photo capture would be here if that feature was being re-added
  // const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  // const [captureMode, setCaptureMode] = useState<'video' | 'photo'>('video');


  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null); // For photo capture

  useEffect(() => {
    if (existingWordName) {
      setWordName(existingWordName);
    } else {
      setWordName('');
    }
    setIsRecording(false);
    setRecordedVideoUrl(null);
    // setPhotoDataUrl(null);
    setError(null);
    recordedChunksRef.current = [];
    // setCaptureMode('video'); // Reset to video mode
  }, [isOpen, existingWordName]);

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
    // setPhotoDataUrl(null);
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

  // const handleTakePhoto = () => {
  //   if (!videoRef.current || !videoStream) {
  //     setError("La cámara no está activa para tomar foto.");
  //     startCamera();
  //     return;
  //   }
  //   const videoNode = videoRef.current;
  //   const canvas = canvasRef.current || document.createElement('canvas');
  //   if (!canvasRef.current) { // Mount canvas if not already
  //       canvas.style.display = "none";
  //       document.body.appendChild(canvas);
  //   }
  //   canvas.width = videoNode.videoWidth;
  //   canvas.height = videoNode.videoHeight;
  //   const context = canvas.getContext('2d');
  //   if (context) {
  //     context.drawImage(videoNode, 0, 0, canvas.width, canvas.height);
  //     const dataUrl = canvas.toDataURL('image/jpeg'); // Or image/png
  //     setPhotoDataUrl(dataUrl);
  //     setRecordedVideoUrl(null); // Clear any video
  //     setError(null);
  //   } else {
  //     setError("No se pudo capturar la foto.");
  //   }
  //   if (!canvasRef.current) { // Clean up if temporarily created
  //       document.body.removeChild(canvas);
  //   }
  // };


  const handleSave = () => {
    if (!wordName.trim()) {
      setError("Por favor, ingresa el nombre de la palabra.");
      return;
    }

    // This logic needs to align with whether we're saving a photo or video
    // if (captureMode === 'photo' && photoDataUrl) {
    //   onSaveWord(wordName.trim(), photoDataUrl); // Potentially needs a third 'photo' arg
    //   handleCloseModal();
    // } else 
    if (recordedVideoUrl) {
      const blobType = recordedChunksRef.current[0]?.type || 'video/webm';
      const blob = new Blob(recordedChunksRef.current, { type: blobType });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        onSaveWord(wordName.trim(), base64data); // Potentially needs a third 'video' arg
        handleCloseModal();
      };
      reader.onerror = () => {
        setError("Error al procesar el video. Intenta de nuevo.");
      }
      reader.readAsDataURL(blob);
    } else {
      setError("Por favor, graba un video o toma una foto para la seña."); // Adjusted error
    }
  };
  
  const handleCloseModal = () => {
    cleanupVideoStream();
    onClose();
  };

  const handleRetake = () => {
    setRecordedVideoUrl(null);
    // setPhotoDataUrl(null);
    recordedChunksRef.current = [];
    startCamera(); 
  };

  if (!isOpen) return null;

  // const isMediaCaptured = recordedVideoUrl || photoDataUrl;
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

          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {/* {captureMode === 'video' ? "Grabar Seña (video corto)" : "Tomar Foto de Seña"} */}
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
              {/* {photoDataUrl && (
                <img src={photoDataUrl} alt="Previsualización de foto" className="w-full h-full object-cover block" />
              )} */}
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
          
          {/* Buttons for switching mode
          <div className="flex justify-center gap-2 mb-3">
            <button 
              onClick={() => { setCaptureMode('video'); handleRetake(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${captureMode === 'video' ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
            >
              Grabar Video
            </button>
            <button 
              onClick={() => { setCaptureMode('photo'); handleRetake(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${captureMode === 'photo' ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
            >
              Tomar Foto
            </button>
          </div>
          */}


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
              // ) : ( // Photo capture button
              //   <button
              //     onClick={handleTakePhoto}
              //     disabled={!videoStream}
              //     className="w-full sm:w-auto flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed"
              //   >
              //     <CameraIcon className="w-5 h-5 mr-2" />
              //     Tomar Foto
              //   </button>
              // )
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
                  onClick={handleSave}
                  className="w-full sm:w-auto flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500"
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
