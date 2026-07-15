"use client";

import { useEffect, useState } from "react";

/**
 * true solo si el dispositivo es un telefono Android (UA con "Android" + "Mobile").
 * Se resuelve despues del montaje para evitar mismatch de hidratacion.
 * Nota: la app movil se distribuye como APK (Android), por eso no aplica a iOS.
 */
export function useIsAndroidPhone(): boolean {
  const [isPhone, setIsPhone] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent;
    setIsPhone(/android/i.test(ua) && /mobile/i.test(ua));
  }, []);
  return isPhone;
}
