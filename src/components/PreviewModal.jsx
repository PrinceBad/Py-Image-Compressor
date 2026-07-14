import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { formatBytes } from '../utils/helpers';

/**
 * Before/After image comparison modal.
 * - If the file is 'done' (has a compressedUrl), shows a draggable split-view.
 * - Otherwise shows the original image and a hint to finalize first.
 */
export default function PreviewModal({ file, onClose }) {
  const [sliderPos, setSliderPos] = useState(50); // % from left
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const hasBothImages = file.status === 'done' && !!file.compressedUrl;

  const updateSlider = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  // Global mouse / touch tracking while dragging
  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove  = (e) => updateSlider(e.clientX);
    const onTouchMove  = (e) => updateSlider(e.touches[0].clientX);
    const onPointerUp  = () => setIsDragging(false);
    document.addEventListener('mousemove',  onMouseMove);
    document.addEventListener('touchmove',  onTouchMove, { passive: true });
    document.addEventListener('mouseup',    onPointerUp);
    document.addEventListener('touchend',   onPointerUp);
    return () => {
      document.removeEventListener('mousemove',  onMouseMove);
      document.removeEventListener('touchmove',  onTouchMove);
      document.removeEventListener('mouseup',    onPointerUp);
      document.removeEventListener('touchend',   onPointerUp);
    };
  }, [isDragging, updateSlider]);

  // Close on ESC key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const savingsPct =
    file.estimatedSize && file.originalSize
      ? (((file.originalSize - file.estimatedSize) / file.originalSize) * 100).toFixed(1)
      : null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-[#13062a] rounded-2xl border border-white/10 overflow-hidden max-w-4xl w-full shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate" title={file.name}>
              {file.name}
            </p>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-400 flex-wrap">
              <span>
                Original:{' '}
                <span className="text-white font-medium">{formatBytes(file.originalSize)}</span>
              </span>
              {file.estimatedSize && (
                <span>
                  Compressed:{' '}
                  <span className="text-[#00ffcc] font-medium">{formatBytes(file.estimatedSize)}</span>
                </span>
              )}
              {savingsPct && parseFloat(savingsPct) > 0 && (
                <span className="text-[#00ffcc] bg-[#00ffcc]/10 px-2 py-0.5 rounded border border-[#00ffcc]/20 font-bold">
                  -{savingsPct}% saved
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* ── Comparison area ── */}
        <div className="relative flex-1 overflow-hidden" style={{ minHeight: '360px' }}>
          {hasBothImages ? (
            <>
              {/* Split-view container */}
              <div
                ref={containerRef}
                className="relative w-full h-full bg-[#0a0118] select-none"
                style={{ cursor: 'ew-resize', minHeight: '360px' }}
                onMouseDown={(e) => { setIsDragging(true); updateSlider(e.clientX); }}
                onTouchStart={(e) => { setIsDragging(true); updateSlider(e.touches[0].clientX); }}
              >
                {/* BASE: Original image (always full-width, underneath) */}
                <img
                  src={file.previewUrl}
                  alt="Original"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />

                {/* TOP: Compressed image, clipped to right portion of the slider */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                >
                  <img
                    src={file.compressedUrl}
                    alt="Compressed"
                    className="w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                </div>

                {/* Divider line */}
                <div
                  className="absolute top-0 bottom-0 w-px pointer-events-none"
                  style={{
                    left: `${sliderPos}%`,
                    background: 'rgba(255,255,255,0.9)',
                    boxShadow: '0 0 10px rgba(255,255,255,0.6)',
                  }}
                />

                {/* Drag handle circle */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-white shadow-2xl flex items-center justify-center pointer-events-none z-10 border-2 border-white/80"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-5 bg-gray-400 rounded-full" />
                    <div className="w-0.5 h-5 bg-gray-400 rounded-full" />
                  </div>
                </div>

                {/* Corner labels */}
                <div className="absolute top-3 left-3 bg-black/70 text-white text-xs font-bold px-2.5 py-1.5 rounded-full border border-white/20 backdrop-blur-sm pointer-events-none">
                  ORIGINAL
                </div>
                <div className="absolute top-3 right-3 bg-[#00ffcc]/15 text-[#00ffcc] text-xs font-bold px-2.5 py-1.5 rounded-full border border-[#00ffcc]/30 backdrop-blur-sm pointer-events-none">
                  COMPRESSED
                </div>
              </div>

              {/* Instruction hint */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-white/40 bg-black/50 px-3 py-1 rounded-full pointer-events-none select-none">
                ← Drag to compare →
              </div>
            </>
          ) : (
            /* Single image view (not yet finalized) */
            <div className="flex flex-col items-center justify-center p-8 min-h-[360px] gap-4">
              <img
                src={file.previewUrl}
                alt="Original preview"
                className="max-h-72 object-contain rounded-xl border border-white/10"
              />
              {file.status !== 'done' && (
                <p className="text-gray-400 text-sm text-center">
                  Click{' '}
                  <span className="text-white font-semibold">Finalize &amp; Download</span>
                  {' '}to enable before/after comparison.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
