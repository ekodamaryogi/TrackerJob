import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  FileText,
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
  Copy,
  Check,
  Building2,
  Calendar,
} from 'lucide-react';
import { ApplicationDocument, JobApplication } from '../../types';
import { formatDate } from '../../lib/notifications';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ApplicationDocument | null;
  application?: JobApplication | null;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document,
  application,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !document) return null;

  const isImage =
    document.mime_type?.startsWith('image/') ||
    document.name.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i);
  const isPdf =
    document.mime_type === 'application/pdf' || document.name.endsWith('.pdf');

  const handleDownload = () => {
    // If we have content_text or local blob/url, create download
    const blob = new Blob(
      [document.content_text || 'Sample document content for ' + document.name],
      { type: document.mime_type || 'application/octet-stream' }
    );
    const url = document.file_url.startsWith('blob:') || document.file_url.startsWith('http')
      ? document.file_url
      : URL.createObjectURL(blob);

    const a = window.document.createElement('a');
    a.href = url;
    a.download = document.name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    if (document.content_text) {
      navigator.clipboard.writeText(document.content_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div
        id="document-viewer-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-4xl h-[90vh] bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Viewer Toolbar */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold truncate text-white">{document.name}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{document.type}</span>
                  {application && (
                    <>
                      <span>•</span>
                      <span className="truncate">{application.company}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{formatDate(document.uploaded_at)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 15, 70))}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs px-2 font-mono text-slate-300">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 15, 160))}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {document.content_text && (
                <button
                  onClick={handleCopyText}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
                  title="Copy document text"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span className="hidden md:inline">{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
              )}

              <button
                id="btn-print-doc"
                onClick={handlePrint}
                className="hidden sm:flex p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="Print document"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                id="btn-download-document"
                onClick={handleDownload}
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                title="Download file"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>

              <button
                id="btn-close-doc-viewer"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                aria-label="Close viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Document Content Canvas */}
          <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-950/70 flex items-center justify-center">
            <div
              className="w-full max-w-3xl transition-transform duration-150 origin-top"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              {isImage && (
                <div className="flex justify-center">
                  <img
                    src={document.file_url}
                    alt={document.name}
                    className="max-h-[70vh] rounded-xl object-contain shadow-2xl border border-slate-700"
                  />
                </div>
              )}

              {/* PDF & Markdown preview container */}
              {(!isImage || document.content_text) && (
                <div className="bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-10 border border-slate-200 min-h-[500px]">
                  {/* Watermark / Header */}
                  <div className="flex items-center justify-between border-b pb-4 mb-6 border-slate-200">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-indigo-600" />
                      <div>
                        <span className="font-bold text-sm text-slate-800">
                          {application ? application.company : 'Job Application Document'}
                        </span>
                        {application && (
                          <p className="text-xs text-slate-500">{application.position}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                      {document.type}
                    </span>
                  </div>

                  {/* Document Body */}
                  {document.content_text ? (
                    <div className="text-sm leading-relaxed space-y-4 text-slate-800 whitespace-pre-wrap font-sans">
                      {document.content_text}
                    </div>
                  ) : (
                    <div className="text-center py-16 space-y-4">
                      <FileText className="w-16 h-16 text-indigo-400 mx-auto" />
                      <h4 className="text-lg font-bold text-slate-800">{document.name}</h4>
                      <p className="text-sm text-slate-500 max-w-md mx-auto">
                        PDF Document ready. You can download or view full file below.
                      </p>
                      <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 inline-flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Download {document.name}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
