import { useState, useCallback } from 'react';

const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = 'GPS غير مدعوم في هذا المتصفح';
        setError(msg);
        reject(new Error(msg));
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setLocation(coords);
          setLoading(false);
          resolve(coords);
        },
        (err) => {
          let msg = 'تعذر الحصول على موقعك';
          if (err.code === 1) msg = 'تم رفض إذن الموقع. يرجى السماح بالوصول';
          if (err.code === 2) msg = 'الموقع غير متاح حالياً. تأكد من تفعيل GPS';
          if (err.code === 3) msg = 'انتهت مهلة طلب الموقع. حاول مرة أخرى';
          setError(msg);
          setLoading(false);
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  return { location, error, loading, getLocation };
};

export default useGeolocation;