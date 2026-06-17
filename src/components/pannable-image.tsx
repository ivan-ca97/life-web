"use client";

import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface PannableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
}

export function PannableImage({ src, alt = "", className, style, ...props }: PannableImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const dragState = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const img = imgRef.current;
    if (!img) return;
    // Only pan if the image is actually cropped
    const cropped = img.naturalWidth / img.naturalHeight !== img.clientWidth / img.clientHeight;
    if (!cropped) return;
    e.preventDefault();
    img.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, startPosX: position.x, startPosY: position.y };
    setDragging(true);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    const img = imgRef.current;
    if (!ds || !img) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    const scale = 100 / Math.max(img.clientWidth, img.clientHeight);
    setPosition({
      x: Math.max(0, Math.min(100, ds.startPosX - dx * scale)),
      y: Math.max(0, Math.min(100, ds.startPosY - dy * scale)),
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragState.current = null;
    setDragging(false);
  }, []);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      draggable={false}
      className={cn("select-none", dragging ? "cursor-grabbing" : "cursor-grab", className)}
      style={{ ...style, objectPosition: `${position.x}% ${position.y}%` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      {...props}
    />
  );
}
