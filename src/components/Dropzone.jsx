import React from 'react';
import { UploadCloud } from 'lucide-react';

export default function Dropzone({ isDragging, fileInputRef, onDrop, onDragOver, onDragLeave, onFileInput }) {
  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-300 ease-in-out flex flex-col items-center justify-center min-h-[160px] backdrop-blur-md
        ${isDragging
          ? 'border-[#f00b51] bg-[#f00b51]/10 shadow-[inset_0_0_50px_rgba(240,11,81,0.15)] scale-[1.02]'
          : 'border-purple-400/30 bg-black/20 hover:border-[#f00b51]/50 hover:bg-black/40'
        }`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileInput}
        multiple
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      <div
        className={`p-4 rounded-full mb-4 transition-colors ${
          isDragging ? 'bg-[#f00b51]/20 text-[#f00b51]' : 'bg-white/5 text-purple-300'
        }`}
      >
        <UploadCloud className="w-10 h-10" />
      </div>

      <h3 className="text-xl font-bold text-white mb-2 tracking-wide">DRAG &amp; DROP YOUR IMAGES HERE</h3>
      <p className="text-purple-300/80 text-sm mb-8 max-w-md mx-auto">
        Drop files to see real-time size estimations. Supports JPEG, PNG, and WEBP.
      </p>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="bg-white/10 border border-white/20 text-white font-semibold py-2.5 px-8 rounded-full hover:bg-white/20 hover:scale-105 shadow-sm transition-all duration-300 uppercase tracking-wider text-sm"
      >
        Browse Files
      </button>
    </div>
  );
}
