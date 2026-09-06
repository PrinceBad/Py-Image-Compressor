import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, RefreshCw, ZoomIn } from 'lucide-react';
import { formatBytes } from '../utils/helpers';
import { generateCompressedBlob, generateProfileBlob } from '../utils/compression';
import { getProfileById } from '../constants/profiles';

/**
 * High-performance Before/After image comparison modal.
 * - Draggable split-view slider to inspect image compression quality at 100% resolution.
 * - Generates live comparison preview immediately if file hasn't been finalized yet.
 */
export default function PreviewModal({ file, onClose, globalQuality = 80, globalFormat = 'jpeg', globalScale = 100 }) {
  const [sliderPos, setSliderPos] = useState(50); // % from left
  const [isDragging, setIsDragging] = useState(false);
  const [localCompressedUrl, setLocalCompressedUrl] = useState(file.compressedUrl || null);
  const [isGenerating, setIsGenerating] = useState(!file.compressedUrl);
  const [localSize, setLocalSize] = useState(file.estimatedSize || null);
  const containerRef = useRef(null);

  // Generate comparison preview on the fly if not finalized
  useEffect(() => {
    if (file.compressedUrl) {
      setLocalCompressedUrl(file.compressedUrl);
      setLocalSize(file.estimatedSize);
      setIsGenerating(false);
      return;
    }

    let isMounted = true;
    let createdUrl = null;

    const generatePreview = async () => {
      setIsGenerating(true);
      try {
        let blob = null;
        if (file.profileId) {
          const prof = getProfileById(file.profileId);
          if (prof) {
            const res = await generateProfileBlob(file.originalFile, prof);
            blob = res?.blob;
          }
        } else {
          const q = file.lastCalculatedQuality || globalQuality;
          const f = file.outputFormat || globalFormat;
          const s = file.lastCalculatedScale || globalScale;
          blob = await generateCompressedBlob(file.originalFile, q, f, s);
        }

        if (blob && isMounted) {
          createdUrl = URL.createObjectURL(blob);
          setLocalCompressedUrl(createdUrl);
          setLocalSize(blob.size);
        }
      } catch (err) {
        console.warn('Could not generate on-the-fly preview:', err);
      } finally {
        if (isMounted) setIsGenerating(false);
      }
    };

    generatePreview();

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [file, globalQuality, globalFormat, globalScale]);

  const updateSlider = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  // Global mouse / touch tracking while dragging
  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e) => updateSlider(e.clientX);
    const onTouchMove = (e) => updateSlider(e.touches[0].clientX);
    const onPointerUp = () => setIsDragging(false);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchend', onPointerUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchend', onPointerUp);
    };
  }, [isDragging, updateSlider]);

  // Close on ESC key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const displaySize = localSize || file.estimatedSize;
  const savingsPct =
    displaySize && file.originalSize
      ? (((file.originalSize - displaySize) / file.originalSize) * 100).toFixed(1)
      : null;

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-[#13062a] rounded-2xl border border-white/10 overflow-hidden max-w-5xl w-full shadow-2xl flex flex-col"
        style={{ maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0 bg-black/30">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-bold text-base truncate" title={file.name}>
                {file.name}
              </p>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded uppercase font-semibold">
                Live Comparison
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400 flex-wrap">
              <span>
                Original:{' '}
                <span className="text-white font-semibold">{formatBytes(file.originalSize)}</span>
              </span>
              {displaySize && (
                <span>
                  Compressed:{' '}
                  <span className="text-[#00ffcc] font-semibold">{formatBytes(displaySize)}</span>
                </span>
              )}
              {savingsPct && parseFloat(savingsPct) > 0 && (
                <span className="text-[#00ffcc] bg-[#00ffcc]/15 px-2 py-0.5 rounded border border-[#00ffcc]/30 font-bold">
                  -{savingsPct}% Saved
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Comparison area ── */}
        <div className="relative flex-1 overflow-hidden" style={{ minHeight: '420px', height: '65vh' }}>
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-purple-300">
              <RefreshCw className="w-8 h-8 animate-spin text-[#f00b51]" />
              <p className="text-sm font-medium">Generating high-fidelity preview...</p>
            </div>
          ) : localCompressedUrl ? (
            <>
              {/* Split-view container */}
              <div
                ref={containerRef}
                className="relative w-full h-full bg-[#070111] select-none"
                style={{ cursor: 'ew-resize' }}
                onMouseDown={(e) => { setIsDragging(true); updateSlider(e.clientX); }}
                onTouchStart={(e) => { setIsDragging(true); updateSlider(e.touches[0].clientX); }}
              >
                {/* BASE: Original image (underneath) */}
                <img
                  src={file.previewUrl}
                  alt="Original"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none p-2"
                  draggable={false}
                />

                {/* TOP: Compressed image (clipped to right portion) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                >
                  <img
                    src={localCompressedUrl}
                    alt="Compressed"
                    className="w-full h-full object-contain pointer-events-none p-2"
                    draggable={false}
                  />
                </div>

                {/* Divider line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 pointer-events-none"
                  style={{
                    left: `${sliderPos}%`,
                    background: '#00ffcc',
                    boxShadow: '0 0 12px rgba(0,255,204,0.8)',
                  }}
                />

                {/* Drag handle */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-2xl flex items-center justify-center pointer-events-none z-10 border-2 border-[#00ffcc]"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-4 bg-gray-600 rounded-full" />
                    <div className="w-0.5 h-4 bg-gray-600 rounded-full" />
                  </div>
                </div>

                {/* Badges */}
                <div className="absolute top-4 left-4 bg-black/80 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md pointer-events-none shadow-lg">
                  ORIGINAL
                </div>
                <div className="absolute top-4 right-4 bg-[#00ffcc]/20 text-[#00ffcc] text-xs font-bold px-3 py-1.5 rounded-full border border-[#00ffcc]/40 backdrop-blur-md pointer-events-none shadow-lg">
                  COMPRESSED
                </div>
              </div>

              {/* Bottom hint bar */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70 bg-black/70 px-4 py-1.5 rounded-full pointer-events-none select-none border border-white/10 backdrop-blur-sm">
                ⟵ Drag slider to compare visual quality ⟶
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
              <img
                src={file.previewUrl}
                alt="Original preview"
                className="max-h-80 object-contain rounded-xl border border-white/10"
              />
              <p className="text-gray-400 text-sm">Preview unavailable for this image format.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
