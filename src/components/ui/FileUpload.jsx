import React, { useRef, useState } from 'react';
import './FileUpload.css';

const FileUpload = ({ 
  accept, 
  maxFiles, 
  multiple = false, 
  onFilesChange, 
  initialFiles = [],
  isUploading = false,
  uploadProgress = 0
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState(initialFiles);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFiles = (newFiles) => {
    let filesArr = Array.from(newFiles);
    if (!multiple) {
      filesArr = [filesArr[0]];
    }
    const updatedFiles = multiple ? [...files, ...filesArr] : filesArr;
    setFiles(updatedFiles);
    if (onFilesChange) onFilesChange(updatedFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (idx) => {
    if (isUploading) return;
    const updated = [...files];
    updated.splice(idx, 1);
    setFiles(updated);
    if (onFilesChange) onFilesChange(updated);
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fileupload-container">
      <div 
        className={`fileupload-dropzone ${dragActive ? 'active' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current.click()}
      >
        <input 
          ref={inputRef}
          type="file" 
          multiple={multiple} 
          accept={accept}
          onChange={handleChange}
          style={{ display: 'none' }}
          disabled={isUploading}
        />
        <div className="fileupload-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p className="fileupload-text">Arraste e solte arquivos aqui, ou clique para buscar</p>
      </div>

      {isUploading && (
        <div className="upload-progress-wrapper">
          <div className="upload-progress-info">
            <span>Enviando arquivos...</span>
            <span>{uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : 'Iniciando...'}</span>
          </div>
          <div className="upload-progress-track">
            <div 
              className="upload-progress-bar"
              style={{ width: `${uploadProgress > 0 ? uploadProgress : 100}%` }}
            />
          </div>
        </div>
      )}

      {files.length > 0 && (
        <ul className="fileupload-list">
          {files.map((file, idx) => (
            <li key={idx} className="fileupload-item">
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatSize(file.size)}</span>
              </div>
              {!isUploading && (
                <button className="file-remove" onClick={() => removeFile(idx)}>&times;</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileUpload;
