import React from 'react';
import { DocumentTextIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';

const DocumentsPage = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
            <p className="mt-2 text-gray-600">
              Upload and manage your financial documents
            </p>
          </div>
          <button className="btn-primary">
            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div className="card">
        <div className="card-body">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No documents</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by uploading your first document
            </p>
            <div className="mt-6">
              <button className="btn-primary">
                <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                Upload Document
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Document List - Placeholder */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
        </div>
        <div className="card-body">
          <div className="text-center py-12 text-gray-500">
            Document management interface coming soon...
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;