import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  UploadCloud, 
  Settings, 
  Trash2, 
  Download, 
  CheckCircle, 
  ArrowRight, 
  X,
  FileImage,
  RefreshCw,
  Maximize2
} from 'lucide-react';

// --- Helper Functions ---
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0 || !bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const calculateSavings = (original, compressed) => {
  if (!original || !compressed || original === 0) return 0;
  const savings = ((original - compressed) / original) * 100;
  return savings !== 0 ? savings.toFixed(1) : 0;
};

const generateId = () => Math.random().toString(36).substring(2, 9);

// --- Main Component ---
export default function App() {
  const [files, setFiles] = useState([]);
  const [quality, setQuality] = useState(80); 
  const [format, setFormat] = useState('jpeg'); 
  const [scale, setScale] = useState(100); 
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const fileInputRef = useRef(null);

  // Add Favicon on mount
  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f00b51" stroke="%23ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
  }, []);

  // --- Core Compression Logic ---
  const generateCompressedBlob = (originalFile, targetQuality, targetFormat, targetScale = 100) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(originalFile);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = Math.max(1, Math.floor(img.width * (targetScale / 100)));
          canvas.height = Math.max(1, Math.floor(img.height * (targetScale / 100)));

          // Handle transparency for JPEG
          if (targetFormat === 'jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const mimeType = `image/${targetFormat}`;
          const qualityFloat = targetQuality / 100;

          canvas.toBlob((blob) => resolve(blob), mimeType, qualityFloat);
        };
        img.onerror = () => resolve(null);
      };
      reader.onerror = () => resolve(null);
    });
  };

  // --- Handlers ---
  const handleFilesAdded = async (newFiles) => {
    const imageFiles = Array.from(newFiles).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const newFileObjects = imageFiles.map(file => ({
      id: generateId(),
      originalFile: file,
      name: file.name,
      originalSize: file.size,
      status: 'estimating', 
      estimatedSize: null,
      compressedBlob: null,
      compressedUrl: null,
      previewUrl: URL.createObjectURL(file),
      outputFormat: format,
      lastCalculatedQuality: quality,
      lastCalculatedScale: scale
    }));

    setFiles(prev => [...prev, ...newFileObjects]);

    for (const fileObj of newFileObjects) {
      const blob = await generateCompressedBlob(fileObj.originalFile, quality, format, scale);
      setFiles(prev => prev.map(f => {
        if (f.id === fileObj.id) {
          return {
            ...f,
            status: 'pending',
            estimatedSize: blob ? blob.size : null,
          };
        }
        return f;
      }));
    }
  };

  // Effect to recalculate sizes when quality, format, or scale changes
  useEffect(() => {
    const recalculateEstimates = async () => {
      const filesToUpdate = files.filter(f => 
        (f.status === 'pending' || f.status === 'estimating') && 
        (f.lastCalculatedQuality !== quality || f.outputFormat !== format || f.lastCalculatedScale !== scale)
      );

      if (filesToUpdate.length === 0) return;

      setFiles(prev => prev.map(f => 
        filesToUpdate.some(updateFile => updateFile.id === f.id) 
          ? { ...f, status: 'estimating' } 
          : f
      ));

      for (const fileObj of filesToUpdate) {
        const blob = await generateCompressedBlob(fileObj.originalFile, quality, format, scale);
        setFiles(prev => prev.map(f => {
          if (f.id === fileObj.id) {
            return {
              ...f,
              status: 'pending',
              estimatedSize: blob ? blob.size : null,
              outputFormat: format,
              lastCalculatedQuality: quality,
              lastCalculatedScale: scale,
              compressedBlob: null,
              compressedUrl: null
            };
          }
          return f;
        }));
      }
    };

    const timeoutId = setTimeout(() => {
      recalculateEstimates();
    }, 300); 

    return () => clearTimeout(timeoutId);
  }, [quality, format, scale, files]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  }, [quality, format, scale]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(e.target.files);
    }
    e.target.value = null;
  };

  const removeFile = (id) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        if (fileToRemove.previewUrl) URL.revokeObjectURL(fileToRemove.previewUrl);
        if (fileToRemove.compressedUrl) URL.revokeObjectURL(fileToRemove.compressedUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const clearAll = () => {
    files.forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      if (f.compressedUrl) URL.revokeObjectURL(f.compressedUrl);
    });
    setFiles([]);
  };

  const processAll = async () => {
    setIsProcessingAll(true);
    
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'error' && files[i].status !== 'processing') {
        setFiles(prev => prev.map((f, index) => index === i ? { ...f, status: 'processing' } : f));
        
        const blob = await generateCompressedBlob(files[i].originalFile, quality, format, scale);
        
        if (blob) {
          const compressedUrl = URL.createObjectURL(blob);
          setFiles(prev => prev.map((f, index) => index === i ? { 
            ...f, 
            status: 'done',
            compressedBlob: blob,
            compressedUrl: compressedUrl,
            compressedSize: blob.size,
            estimatedSize: blob.size,
            outputFormat: format
          } : f));
        } else {
          setFiles(prev => prev.map((f, index) => index === i ? { ...f, status: 'error' } : f));
        }
      }
    }
    setIsProcessingAll(false);
  };

  const downloadFile = (fileObj) => {
    if (!fileObj.compressedUrl) return; 
    
    const extension = fileObj.outputFormat === 'jpeg' ? 'jpg' : 'webp';
    const originalNameWithoutExt = fileObj.name.substring(0, fileObj.name.lastIndexOf('.')) || fileObj.name;
    const newFileName = `${originalNameWithoutExt}_compressed.${extension}`;

    const link = document.createElement('a');
    link.href = fileObj.compressedUrl;
    link.download = newFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalOriginalSize = files.reduce((acc, file) => acc + file.originalSize, 0);
  const totalCompressedSize = files.reduce((acc, file) => {
    const sizeToUse = file.compressedBlob ? file.compressedBlob.size : (file.estimatedSize || file.originalSize);
    return acc + sizeToUse;
  }, 0);
  const totalSaved = totalOriginalSize - totalCompressedSize;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#6a1b9a] via-[#280644] to-[#0d0114] text-gray-100 font-sans flex flex-col selection:bg-[#f00b51] selection:text-white">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div className="bg-[#f00b51] p-2 rounded-lg shadow-[0_0_15px_rgba(240,11,81,0.5)]">
            <FileImage className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide leading-tight">PY-<span className="text-[#f00b51]">IMAGE</span></h1>
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Sidebar: Settings */}
        <div className="lg:col-span-3 bg-black/40 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 p-5 sticky top-24">
          <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
            <Settings className="w-5 h-5 text-purple-300" />
            <h2 className="text-lg font-semibold text-white tracking-wide">SETTINGS</h2>
          </div>

          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Output Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFormat('jpeg')}
                  className={`py-2 px-3 text-sm font-bold tracking-wider rounded-lg border transition-all duration-300 ${
                    format === 'jpeg' 
                      ? 'bg-[#f00b51]/20 border-[#f00b51] text-[#f00b51] shadow-[0_0_15px_rgba(240,11,81,0.2)]' 
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  JPEG
                </button>
                <button
                  onClick={() => setFormat('webp')}
                  className={`py-2 px-3 text-sm font-bold tracking-wider rounded-lg border transition-all duration-300 ${
                    format === 'webp' 
                      ? 'bg-[#f00b51]/20 border-[#f00b51] text-[#f00b51] shadow-[0_0_15px_rgba(240,11,81,0.2)]' 
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  WEBP
                </button>
              </div>
            </div>

            {/* Scale Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300 flex items-center gap-1">
                  <Maximize2 className="w-4 h-4 text-purple-400" />
                  Image Scale (Dimensions)
                </label>
                <span className="text-sm font-bold text-[#00ffcc] bg-[#00ffcc]/10 px-2 py-0.5 rounded border border-[#00ffcc]/20">{scale}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                step="5"
                value={scale} 
                onChange={(e) => setScale(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00ffcc]"
              />
              <div className="flex justify-between text-xs text-purple-400 mt-2">
                <span>Smaller</span>
                <span>Original</span>
              </div>
            </div>

            {/* Quality Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">Compression Quality</label>
                <span className="text-sm font-bold text-[#f00b51] bg-[#f00b51]/20 px-2 py-0.5 rounded border border-[#f00b51]/30">{quality}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={quality} 
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#f00b51]"
              />
              <div className="flex justify-between text-xs text-purple-400 mt-2">
                <span>Smaller File</span>
                <span>Better Quality</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-white/10">
              {files.length > 0 && (
                <div className="mb-4 bg-black/30 rounded-lg p-3 border border-white/5 text-center shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
                  <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-bold">Total Est. Size</p>
                  <p className="text-xl font-bold text-[#00ffcc]">{formatBytes(totalCompressedSize)}</p>
                </div>
              )}
              <button
                onClick={processAll}
                disabled={files.length === 0 || isProcessingAll}
                className="w-full bg-[#f00b51] hover:bg-[#d00945] disabled:bg-gray-600 disabled:text-gray-400 disabled:shadow-none disabled:border-transparent disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(240,11,81,0.4)] border border-[#f00b51]/50 uppercase tracking-wider text-sm"
              >
                {isProcessingAll ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                <span>{isProcessingAll ? 'Processing...' : 'Finalize & Download'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Area: Dropzone & List */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Dropzone */}
          <div 
            className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-300 ease-in-out flex flex-col items-center justify-center min-h-[160px] backdrop-blur-md
              ${isDragging 
                ? 'border-[#f00b51] bg-[#f00b51]/10 shadow-[inset_0_0_50px_rgba(240,11,81,0.15)] scale-[1.02]' 
                : 'border-purple-400/30 bg-black/20 hover:border-[#f00b51]/50 hover:bg-black/40'
              }
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileInput} 
              multiple 
              accept="image/png, image/jpeg, image/webp" 
              className="hidden" 
            />
            
            <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-[#f00b51]/20 text-[#f00b51]' : 'bg-white/5 text-purple-300'}`}>
              <UploadCloud className="w-10 h-10" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 tracking-wide">
              DRAG & DROP YOUR IMAGES HERE
            </h3>
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

          {/* File List */}
          {files.length > 0 && (
            <div className="bg-black/40 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-white/10 bg-black/20">
                <h3 className="font-semibold text-white tracking-wide">PROCESSING QUEUE</h3>
                <button 
                  onClick={clearAll}
                  className="text-sm text-gray-400 hover:text-[#f00b51] font-medium flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Clear All
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-purple-200 text-xs uppercase tracking-widest border-b border-white/10">
                      <th className="p-4 font-medium w-12">Preview</th>
                      <th className="p-4 font-medium">File Name</th>
                      <th className="p-4 font-medium text-right">Original</th>
                      <th className="p-4 font-medium text-center">Status</th>
                      <th className="p-4 font-medium text-right">New Size</th>
                      <th className="p-4 font-medium text-right">Savings</th>
                      <th className="p-4 font-medium text-center w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {files.map(file => {
                      const displaySize = file.estimatedSize !== null ? file.estimatedSize : file.originalSize;
                      const savingsPct = calculateSavings(file.originalSize, displaySize);
                      const isEstimating = file.status === 'estimating';

                      return (
                      <tr key={file.id} className="hover:bg-white/5 transition-colors group">
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
                        <td className="p-4">
                          <div className="max-w-[150px] sm:max-w-[200px] truncate font-medium text-white text-sm" title={file.name}>
                            {file.name}
                          </div>
                          <div className="text-[10px] text-purple-400 font-bold uppercase mt-1 flex items-center gap-1 tracking-wider">
                            {file.originalFile.type.split('/')[1]} 
                            <ArrowRight className="w-3 h-3 text-purple-500/50" />
                            <span className={file.outputFormat === file.originalFile.type.split('/')[1] ? '' : 'text-[#f00b51]'}>
                              {file.outputFormat}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right text-sm text-gray-400 whitespace-nowrap">
                          {formatBytes(file.originalSize)}
                        </td>
                        <td className="p-4 text-center">
                          {file.status === 'estimating' && <span className="inline-flex items-center px-2.5 py-1 rounded border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 animate-pulse">Calculating</span>}
                          {file.status === 'pending' && <span className="inline-flex items-center px-2.5 py-1 rounded border border-white/10 text-[10px] font-bold uppercase tracking-wider bg-white/5 text-gray-300">Ready</span>}
                          {file.status === 'processing' && <span className="inline-flex items-center px-2.5 py-1 rounded border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 animate-pulse">Finalizing</span>}
                          {file.status === 'done' && <span className="inline-flex items-center px-2.5 py-1 rounded border border-[#00ffcc]/30 text-[10px] font-bold uppercase tracking-wider bg-[#00ffcc]/10 text-[#00ffcc]">Done</span>}
                          {file.status === 'error' && <span className="inline-flex items-center px-2.5 py-1 rounded border border-red-500/30 text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300">Error</span>}
                        </td>
                        <td className="p-4 text-right text-sm font-medium text-white whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                             {file.estimatedSize !== null ? formatBytes(file.estimatedSize) : '-'}
                          </div>
                        </td>
                        <td className="p-4 text-right text-sm whitespace-nowrap">
                           {file.estimatedSize !== null && file.status !== 'error' ? (
                            <span className={`font-bold ${savingsPct > 0 ? 'text-[#00ffcc]' : (savingsPct < 0 ? 'text-[#f00b51]' : 'text-gray-500')}`}>
                              {savingsPct > 0 ? '-' : (savingsPct < 0 ? '+' : '')}{Math.abs(savingsPct)}%
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {file.status === 'done' ? (
                              <button 
                                onClick={() => downloadFile(file)}
                                className="p-2 text-[#f00b51] hover:bg-[#f00b51]/20 rounded-lg transition-all"
                                title="Download"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                            ) : (
                              <div className="w-9 h-9" /> 
                            )}
                            <button 
                              onClick={() => removeFile(file.id)}
                              className="p-2 text-gray-500 hover:text-[#f00b51] hover:bg-[#f00b51]/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Remove"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
