import React, { useState, useRef, useEffect, useCallback } from 'react';
import JSZip from 'jszip';

import Header from './components/Header';
import SettingsPanel from './components/SettingsPanel';
import Dropzone from './components/Dropzone';
import FileTable from './components/FileTable';
import PreviewModal from './components/PreviewModal';

import { generateCompressedBlob, generateProfileBlob } from './utils/compression';
import { generateId, getFilenameWithoutExt } from './utils/helpers';
import { getProfileById } from './constants/profiles';

// ─────────────────────────────────────────────
// File object shape:
// {
//   id, originalFile, name, originalSize,
//   status: 'estimating'|'pending'|'processing'|'done'|'error',
//   estimatedSize: number|null,
//   compressedBlob: Blob|null,
//   compressedUrl: string|null,
//   previewUrl: string,
//   outputFormat: string,
//   lastCalculatedQuality: number,
//   lastCalculatedScale: number,
//   profileId: string|null,         // per-file DSSB profile (null = manual)
//   lastCalculatedProfile: string|null,
//   autoQuality: number|null,       // quality found by binary search (profile)
//   withinRange: boolean|null,      // result of profile size-range check
//   tooSmall: boolean,
//   tooLarge: boolean,
// }
// ─────────────────────────────────────────────

export default function App() {
  const [files, setFiles] = useState([]);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState('jpeg');
  const [scale, setScale] = useState(100);
  const [activeProfile, setActiveProfile] = useState(null); // profile id | null
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const fileInputRef = useRef(null);

  // ── Set favicon ──────────────────────────────
  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f00b51" stroke="%23ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
  }, []);

  // ── Compute a blob for one file object ──────
  const computeBlob = useCallback(
    async (fileObj, profileId, q, f, s) => {
      const profile = profileId ? getProfileById(profileId) : null;
      if (profile) {
        const result = await generateProfileBlob(fileObj.originalFile, profile);
        return { isProfile: true, result, profileId };
      }
      const blob = await generateCompressedBlob(fileObj.originalFile, q, f, s);
      return { isProfile: false, blob, q, f, s };
    },
    []
  );

  // ── Apply blob result back to a file in state ─
  const applyBlobResult = useCallback((fileId, computed) => {
    setFiles((prev) =>
      prev.map((file) => {
        if (file.id !== fileId) return file;

        if (computed.isProfile) {
          const r = computed.result;
          const profile = getProfileById(computed.profileId);
          if (!r) return { ...file, status: 'error' };
          return {
            ...file,
            status: 'pending',
            estimatedSize: r.blob.size,
            outputFormat: profile?.format ?? 'jpeg',
            lastCalculatedProfile: computed.profileId,
            autoQuality: r.quality,
            withinRange: r.withinRange,
            tooSmall: r.tooSmall ?? false,
            tooLarge: r.tooLarge ?? false,
            compressedBlob: null,
            compressedUrl: null,
          };
        }

        // Manual mode
        return {
          ...file,
          status: computed.blob ? 'pending' : 'error',
          estimatedSize: computed.blob ? computed.blob.size : null,
          outputFormat: computed.f,
          lastCalculatedQuality: computed.q,
          lastCalculatedScale: computed.s,
          lastCalculatedProfile: null,
          autoQuality: null,
          withinRange: null,
          tooSmall: false,
          tooLarge: false,
          compressedBlob: null,
          compressedUrl: null,
        };
      })
    );
  }, []);

  // ── Add new files ────────────────────────────
  const handleFilesAdded = async (newRawFiles) => {
    const imageFiles = Array.from(newRawFiles).filter((f) =>
      f.type.startsWith('image/')
    );
    if (!imageFiles.length) return;

    const profile = activeProfile ? getProfileById(activeProfile) : null;

    const newFileObjects = imageFiles.map((file) => ({
      id: generateId(),
      originalFile: file,
      name: file.name,
      originalSize: file.size,
      status: 'estimating',
      estimatedSize: null,
      compressedBlob: null,
      compressedUrl: null,
      previewUrl: URL.createObjectURL(file),
      outputFormat: profile ? profile.format : format,
      lastCalculatedQuality: quality,
      lastCalculatedScale: scale,
      profileId: activeProfile,
      lastCalculatedProfile: activeProfile,
      autoQuality: null,
      withinRange: null,
      tooSmall: false,
      tooLarge: false,
    }));

    setFiles((prev) => [...prev, ...newFileObjects]);

    // Immediately estimate sizes for newly added files
    for (const fileObj of newFileObjects) {
      const computed = await computeBlob(fileObj, fileObj.profileId, quality, format, scale);
      applyBlobResult(fileObj.id, computed);
    }
  };

  // ── Change a single file's profile ───────────
  const updateFileProfile = (fileId, newProfileId) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        // Reset to re-estimate with the new profile
        const profile = newProfileId ? getProfileById(newProfileId) : null;
        return {
          ...f,
          profileId: newProfileId,
          outputFormat: profile ? profile.format : format,
          status: 'estimating',
          compressedBlob: null,
          compressedUrl: null,
        };
      })
    );
  };

  // ── Re-estimate when settings or per-file profile change ─
  useEffect(() => {
    const recalculate = async () => {
      const filesToUpdate = files.filter((f) => {
        if (f.status !== 'pending' && f.status !== 'estimating') return false;
        // If the file has a profile, re-estimate only when its profile changed
        if (f.profileId) return f.lastCalculatedProfile !== f.profileId;
        // Manual mode: re-estimate when quality/format/scale changed
        return (
          f.lastCalculatedQuality !== quality ||
          f.outputFormat !== format ||
          f.lastCalculatedScale !== scale ||
          f.lastCalculatedProfile !== null
        );
      });

      if (!filesToUpdate.length) return;

      // Mark them as "estimating" first
      setFiles((prev) =>
        prev.map((f) =>
          filesToUpdate.some((u) => u.id === f.id) ? { ...f, status: 'estimating' } : f
        )
      );

      for (const fileObj of filesToUpdate) {
        const computed = await computeBlob(fileObj, fileObj.profileId, quality, format, scale);
        applyBlobResult(fileObj.id, computed);
      }
    };

    const t = setTimeout(recalculate, 350); // debounce slider dragging
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, format, scale, files]);

  // ── Finalize all files and auto-download ─────
  const processAll = async () => {
    setIsProcessingAll(true);
    const snapshot = [...files];
    const newlyDone = [];

    for (const file of snapshot) {
      // Skip only files actively processing or errored.
      // Include 'estimating' so clicking before estimation finishes still works.
      if (file.status === 'error' || file.status === 'processing') continue;

      // Mark as processing
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: 'processing' } : f))
      );

      const fileProfile = file.profileId ? getProfileById(file.profileId) : null;
      let update = null;

      if (fileProfile) {
        const r = await generateProfileBlob(file.originalFile, fileProfile);
        if (r) {
          const url = URL.createObjectURL(r.blob);
          update = {
            compressedBlob: r.blob,
            estimatedSize: r.blob.size,
            compressedUrl: url,
            autoQuality: r.quality,
            withinRange: r.withinRange,
            tooSmall: r.tooSmall ?? false,
            tooLarge: r.tooLarge ?? false,
            status: 'done',
          };
        }
      } else {
        const blob = await generateCompressedBlob(file.originalFile, quality, format, scale);
        if (blob) {
          const url = URL.createObjectURL(blob);
          update = { compressedBlob: blob, estimatedSize: blob.size, compressedUrl: url, status: 'done' };
        }
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? (update ? { ...f, ...update } : { ...f, status: 'error' }) : f
        )
      );

      // Keep the preview modal in sync if it's showing this file
      if (update) {
        setPreviewFile((prev) =>
          prev?.id === file.id ? { ...prev, ...update } : prev
        );
        newlyDone.push({ ...file, ...update });
      }
    }

    setIsProcessingAll(false);

    // ── Auto-download after finalization ─────────
    if (newlyDone.length === 1) {
      // Single file → direct download
      const f = newlyDone[0];
      const ext = f.outputFormat === 'jpeg' ? 'jpg' : f.outputFormat;
      const a = document.createElement('a');
      a.href = f.compressedUrl;
      a.download = `${getFilenameWithoutExt(f.name)}_compressed.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (newlyDone.length > 1) {
      // Multiple files → ZIP download
      const zip = new JSZip();
      newlyDone.forEach((f) => {
        const ext = f.outputFormat === 'jpeg' ? 'jpg' : f.outputFormat;
        zip.file(`${getFilenameWithoutExt(f.name)}_compressed.${ext}`, f.compressedBlob);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'py-image-compressed.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // ── Download one file ────────────────────────
  const downloadFile = (fileObj) => {
    if (!fileObj.compressedBlob) return;
    const ext = fileObj.outputFormat === 'jpeg' ? 'jpg' : fileObj.outputFormat;
    const a = document.createElement('a');
    a.href = fileObj.compressedUrl;
    a.download = `${getFilenameWithoutExt(fileObj.name)}_compressed.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ── Download all finalized files as a ZIP ───
  const downloadAllAsZip = async () => {
    const doneFiles = files.filter((f) => f.status === 'done' && f.compressedBlob);
    if (!doneFiles.length) return;

    const zip = new JSZip();
    doneFiles.forEach((file) => {
      const ext = file.outputFormat === 'jpeg' ? 'jpg' : file.outputFormat;
      const name = `${getFilenameWithoutExt(file.name)}_compressed.${ext}`;
      zip.file(name, file.compressedBlob);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'py-image-compressed.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Remove / clear files ─────────────────────
  const removeFile = (id) => {
    setFiles((prev) => {
      const f = prev.find((f) => f.id === id);
      if (f?.previewUrl) URL.revokeObjectURL(f.previewUrl);
      if (f?.compressedUrl) URL.revokeObjectURL(f.compressedUrl);
      return prev.filter((f) => f.id !== id);
    });
    setPreviewFile((prev) => (prev?.id === id ? null : prev));
  };

  const clearAll = () => {
    files.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      if (f.compressedUrl) URL.revokeObjectURL(f.compressedUrl);
    });
    setFiles([]);
    setPreviewFile(null);
  };

  // ── Drag handlers ────────────────────────────
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) handleFilesAdded(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileInput = (e) => {
    if (e.target.files?.length > 0) handleFilesAdded(e.target.files);
    e.target.value = null;
  };

  // ── Global stats ─────────────────────────────
  const totalOriginalSize = files.reduce((acc, f) => acc + f.originalSize, 0);
  const totalCompressedSize = files.reduce((acc, f) => {
    const s = f.compressedBlob ? f.compressedBlob.size : (f.estimatedSize ?? f.originalSize);
    return acc + s;
  }, 0);
  const totalSaved = totalOriginalSize - totalCompressedSize;
  const doneCount = files.filter((f) => f.status === 'done').length;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#6a1b9a] via-[#280644] to-[#0d0114] text-gray-100 font-sans flex flex-col selection:bg-[#f00b51] selection:text-white">
      <Header files={files} totalSaved={totalSaved} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left sidebar */}
        <div className="lg:col-span-3">
          <SettingsPanel
            quality={quality}        setQuality={setQuality}
            format={format}          setFormat={setFormat}
            scale={scale}            setScale={setScale}
            activeProfile={activeProfile} setActiveProfile={setActiveProfile}
            files={files}
            totalCompressedSize={totalCompressedSize}
            isProcessingAll={isProcessingAll}
            onProcessAll={processAll}
          />
        </div>

        {/* Right content area */}
        <div className="lg:col-span-9 space-y-6">
          <Dropzone
            isDragging={isDragging}
            fileInputRef={fileInputRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onFileInput={handleFileInput}
          />

          {files.length > 0 && (
            <FileTable
              files={files}
              doneCount={doneCount}
              onRemove={removeFile}
              onClearAll={clearAll}
              onDownload={downloadFile}
              onDownloadAllZip={downloadAllAsZip}
              onPreview={setPreviewFile}
              onProfileChange={updateFileProfile}
            />
          )}
        </div>
      </main>

      {/* Before/after preview modal */}
      {previewFile && (
        <PreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          globalQuality={quality}
          globalFormat={format}
          globalScale={scale}
        />
      )}
    </div>
  );
}
