import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Upload,
  Eye,
  Download,
  Trash2,
  Building2,
  Calendar,
  Filter,
  Plus,
} from 'lucide-react';
import { ApplicationDocument, JobApplication } from '../../types';
import { formatDate } from '../../lib/notifications';

interface DocumentsViewProps {
  documents: ApplicationDocument[];
  applications: JobApplication[];
  onViewDocument: (doc: ApplicationDocument) => void;
  onDeleteDocument: (id: string) => void;
  onUploadDocument: (appId: string, file: File, docType: string) => Promise<void>;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  applications,
  onViewDocument,
  onDeleteDocument,
  onUploadDocument,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedAppId, setSelectedAppId] = useState<string>(applications[0]?.id || '');
  const [uploadDocType, setUploadDocType] = useState('CV');
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (typeFilter !== 'ALL' && doc.type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const app = applications.find((a) => a.id === doc.application_id);
        const matchName = doc.name.toLowerCase().includes(q);
        const matchCompany = app?.company.toLowerCase().includes(q);
        const matchPos = app?.position.toLowerCase().includes(q);
        if (!matchName && !matchCompany && !matchPos) return false;
      }
      return true;
    });
  }, [documents, applications, typeFilter, search]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAppId) return;

    try {
      setIsUploading(true);
      await onUploadDocument(selectedAppId, file, uploadDocType);
      setShowUploadModal(false);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = (doc: ApplicationDocument) => {
    const blob = new Blob(
      [doc.content_text || 'Sample document content for ' + doc.name],
      { type: doc.mime_type || 'application/octet-stream' }
    );
    const url = doc.file_url.startsWith('blob:') || doc.file_url.startsWith('http')
      ? doc.file_url
      : URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const docTypes = ['ALL', 'CV', 'Cover Letter', 'Job Description', 'Certificate', 'Other'];

  return (
    <div id="documents-view" className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Document Vault & Vault Viewer
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage and preview your CVs, cover letters, and job specs
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-doc-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents or companies..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>

            <button
              id="btn-open-doc-upload"
              onClick={() => setShowUploadModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {docTypes.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                typeFilter === t
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t === 'ALL' ? 'All Documents' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No documents found
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload your resumes, tailored cover letters, or job descriptions to keep them
            organized per job application.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const app = applications.find((a) => a.id === doc.application_id);

            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-indigo-500/60 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                      {doc.type}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {doc.name}
                    </h4>
                    {app && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                        {app.company} — {app.position}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    {formatDate(doc.uploaded_at)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onViewDocument(doc)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-100 flex items-center gap-1"
                      title="View In-App"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Download Document"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteDocument(doc.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Upload Document
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Attach to Job Application
                </label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                >
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.company} — {app.position}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Document Type
                </label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                >
                  <option value="CV">CV / Resume</option>
                  <option value="Cover Letter">Cover Letter</option>
                  <option value="Job Description">Job Description</option>
                  <option value="Portfolio">Portfolio</option>
                  <option value="Certificate">Certificate / Offer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/20 transition-colors">
                  <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isUploading ? 'Uploading...' : 'Click to select file'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    PDF, DOC, DOCX, PNG, JPG (up to 10MB)
                  </span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.md"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
