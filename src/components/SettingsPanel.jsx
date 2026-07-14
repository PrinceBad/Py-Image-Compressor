import React from 'react';
import { Settings, CheckCircle, RefreshCw, Maximize2, X } from 'lucide-react';
import { DSSB_PROFILES } from '../constants/profiles';
import { formatBytes } from '../utils/helpers';

export default function SettingsPanel({
  quality, setQuality,
  format, setFormat,
  scale, setScale,
  activeProfile, setActiveProfile,
  files,
  totalCompressedSize,
  isProcessingAll,
  onProcessAll,
}) {
  const isProfileMode = !!activeProfile;
  const profile = isProfileMode ? DSSB_PROFILES.find((p) => p.id === activeProfile) : null;

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 p-5 sticky top-24">
      {/* Panel Header */}
      <div className="flex items-center gap-2 mb-5 border-b border-white/10 pb-4">
        <Settings className="w-5 h-5 text-purple-300" />
        <h2 className="text-lg font-semibold text-white tracking-wide">SETTINGS</h2>
      </div>

      {/* ── DSSB Profiles ── */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-gray-300 uppercase tracking-widest">
            DSSB Profiles
          </label>
          <span className="text-[10px] bg-[#f00b51]/20 text-[#f00b51] px-2 py-0.5 rounded border border-[#f00b51]/30 font-bold tracking-wider">
            GOVT
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {DSSB_PROFILES.map((p) => {
            const isActive = activeProfile === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActiveProfile(isActive ? null : p.id)}
                className="p-2.5 rounded-lg border text-left transition-all duration-200"
                style={
                  isActive
                    ? { background: p.bg, borderColor: p.accent }
                    : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }
                }}
              >
                <div
                  className="text-[11px] font-bold tracking-wide truncate"
                  style={{ color: isActive ? p.accent : '#9ca3af' }}
                >
                  {p.shortName}
                </div>
                <div className="text-[10px] text-gray-500 truncate mt-0.5">{p.dimensionLabel}</div>
                <div className="text-[9px] mt-0.5" style={{ color: isActive ? p.accent : '#6b7280', opacity: 0.8 }}>
                  {p.targetSizeLabel}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active profile details card */}
        {profile && (
          <div
            className="mt-3 p-3 rounded-lg border"
            style={{ background: profile.bg, borderColor: profile.border }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-xs tracking-wide">{profile.name}</span>
              <button
                onClick={() => setActiveProfile(null)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Clear profile"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-[11px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-400">Dimensions</span>
                <span className="text-white font-medium">{profile.dimensionLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Target Size</span>
                <span className="font-bold" style={{ color: profile.accent }}>{profile.targetSizeLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Format</span>
                <span className="text-white font-medium">JPEG</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Quality</span>
                <span className="text-[#00ffcc] font-medium">Auto ✦</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Note</span>
                <span className="text-gray-300">{profile.note}</span>
              </div>
            </div>
          </div>
        )}

        {!activeProfile && (
          <p className="text-[10px] text-purple-400/50 text-center mt-2">
            Default profile for newly added files. Change per-file in the table.
          </p>
        )}
      </div>

      {/* ── Manual Settings (hidden in profile mode) ── */}
      {!isProfileMode && (
        <div className="space-y-5 border-t border-white/10 pt-5">
          {/* Output Format */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Output Format</label>
            <div className="grid grid-cols-3 gap-1.5">
              {['jpeg', 'webp', 'png'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`py-2 px-1 text-xs font-bold tracking-wider rounded-lg border transition-all duration-200 ${
                    format === f
                      ? 'bg-[#f00b51]/20 border-[#f00b51] text-[#f00b51] shadow-[0_0_12px_rgba(240,11,81,0.2)]'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/30'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
            {format === 'png' && (
              <p className="text-[10px] text-yellow-400/70 mt-2 leading-relaxed">
                ⚠ PNG is lossless — quality slider has no effect. Only scale reduces size.
              </p>
            )}
          </div>

          {/* Scale Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-purple-400" />
                Image Scale
              </label>
              <span className="text-sm font-bold text-[#00ffcc] bg-[#00ffcc]/10 px-2 py-0.5 rounded border border-[#00ffcc]/20">
                {scale}%
              </span>
            </div>
            <input
              type="range" min="10" max="100" step="5"
              value={scale}
              onChange={(e) => setScale(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00ffcc]"
            />
            <div className="flex justify-between text-xs text-purple-400 mt-1.5">
              <span>Smaller</span><span>Original</span>
            </div>
          </div>

          {/* Quality Slider (hidden for PNG) */}
          {format !== 'png' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-300">Compression Quality</label>
                <span className="text-sm font-bold text-[#f00b51] bg-[#f00b51]/20 px-2 py-0.5 rounded border border-[#f00b51]/30">
                  {quality}%
                </span>
              </div>
              <input
                type="range" min="10" max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#f00b51]"
              />
              <div className="flex justify-between text-xs text-purple-400 mt-1.5">
                <span>Smaller File</span><span>Better Quality</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="border-t border-white/10 mt-5 pt-4 space-y-3">
        {files.length > 0 && (
          <div className="bg-black/30 rounded-lg p-3 border border-white/5 text-center shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
            <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-bold">
              Total Est. Size
            </p>
            <p className="text-xl font-bold text-[#00ffcc]">{formatBytes(totalCompressedSize)}</p>
          </div>
        )}

        <button
          onClick={onProcessAll}
          disabled={files.length === 0 || isProcessingAll}
          className="w-full bg-[#f00b51] hover:bg-[#d00945] disabled:bg-gray-700 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(240,11,81,0.35)] border border-[#f00b51]/50 uppercase tracking-wider text-sm"
        >
          {isProcessingAll ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          <span>{isProcessingAll ? 'Processing...' : 'Finalize & Download'}</span>
        </button>

        <p className="text-[10px] text-center text-purple-300/50 leading-relaxed">
          {isProfileMode
            ? 'Auto-adjusts quality to hit the target file size range.'
            : 'Changes are estimated in real-time. Click Finalize to generate download links.'}
        </p>
      </div>
    </div>
  );
}
