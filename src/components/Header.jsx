import React from 'react';
import { FileImage } from 'lucide-react';
import { formatBytes } from '../utils/helpers';

export default function Header({ files, totalSaved }) {
  return (
    <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3">
        <div className="bg-[#f00b51] p-2 rounded-lg shadow-[0_0_15px_rgba(240,11,81,0.5)]">
          <FileImage className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide leading-tight">
            PY-<span className="text-[#f00b51]">IMAGE</span>
          </h1>
          <p className="text-xs text-purple-300 font-medium tracking-wider">REAL-TIME COMPRESSOR</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="hidden sm:flex items-center gap-4 text-sm font-medium">
          <div className="text-gray-300">
            Files: <span className="text-white font-bold">{files.length}</span>
          </div>
          {totalSaved > 0 && (
            <div className="text-[#00ffcc] bg-[#00ffcc]/10 px-3 py-1 rounded-full border border-[#00ffcc]/20 shadow-[0_0_10px_rgba(0,255,204,0.1)]">
              Est. Savings {formatBytes(totalSaved)}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
