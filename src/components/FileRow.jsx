import React from 'react';
import { ArrowRight, Download, X, RefreshCw, Eye } from 'lucide-react';
import { formatBytes, calculateSavings } from '../utils/helpers';
import { DSSB_PROFILES, getProfileById } from '../constants/profiles';

export default function FileRow({ file, onRemove, onDownload, onPreview, onProfileChange }) {
  const profile = file.profileId ? getProfileById(file.profileId) : null;

  const displaySize = file.estimatedSize !== null ? file.estimatedSize : file.originalSize;
  const savingsPct = calculateSavings(file.originalSize, displaySize);
  const isEstimating = file.status === 'estimating';

  // Profile size-range status badge
  const getRangeStatus = () => {
    if (!profile || file.estimatedSize === null || isEstimating) return null;
    if (file.withinRange)  return { label: '✓ In Range', color: '#00ffcc', bg: 'rgba(0,255,204,0.1)', border: 'rgba(0,255,204,0.3)' };
    if (file.tooSmall)     return { label: '↑ Too Small', color: '#facc15', bg: 'rgba(250,204,21,0.1)', border: 'rgba(250,204,21,0.3)' };
    if (file.tooLarge)     return { label: '↓ Too Large', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' };
    return null;
  };

  const rangeStatus = getRangeStatus();

  const StatusBadge = () => {
    const base = 'inline-flex items-center px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider';
    switch (file.status) {
      case 'estimating': return <span className={`${base} animate-pulse border-purple-500/30 bg-purple-500/20 text-purple-300`}>Calculating</span>;
      case 'pending':    return <span className={`${base} border-white/10 bg-white/5 text-gray-300`}>Ready</span>;
      case 'processing': return <span className={`${base} animate-pulse border-blue-500/30 bg-blue-500/20 text-blue-300`}>Finalizing</span>;
      case 'done':       return <span className={`${base} border-[#00ffcc]/30 bg-[#00ffcc]/10 text-[#00ffcc]`}>Done</span>;
      case 'error':      return <span className={`${base} border-red-500/30 bg-red-500/20 text-red-300`}>Error</span>;
      default: return null;
    }
  };

  const originalFormat = file.originalFile.type.split('/')[1];

  return (
    <tr className="hover:bg-white/5 transition-colors group">
      {/* Thumbnail */}
      <td className="p-4">
        <div className="w-12 h-12 rounded-lg bg-black/50 border border-white/10 overflow-hidden flex-shrink-0 relative">
          <img
            src={file.previewUrl}
            alt="preview"
            className={`w-full h-full object-cover transition-opacity ${isEstimating ? 'opacity-30' : 'opacity-100'}`}
          />
          {isEstimating && (
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-[#f00b51] animate-spin" />
            </div>
          )}
        </div>
      </td>

      {/* File name + format */}
      <td className="p-4">
        <div className="max-w-[140px] sm:max-w-[200px] truncate font-medium text-white text-sm" title={file.name}>
          {file.name}
        </div>
        <div className="text-[10px] text-purple-400 font-bold uppercase mt-1 flex items-center gap-1 tracking-wider flex-wrap">
          <span>{originalFormat}</span>
          <ArrowRight className="w-3 h-3 text-purple-500/50" />
          <span className={file.outputFormat !== originalFormat ? 'text-[#f00b51]' : ''}>
            {file.outputFormat}
          </span>
        </div>
        {profile && file.autoQuality !== null && !isEstimating && (
          <div className="text-[9px] text-gray-500 mt-0.5">
            Auto quality: {file.autoQuality}%
          </div>
        )}
      </td>

      {/* Per-file Profile selector */}
      <td className="p-3 text-center">
        <select
          value={file.profileId ?? ''}
          onChange={(e) => onProfileChange(file.id, e.target.value || null)}
          disabled={file.status === 'processing'}
          className="bg-white/5 border border-white/10 text-[11px] text-gray-200 font-semibold
                     rounded-lg px-2 py-1.5 cursor-pointer w-full max-w-[110px]
                     hover:border-white/25 focus:border-[#f00b51]/50 focus:ring-1 focus:ring-[#f00b51]/30
                     transition-all duration-200 outline-none appearance-none
                     disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239ca3af' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 6px center',
            paddingRight: '22px',
          }}
        >
          <option value="" className="bg-[#1a0a2e] text-gray-300">Manual</option>
          {DSSB_PROFILES.map((p) => (
            <option key={p.id} value={p.id} className="bg-[#1a0a2e] text-gray-200">
              {p.shortName}
            </option>
          ))}
        </select>

        {/* Mini info underneath */}
        {profile && (
          <div className="text-[9px] text-gray-500 mt-1 leading-tight">
            {profile.dimensionLabel}
            <br />
            {profile.targetSizeLabel}
          </div>
        )}
      </td>

      {/* Original size */}
      <td className="p-4 text-right text-sm text-gray-400 whitespace-nowrap">
        {formatBytes(file.originalSize)}
      </td>

      {/* Status */}
      <td className="p-4 text-center">
        <StatusBadge />
      </td>

      {/* New size + range badge */}
      <td className="p-4 text-right text-sm font-medium whitespace-nowrap">
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-white">
            {file.estimatedSize !== null ? formatBytes(file.estimatedSize) : '-'}
          </span>
          {rangeStatus && (
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded border"
              style={{ color: rangeStatus.color, background: rangeStatus.bg, borderColor: rangeStatus.border }}
            >
              {rangeStatus.label}
            </span>
          )}
        </div>
      </td>

      {/* Savings % */}
      <td className="p-4 text-right text-sm whitespace-nowrap">
        {file.estimatedSize !== null && file.status !== 'error' ? (
          <span className={`font-bold ${savingsPct > 0 ? 'text-[#00ffcc]' : savingsPct < 0 ? 'text-[#f00b51]' : 'text-gray-500'}`}>
            {savingsPct > 0 ? '-' : savingsPct < 0 ? '+' : ''}{Math.abs(savingsPct)}%
          </span>
        ) : (
          <span className="text-gray-600">-</span>
        )}
      </td>

      {/* Actions */}
      <td className="p-4 text-center">
        <div className="flex items-center justify-center gap-1">
          {/* Preview / compare */}
          <button
            onClick={() => onPreview(file)}
            className="p-2 text-purple-400 hover:text-white hover:bg-purple-500/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            title="Preview / Compare"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Download (only when done) */}
          {file.status === 'done' ? (
            <button
              onClick={() => onDownload(file)}
              className="p-2 text-[#f00b51] hover:bg-[#f00b51]/20 rounded-lg transition-all"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9 h-9" />
          )}

          {/* Remove */}
          <button
            onClick={() => onRemove(file.id)}
            className="p-2 text-gray-500 hover:text-[#f00b51] hover:bg-[#f00b51]/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            title="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
