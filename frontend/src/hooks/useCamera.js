import { useState, useRef, useCallback } from 'react';

const useCamera = () => {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = useCallback(async () => {
    setError(null);
    setCapturedImage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      return true;
    } catch (err) {
      let msg = 'تعذر الوصول إلى الكاميرا';
      if (err.name === 'NotAllowedError') msg = 'تم رفض إذن الكاميرا. يرجى السماح بالوصول';
      if (err.name === 'NotFoundError') msg = 'لا توجد كاميرا متاحة على هذا الجهاز';
      if (err.name === 'NotSupportedError') msg = 'الكاميرا غير مدعومة (يتطلب HTTPS)';
      setError(msg);
      return false;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    // Mirror the image (since video is mirrored via CSS)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    return dataUrl;
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  // Convert base64 dataUrl to File/Blob for FormData upload
  const dataUrlToBlob = useCallback((dataUrl) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }, []);

  return {
    videoRef,
    canvasRef,
    stream,
    capturedImage,
    error,
    isActive: !!stream,
    startCamera,
    capturePhoto,
    stopCamera,
    retake,
    dataUrlToBlob,
  };
};

export default useCamera;