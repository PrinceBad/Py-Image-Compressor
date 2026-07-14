import React from 'react';
import { Trash2, Archive } from 'lucide-react';
import FileRow from './FileRow';

export default function FileTable({
  files,
  doneCount,
  onRemove,
  onClearAll,
  onDownload,
  onDownloadAllZip,
  onPreview,
  onProfileChange,
}) {
  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden">
      {/* Table header bar */}
      <div className="flex items-center justify-between p-5 border-b border-white/10 bg-black/20 flex-wrap gap-3">
        <h3 className="font-semibold text-white tracking-wide">PROCESSING QUEUE</h3>
        <div className="flex items-center gap-3">
          {/* Download all as ZIP (visible when ≥2 files are done) */}
          {doneCount >= 2 && (
            <button
              onClick={onDownloadAllZip}
              className="text-sm text-[#00ffcc] hover:text-white bg-[#00ffcc]/10 hover:bg-[#00ffcc]/20 border border-[#00ffcc]/20 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200"
            >
              <Archive className="w-4 h-4" />
              Download All ZIP
            </button>
          )}
          <button
            onClick={onClearAll}
            className="text-sm text-gray-400 hover:text-[#f00b51] font-medium flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 text-purple-200 text-xs uppercase tracking-widest border-b border-white/10">
              <th className="p-4 font-medium w-14">Preview</th>
              <th className="p-4 font-medium">File Name</th>
              <th className="p-4 font-medium text-center">Profile</th>
              <th className="p-4 font-medium text-right whitespace-nowrap">Original</th>
              <th className="p-4 font-medium text-center">Status</th>
              <th className="p-4 font-medium text-right whitespace-nowrap">New Size</th>
              <th className="p-4 font-medium text-right whitespace-nowrap">Savings</th>
              <th className="p-4 font-medium text-center w-36">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {files.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                onRemove={onRemove}
                onDownload={onDownload}
                onPreview={onPreview}
                onProfileChange={onProfileChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
