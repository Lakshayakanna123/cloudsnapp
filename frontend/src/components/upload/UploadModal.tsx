import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, File, CheckCircle2, AlertCircle, Loader2, ImageIcon, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { photosService } from '../../services/photosService';
import { UploadFile } from '../../types';
import { formatBytes } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

interface UploadModalProps {
  onClose: () => void;
}

export default function UploadModal({ onClose }: UploadModalProps) {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((accepted: File[], rejected: { file: File; errors: { code: string; message: string }[] }[]) => {
    rejected.forEach(({ file, errors }) => {
      const msg = errors[0]?.code === 'file-too-large'
        ? `${file.name} is too large (max 50 MB)`
        : `${file.name}: ${errors[0]?.message}`;
      toast.error(msg);
    });

    const newFiles: UploadFile[] = accepted.map((file) => ({
      id: uuidv4(),
      file,
      status: 'pending',
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: MAX_SIZE,
    multiple: true,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    for (const uploadFile of pendingFiles) {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) => f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f)
      );

      try {
        // 1. Request pre-signed URL
        const { uploadUrl, photoId } = await photosService.getUploadUrl({
          filename: uploadFile.file.name,
          contentType: uploadFile.file.type,
          fileSize: uploadFile.file.size,
        });

        // 2. Upload directly to S3
        await photosService.uploadToS3(uploadUrl, uploadFile.file, (progress) => {
          setFiles((prev) =>
            prev.map((f) => f.id === uploadFile.id ? { ...f, progress } : f)
          );
        });

        setFiles((prev) =>
          prev.map((f) => f.id === uploadFile.id ? { ...f, progress: 100, status: 'processing' } : f)
        );

        // 3. Confirm upload
        await photosService.confirmUpload(photoId);

        setFiles((prev) =>
          prev.map((f) => f.id === uploadFile.id ? { ...f, status: 'done', photoId } : f)
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setFiles((prev) =>
          prev.map((f) => f.id === uploadFile.id ? { ...f, status: 'error', error: msg } : f)
        );
      }
    }

    setIsUploading(false);

    // Invalidate photo list so gallery refreshes
    await queryClient.invalidateQueries({ queryKey: ['photos'] });

    const done = files.filter((f) => f.status === 'done').length;
    if (done > 0) {
      toast.success(`${done} photo${done > 1 ? 's' : ''} uploaded! Processing thumbnails…`);
    }
  };

  const hasPending = files.some((f) => f.status === 'pending');
  const allDone = files.length > 0 && files.every((f) => f.status === 'done' || f.status === 'error');

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-700/50">
          <div>
            <h2 className="section-title">Upload Photos</h2>
            <p className="section-sub mt-0.5">Drag and drop or select files to upload</p>
          </div>
          <button onClick={onClose} className="btn-icon" disabled={isUploading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-surface-700 hover:border-primary-500/50 hover:bg-surface-800/30'
            }`}
          >
            <input {...getInputProps()} id="upload-file-input" />
            <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
              <Upload className={`w-7 h-7 ${isDragActive ? 'text-primary-400 animate-bounce' : 'text-primary-500'}`} />
            </div>
            <p className="text-surface-200 font-medium mb-1">
              {isDragActive ? 'Drop your photos here' : 'Drag photos here, or click to select'}
            </p>
            <p className="text-surface-500 text-sm">JPEG, PNG, WebP · Max 50 MB per file</p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 border border-surface-700/40">
                  <div className="w-9 h-9 rounded-lg bg-surface-700 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-4 h-4 text-surface-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-200 truncate">{f.file.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-surface-500">{formatBytes(f.file.size)}</span>
                      {f.status === 'uploading' && (
                        <div className="flex-1 h-1 bg-surface-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full transition-all"
                            style={{ width: `${f.progress}%` }}
                          />
                        </div>
                      )}
                      {f.status === 'processing' && (
                        <span className="text-xs text-warning-400 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Processing…
                        </span>
                      )}
                      {f.status === 'done' && (
                        <span className="text-xs text-success-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </span>
                      )}
                      {f.status === 'error' && (
                        <span className="text-xs text-danger-400 flex items-center gap-1 truncate">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {f.error}
                        </span>
                      )}
                    </div>
                  </div>
                  {f.status === 'pending' && (
                    <button onClick={() => removeFile(f.id)} className="btn-icon flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {(f.status === 'done' || f.status === 'error') && (
                    <div className="flex-shrink-0">
                      {f.status === 'done'
                        ? <CheckCircle2 className="w-5 h-5 text-success-400" />
                        : <AlertCircle className="w-5 h-5 text-danger-400" />}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6 gap-3">
          <p className="text-xs text-surface-500">
            {files.length} file{files.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={isUploading} className="btn-secondary">
              {allDone ? 'Close' : 'Cancel'}
            </button>
            {!allDone && (
              <button
                onClick={uploadAll}
                disabled={!hasPending || isUploading}
                id="upload-start-btn"
                className="btn-primary"
              >
                {isUploading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                  : <><Upload className="w-4 h-4" /> Upload {files.filter(f => f.status === 'pending').length || ''} Photos</>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
