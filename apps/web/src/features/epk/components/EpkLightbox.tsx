'use client';

// EpkLightbox — minimal full-screen image lightbox.
// Keyboard: Escape closes, ArrowLeft/ArrowRight navigates.
// Click outside the image or the × button closes.

import { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface EpkLightboxProps {
  images: string[];
  activeIndex: number;
  altBase: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function EpkLightbox({
  images,
  activeIndex,
  altBase,
  onClose,
  onNavigate,
}: EpkLightboxProps) {
  const prev = useCallback(() => {
    onNavigate((activeIndex - 1 + images.length) % images.length);
  }, [activeIndex, images.length, onNavigate]);

  const next = useCallback(() => {
    onNavigate((activeIndex + 1) % images.length);
  }, [activeIndex, images.length, onNavigate]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, prev, next]);

  // Prevent body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const src = images[activeIndex];
  if (!src) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        aria-label="Close"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '50%',
          width: 40,
          height: 40,
          color: 'white',
          fontSize: 22,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
      >
        ×
      </button>

      {/* Prev */}
      {images.length > 1 && (
        <button
          aria-label="Previous"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          style={{
            position: 'absolute',
            left: 16,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '50%',
            width: 44,
            height: 44,
            color: 'white',
            fontSize: 20,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ←
        </button>
      )}

      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${altBase} ${activeIndex + 1}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 'min(90vw, 1200px)',
          maxHeight: '85vh',
          objectFit: 'contain',
          borderRadius: 4,
          boxShadow: '0 8px 64px rgba(0,0,0,0.8)',
        }}
      />

      {/* Next */}
      {images.length > 1 && (
        <button
          aria-label="Next"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          style={{
            position: 'absolute',
            right: 16,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '50%',
            width: 44,
            height: 44,
            color: 'white',
            fontSize: 20,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          →
        </button>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <span
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 13,
          }}
        >
          {activeIndex + 1} / {images.length}
        </span>
      )}
    </div>,
    document.body,
  );
}
