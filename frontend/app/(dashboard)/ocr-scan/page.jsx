'use client';

import { useState, useRef } from 'react';
import { Upload, Camera, FileImage, Trash2, Check, X, Edit2, Scan, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function OCRScanPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [uploadedImageId, setUploadedImageId] = useState(null);
  const [rawText, setRawText] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [addingToInventory, setAddingToInventory] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const handleFileSelect = (file) => {
    // Validate file
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload only JPG or PNG images');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    // Auto-upload and extract
    uploadAndExtract(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const uploadAndExtract = async (file) => {
    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      // Step 1: Upload image
      const formData = new FormData();
      formData.append('image', file);
      formData.append('upload_type', 'receipt'); // Required field for validation

      const uploadResponse = await api.uploadImage(formData);

      // Handle wrapped response: { data: { id, ... }, message, ... }
      const imageId = uploadResponse.data?.id || uploadResponse.id;

      if (!imageId) {
        throw new Error('Failed to get image ID from upload response');
      }

      setUploadedImageId(imageId);
      setUploading(false);

      // Step 2: Extract items
      setExtracting(true);
      const extractResponse = await api.extractItemsFromImage(imageId);

      setRawText(extractResponse.extractedText || '');

      // Parse items and add selection/editing state
      const items = (extractResponse.parsedItems || []).map((item, index) => ({
        ...item,
        id: index,
        name: item.itemName || item.name, // Normalize field name
        selected: true,
        editing: false,
      }));

      setParsedItems(items);
      setExtracting(false);

    } catch (err) {
      console.error('Error uploading/extracting:', err);
      setError(err.message || 'Failed to process image. Please try again.');
      setUploading(false);
      setExtracting(false);
    }
  };

  const toggleItemSelection = (id) => {
    setParsedItems(prev => prev.map(item =>
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  const toggleItemEditing = (id) => {
    setParsedItems(prev => prev.map(item =>
      item.id === id ? { ...item, editing: !item.editing } : item
    ));
  };

  const updateItem = (id, field, value) => {
    setParsedItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addToInventory = async () => {
    const selectedItems = parsedItems.filter(item => item.selected);

    if (selectedItems.length === 0) {
      setError('Please select at least one item to add to inventory');
      return;
    }

    try {
      setAddingToInventory(true);
      setError(null);

      // Add each item to inventory
      const promises = selectedItems.map(item =>
        api.post('/inventory', {
          item_name: item.name || item.item_name,
          quantity: parseFloat(item.quantity) || 1,
          unit: item.unit || 'unit',
          category: item.category || 'other',
          purchase_date: new Date().toISOString().split('T')[0],
        })
      );

      await Promise.all(promises);

      setSuccess(`Successfully added ${selectedItems.length} item(s) to inventory!`);

      // Reset after 2 seconds
      setTimeout(() => {
        resetForm();
      }, 2000);

    } catch (err) {
      console.error('Error adding to inventory:', err);
      setError(err.response?.data?.message || 'Failed to add items to inventory. Please try again.');
    } finally {
      setAddingToInventory(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadedImageId(null);
    setRawText('');
    setParsedItems([]);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-lime-400 to-emerald-500 bg-clip-text text-transparent">
            OCR Scanner
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload receipt or inventory images to extract items automatically
          </p>
        </div>
        {(previewUrl || parsedItems.length > 0) && (
          <button
            onClick={resetForm}
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors border border-border"
          >
            <RefreshCw className="h-4 w-4" />
            Try Another Image
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <Check className="h-5 w-5 text-green-500" />
          <p className="text-green-500 text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {/* Upload Area */}
      {!previewUrl && (
        <div className="bg-card border rounded-lg p-8">
          <div
            ref={dropZoneRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-border hover:border-lime-500 rounded-lg p-12 text-center transition-colors cursor-pointer bg-muted/20"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-lime-500/20 to-emerald-500/20 rounded-full flex items-center justify-center">
                <Camera className="h-8 w-8 text-lime-500" />
              </div>
              <div>
                <p className="text-lg font-semibold mb-2">Drop your image here</p>
                <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                <p className="text-xs text-muted-foreground">
                  Supports: JPG, PNG • Max size: 5MB
                </p>
              </div>
              <button
                type="button"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-lime-500 to-emerald-500 text-white rounded-lg hover:from-lime-600 hover:to-emerald-600 transition-all shadow-lg shadow-lime-500/20"
              >
                <Upload className="h-4 w-4" />
                Choose File
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Processing States */}
      {uploading && (
        <div className="bg-card border rounded-lg p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="font-semibold mb-1">Uploading image...</p>
              <p className="text-sm text-muted-foreground">Please wait</p>
            </div>
          </div>
        </div>
      )}

      {extracting && (
        <div className="bg-card border rounded-lg p-8">
          <div className="flex flex-col items-center gap-4">
            <Scan className="h-12 w-12 text-lime-500 animate-pulse" />
            <div className="text-center">
              <p className="font-semibold mb-1">Extracting items from image...</p>
              <p className="text-sm text-muted-foreground">Using AI to detect items, quantities, and prices</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {previewUrl && !uploading && !extracting && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Image Preview */}
          <div className="lg:col-span-1">
            <div className="bg-card border rounded-lg p-4 sticky top-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileImage className="h-4 w-4 text-lime-500" />
                Uploaded Image
              </h3>
              <img
                src={previewUrl}
                alt="Uploaded"
                className="w-full rounded-lg border border-border"
              />
              {rawText && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Raw Extracted Text:</p>
                  <textarea
                    value={rawText}
                    readOnly
                    className="w-full h-32 px-3 py-2 bg-muted/50 border border-border rounded-lg text-xs resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Extracted Items */}
          <div className="lg:col-span-2">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Check className="h-4 w-4 text-lime-500" />
                  Extracted Items ({parsedItems.filter(i => i.selected).length}/{parsedItems.length} selected)
                </h3>
              </div>

              {parsedItems.length > 0 ? (
                <div className="space-y-6">
                  {/* Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-semibold text-sm w-12">
                            <input
                              type="checkbox"
                              checked={parsedItems.every(item => item.selected)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setParsedItems(prev => prev.map(item => ({ ...item, selected: checked })));
                              }}
                              className="w-4 h-4 rounded border-border text-lime-500 focus:ring-lime-500"
                            />
                          </th>
                          <th className="text-left py-3 px-2 font-semibold text-sm">Item Name</th>
                          <th className="text-left py-3 px-2 font-semibold text-sm">Quantity</th>
                          <th className="text-left py-3 px-2 font-semibold text-sm">Unit</th>
                          <th className="text-left py-3 px-2 font-semibold text-sm">Cost</th>
                          <th className="text-left py-3 px-2 font-semibold text-sm w-20">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedItems.map((item) => (
                          <tr key={item.id} className={`border-b hover:bg-muted/50 transition-colors ${!item.selected ? 'opacity-50' : ''}`}>
                            <td className="py-3 px-2">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => toggleItemSelection(item.id)}
                                className="w-4 h-4 rounded border-border text-lime-500 focus:ring-lime-500"
                              />
                            </td>
                            <td className="py-3 px-2">
                              {item.editing ? (
                                <input
                                  type="text"
                                  value={item.name || item.item_name}
                                  onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                  className="w-full px-2 py-1 bg-muted/50 border border-border rounded text-sm"
                                />
                              ) : (
                                <span className="font-medium">{item.name || item.item_name}</span>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              {item.editing ? (
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                  className="w-20 px-2 py-1 bg-muted/50 border border-border rounded text-sm"
                                  step="0.1"
                                />
                              ) : (
                                <span>{item.quantity}</span>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              {item.editing ? (
                                <input
                                  type="text"
                                  value={item.unit}
                                  onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                                  className="w-20 px-2 py-1 bg-muted/50 border border-border rounded text-sm"
                                />
                              ) : (
                                <span className="text-muted-foreground">{item.unit}</span>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              <span className="text-blue-500 font-medium">
                                {item.cost ? `$${parseFloat(item.cost).toFixed(2)}` : '-'}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <button
                                onClick={() => toggleItemEditing(item.id)}
                                className={`p-2 rounded hover:bg-muted transition-colors ${item.editing ? 'text-lime-500' : 'text-muted-foreground'
                                  }`}
                                title={item.editing ? 'Save' : 'Edit'}
                              >
                                {item.editing ? <Check className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={addToInventory}
                      disabled={addingToInventory || parsedItems.filter(i => i.selected).length === 0}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-lime-500 to-emerald-500 text-white rounded-lg hover:from-lime-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-lime-500/20"
                    >
                      {addingToInventory ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Add to Inventory ({parsedItems.filter(i => i.selected).length})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No items detected in the image</p>
                  <p className="text-sm text-muted-foreground mt-1">Try uploading a clearer image of a receipt or inventory list</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
