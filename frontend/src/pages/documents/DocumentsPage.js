import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
  TableCellsIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  EyeIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const DocumentsPage = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [previewModal, setPreviewModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      const token = localStorage.getItem('afms_access_token');
      const response = await axios.get(`${BACKEND_URL}/api/documents/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Upload handler
  const onDrop = useCallback(async (acceptedFiles) => {
    setUploading(true);
    const uploadPromises = acceptedFiles.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const token = localStorage.getItem('afms_access_token');
        
        // Update progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        const response = await axios.post(
          `${BACKEND_URL}/api/documents/upload`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(prev => ({ ...prev, [file.name]: percentCompleted }));
            },
          }
        );

        toast.success(`${file.name} uploaded successfully!`);
        return response.data;
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        toast.error(`Failed to upload ${file.name}`);
        return null;
      } finally {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }
    });

    await Promise.all(uploadPromises);
    setUploading(false);
    fetchDocuments();
  }, [fetchDocuments]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: true,
  });

  // Delete document
  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      const token = localStorage.getItem('afms_access_token');
      await axios.delete(`${BACKEND_URL}/api/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  // Preview document
  const handlePreview = (doc) => {
    setSelectedDocument(doc);
    setPreviewModal(true);
  };

  // Download document
  const handleDownload = async (doc) => {
    try {
      const token = localStorage.getItem('afms_access_token');
      const response = await axios.get(
        `${BACKEND_URL}/api/uploads/${doc.filename}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.original_filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Document downloaded');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.document_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.document_type === filterType;
    return matchesSearch && matchesFilter;
  });

  // Get document icon
  const getDocumentIcon = (fileType) => {
    if (fileType.includes('pdf')) return DocumentTextIcon;
    if (fileType.includes('image')) return PhotoIcon;
    if (fileType.includes('csv') || fileType.includes('excel')) return TableCellsIcon;
    return DocumentIcon;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      uploaded: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: ClockIcon, text: 'Uploaded' },
      processing: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', icon: ClockIcon, text: 'Processing' },
      completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', icon: CheckCircleIcon, text: 'Processed' },
      failed: { color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', icon: ExclamationCircleIcon, text: 'Failed' },
    };
    
    const badge = badges[status] || badges.uploaded;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Document card component
  const DocumentCard = ({ doc }) => {
    const Icon = getDocumentIcon(doc.file_type);
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -5 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer"
        onClick={() => handlePreview(doc)}
        data-testid={`document-card-${doc.id}`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${
            doc.file_type.includes('pdf') ? 'bg-red-100 dark:bg-red-900/30' :
            doc.file_type.includes('image') ? 'bg-blue-100 dark:bg-blue-900/30' :
            'bg-green-100 dark:bg-green-900/30'
          }`}>
            <Icon className={`h-6 w-6 ${
              doc.file_type.includes('pdf') ? 'text-red-600 dark:text-red-400' :
              doc.file_type.includes('image') ? 'text-blue-600 dark:text-blue-400' :
              'text-green-600 dark:text-green-400'
            }`} />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(doc);
              }}
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              data-testid={`download-btn-${doc.id}`}
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(doc.id);
              }}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              data-testid={`delete-btn-${doc.id}`}
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 truncate" title={doc.original_filename}>
          {doc.original_filename}
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Type:</span>
            <span className="font-medium text-gray-900 dark:text-white capitalize">
              {doc.document_type.replace('_', ' ')}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Size:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatFileSize(doc.file_size)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Date:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Date(doc.upload_date).toLocaleDateString()}
            </span>
          </div>

          <div className="mt-3">
            {getStatusBadge(doc.processing_status)}
          </div>

          {doc.confidence_score && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Confidence</span>
                <span>{(doc.confidence_score * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{ width: `${doc.confidence_score * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="text-gray-600 dark:text-gray-400 font-medium">Loading documents...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Documents</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage and process your financial documents
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
        }`}
        data-testid="dropzone"
      >
        <input {...getInputProps()} />
        <CloudArrowUpIcon className={`h-16 w-16 mx-auto mb-4 ${
          isDragActive ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
        }`} />
        
        {isDragActive ? (
          <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
            Drop files here to upload
          </p>
        ) : (
          <>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Supports PDF, Images, CSV, Excel (Max 50MB per file)
            </p>
          </>
        )}

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mt-6 space-y-3">
            {Object.entries(uploadProgress).map(([filename, progress]) => (
              <div key={filename} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {filename}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="search-input"
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              data-testid="filter-select"
            >
              <option value="all">All Types</option>
              <option value="receipt">Receipts</option>
              <option value="invoice">Invoices</option>
              <option value="bank_statement">Bank Statements</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {viewMode === 'grid' ? 'List' : 'Grid'}
          </button>
        </div>
      </div>

      {/* Documents Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredDocuments.length} of {documents.length} documents
        </p>
      </div>

      {/* Documents Grid/List */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <DocumentIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No documents found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || filterType !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Upload your first document to get started'}
          </p>
        </div>
      ) : (
        <motion.div
          layout
          className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'}
        >
          <AnimatePresence>
            {filteredDocuments.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Preview Modal */}
      <DocumentPreviewModal
        document={selectedDocument}
        isOpen={previewModal}
        onClose={() => {
          setPreviewModal(false);
          setSelectedDocument(null);
        }}
      />
    </div>
  );
};

// Document Preview Modal Component
const DocumentPreviewModal = ({ document, isOpen, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [loadingCsv, setLoadingCsv] = useState(false);

  // Fetch CSV content when modal opens
  useEffect(() => {
    if (isOpen && document) {
      // Check if it's a CSV or text file by filename extension
      const fileExtension = document.original_filename?.toLowerCase().split('.').pop() || '';
      const isCsvOrText = ['csv', 'txt'].includes(fileExtension);
      
      if (isCsvOrText) {
        const fetchFileContent = async () => {
          setLoadingCsv(true);
          try {
            const fileUrl = `${BACKEND_URL}/api/uploads/${document.filename}`;
            const response = await fetch(fileUrl);
            if (response.ok) {
              const text = await response.text();
              setCsvContent(text);
            } else {
              setCsvContent('Unable to load file content');
            }
          } catch (error) {
            console.error('Error fetching file content:', error);
            setCsvContent('Error loading file content');
          } finally {
            setLoadingCsv(false);
          }
        };
        fetchFileContent();
      }
    }
  }, [isOpen, document]);

  if (!isOpen || !document) return null;

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setPdfError(false);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
    setPdfError(true);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const renderPreview = () => {
    const fileUrl = `${BACKEND_URL}/api/uploads/${document.filename}`;
    
    // Helper function to detect file type by extension
    const getFileExtension = (filename) => {
      return filename?.toLowerCase().split('.').pop() || '';
    };
    
    const fileExtension = getFileExtension(document.original_filename || document.filename);
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileExtension);
    const isPdf = fileExtension === 'pdf';
    const isCsvOrText = ['csv', 'txt'].includes(fileExtension);

    if (isImage) {
      return (
        <img
          src={fileUrl}
          alt={document.original_filename}
          className="max-w-full max-h-[600px] mx-auto rounded-lg"
          onError={(e) => {
            console.error('Image load error:', e);
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = '<p class="text-gray-600 dark:text-gray-400">Unable to load image</p>';
          }}
        />
      );
    } else if (isPdf) {
      if (pdfError) {
        return (
          <div className="text-center py-12">
            <DocumentIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Unable to load PDF preview
            </p>
            <a
              href={fileUrl}
              download={document.original_filename}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Download PDF
            </a>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center">
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="max-w-full"
                width={Math.min(800, window.innerWidth - 100)}
              />
            </Document>
          </div>

          {/* PDF Navigation Controls */}
          {numPages && numPages > 1 && (
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {pageNumber} of {numPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      );
    } else if (isCsvOrText) {
      if (loadingCsv) {
        return (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600 dark:text-gray-400">Loading file content...</p>
          </div>
        );
      }

      const displayContent = csvContent || document.ocr_text || 'Text preview not available';
      
      return (
        <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg max-h-[600px] overflow-auto">
          <pre className="text-sm text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap break-words">
            {displayContent}
          </pre>
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <DocumentIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Preview available for images, PDFs, and text files
        </p>
        <a
          href={fileUrl}
          download={document.original_filename}
          className="inline-flex items-center px-4 py-2 mt-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
          Download File
        </a>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {document.original_filename}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Uploaded on {new Date(document.upload_date).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {renderPreview()}

            {/* Extracted Data */}
            {document.extracted_data && Object.keys(document.extracted_data).length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Extracted Information
                </h3>
                <dl className="grid grid-cols-2 gap-3">
                  {Object.entries(document.extracted_data).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {key.replace('_', ' ')}:
                      </dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DocumentsPage;