'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { parsePaginatedResponse } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Image as ImageIcon, X, Check, ChevronLeft, ChevronRight, FileImage, Calendar } from 'lucide-react';

const UPLOAD_TYPES = [
    { value: 'receipt', label: 'Receipt', color: 'teal' },
    { value: 'food_label', label: 'Food Label', color: 'purple' },
    { value: 'other', label: 'Other', color: 'gray' },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];

export default function UploadsPage() {
    const { token } = useAuth();
    const fileInputRef = useRef(null);

    // State
    const [images, setImages] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // Form state
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploadType, setUploadType] = useState('receipt');
    const [relatedInventoryId, setRelatedInventoryId] = useState('');
    const [relatedLogId, setRelatedLogId] = useState('');

    // Inventory and logs for dropdowns
    const [inventoryItems, setInventoryItems] = useState([]);
    const [consumptionLogs, setConsumptionLogs] = useState([]);

    // Messages
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Fetch uploaded images
    const fetchImages = async (page = 1) => {
        try {
            const response = await api.getImages({ page });
            const parsed = parsePaginatedResponse(response);
            setImages(parsed.data);
            setPagination(parsed.pagination);
        } catch (error) {
            console.error('Error fetching images:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch inventory items for dropdown
    const fetchInventoryItems = async () => {
        try {
            const response = await api.getInventory({ page: 1 });
            const parsed = parsePaginatedResponse(response);
            setInventoryItems(parsed.data || []);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        }
    };

    // Fetch consumption logs for dropdown
    const fetchConsumptionLogs = async () => {
        try {
            const response = await api.getConsumptionLogs({ page: 1 });
            const parsed = parsePaginatedResponse(response);
            setConsumptionLogs(parsed.data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    };

    useEffect(() => {
        if (token) {
            fetchImages();
            fetchInventoryItems();
            fetchConsumptionLogs();
        }
    }, [token]);

    // File validation
    const validateFile = (file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Invalid file type. Please upload JPEG, PNG, JPG, or GIF images.');
            return false;
        }
        if (file.size > MAX_FILE_SIZE) {
            setError('File size exceeds 5MB limit. Please select a smaller file.');
            return false;
        }
        setError('');
        return true;
    };

    // Handle file selection
    const handleFileSelect = (file) => {
        if (validateFile(file)) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    // Handle drag events
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    // Handle upload
    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file to upload.');
            return;
        }

        setUploading(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('image', selectedFile);
            formData.append('upload_type', uploadType);

            if (relatedInventoryId) {
                formData.append('related_inventory_id', relatedInventoryId);
            }
            if (relatedLogId) {
                formData.append('related_log_id', relatedLogId);
            }

            await api.uploadImage(formData);

            setSuccess('Image uploaded successfully!');

            // Reset form
            setSelectedFile(null);
            setPreviewUrl(null);
            setUploadType('receipt');
            setRelatedInventoryId('');
            setRelatedLogId('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            // Refresh images list
            fetchImages();

            // Auto-hide success message
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.message || 'Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    // Clear selected file
    const clearFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Get full image URL
    const getImageUrl = (filePath) => {
        if (!filePath) return '';
        // If the path already starts with http/https, return as is
        if (filePath.startsWith('http')) return filePath;
        // Otherwise, prepend the backend URL
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        return `${baseUrl}${filePath}`;
    };

    // Get type badge color
    const getTypeBadgeColor = (type) => {
        const typeConfig = UPLOAD_TYPES.find(t => t.value === type);
        return typeConfig?.color || 'gray';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-gray-400 dark:text-gray-400 light:text-gray-600">Loading uploads...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold gradient-text">Image Uploads</h1>
                <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 mt-2">
                    Upload and manage images for receipts, food labels, and more
                </p>
            </div>

            {/* Upload Form */}
            <Card className="premium-card border-gray-800/50 dark:border-gray-800/50 light:border-gray-300/50">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-500/10 rounded-lg flex items-center justify-center">
                            <Upload className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <CardTitle className="text-white dark:text-white light:text-gray-900">Upload Image</CardTitle>
                            <CardDescription>Upload receipts, food labels, or other images</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Success/Error Messages */}
                    {success && (
                        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400">
                            <Check className="w-5 h-5" />
                            <span>{success}</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
                            <X className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Drag and Drop Zone */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${dragActive
                            ? 'border-teal-500 bg-teal-500/5'
                            : 'border-gray-700 dark:border-gray-700 light:border-gray-300'
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/gif"
                            onChange={handleFileInputChange}
                            className="hidden"
                        />

                        {!previewUrl ? (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gray-800/50 dark:bg-gray-800/50 light:bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <ImageIcon className="w-8 h-8 text-gray-500 dark:text-gray-500 light:text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white dark:text-white light:text-gray-900 mb-2">
                                    Drop your image here
                                </h3>
                                <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 mb-4">
                                    or click to browse files
                                </p>
                                <Button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    Select File
                                </Button>
                                <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-500 mt-4">
                                    Supported formats: JPEG, PNG, JPG, GIF • Max size: 5MB
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-32 h-32 object-cover rounded-lg border border-gray-700 dark:border-gray-700 light:border-gray-300"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-semibold text-white dark:text-white light:text-gray-900">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={clearFile}
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Upload Options */}
                    {selectedFile && (
                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Upload Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="upload_type" className="text-gray-300 dark:text-gray-300 light:text-gray-700">
                                        Upload Type *
                                    </Label>
                                    <select
                                        id="upload_type"
                                        value={uploadType}
                                        onChange={(e) => setUploadType(e.target.value)}
                                        className="w-full h-11 px-4 bg-gray-900/50 dark:bg-gray-900/50 light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-300 rounded-xl text-white dark:text-white light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                    >
                                        {UPLOAD_TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Related Inventory */}
                                <div className="space-y-2">
                                    <Label htmlFor="inventory" className="text-gray-300 dark:text-gray-300 light:text-gray-700">
                                        Related Inventory (Optional)
                                    </Label>
                                    <select
                                        id="inventory"
                                        value={relatedInventoryId}
                                        onChange={(e) => setRelatedInventoryId(e.target.value)}
                                        className="w-full h-11 px-4 bg-gray-900/50 dark:bg-gray-900/50 light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-300 rounded-xl text-white dark:text-white light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                    >
                                        <option value="">None</option>
                                        {inventoryItems.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.item_name} ({item.quantity} {item.unit})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Related Log */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="log" className="text-gray-300 dark:text-gray-300 light:text-gray-700">
                                        Related Consumption Log (Optional)
                                    </Label>
                                    <select
                                        id="log"
                                        value={relatedLogId}
                                        onChange={(e) => setRelatedLogId(e.target.value)}
                                        className="w-full h-11 px-4 bg-gray-900/50 dark:bg-gray-900/50 light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-300 rounded-xl text-white dark:text-white light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                    >
                                        <option value="">None</option>
                                        {consumptionLogs.map((log) => (
                                            <option key={log.id} value={log.id}>
                                                {log.food_item?.item_name || 'Unknown'} - {log.quantity} {log.unit} ({log.consumption_date})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Upload Button */}
                            <Button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="w-full gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <div className="spinner-sm"></div>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Upload Image
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Uploaded Images Gallery */}
            <Card className="premium-card border-gray-800/50 dark:border-gray-800/50 light:border-gray-300/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                                <FileImage className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <CardTitle className="text-white dark:text-white light:text-gray-900">Uploaded Images</CardTitle>
                                <CardDescription>
                                    {pagination?.total || 0} image{pagination?.total !== 1 ? 's' : ''} uploaded
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {images.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-800/50 dark:bg-gray-800/50 light:bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ImageIcon className="w-8 h-8 text-gray-600 dark:text-gray-600 light:text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white dark:text-white light:text-gray-900 mb-2">
                                No Uploads Yet
                            </h3>
                            <p className="text-gray-400 dark:text-gray-400 light:text-gray-600">
                                Upload your first image to get started
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.map((image) => (
                                <div
                                    key={image.id}
                                    className="group relative bg-gray-900/30 dark:bg-gray-900/30 light:bg-gray-50 border border-gray-800 dark:border-gray-800 light:border-gray-200 rounded-xl overflow-hidden hover:border-teal-500/50 transition-all"
                                >
                                    {/* Image */}
                                    <div className="aspect-square relative overflow-hidden bg-gray-800/50 dark:bg-gray-800/50 light:bg-gray-100">
                                        <img
                                            src={getImageUrl(image.file_path)}
                                            alt={`Upload ${image.id}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    {/* Info */}
                                    <div className="p-4 space-y-3">
                                        {/* Type Badge */}
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold ${getTypeBadgeColor(image.upload_type) === 'teal'
                                                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                                                    : getTypeBadgeColor(image.upload_type) === 'purple'
                                                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                                                    }`}
                                            >
                                                {UPLOAD_TYPES.find(t => t.value === image.upload_type)?.label || image.upload_type}
                                            </span>
                                        </div>

                                        {/* Date */}
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(image.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </div>

                                        {/* Associations */}
                                        {(image.related_inventory_id || image.related_log_id) && (
                                            <div className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">
                                                {image.related_inventory_id && (
                                                    <div>📦 Inventory #{image.related_inventory_id}</div>
                                                )}
                                                {image.related_log_id && (
                                                    <div>📋 Log #{image.related_log_id}</div>
                                                )}
                                            </div>
                                        )}

                                        {/* View Button */}
                                        <a
                                            href={getImageUrl(image.file_path)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full text-center px-4 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            View Full Image
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {pagination && pagination.lastPage > 1 && (
                <div className="flex justify-center items-center gap-4">
                    <Button
                        onClick={() => fetchImages(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="p-2 bg-gray-800/50 border border-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 text-gray-300 transition-colors"
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <span className="text-gray-400 dark:text-gray-400 light:text-gray-600 font-medium">
                        Page {pagination.currentPage} of {pagination.lastPage}
                        {pagination.total > 0 && ` • ${pagination.total} total images`}
                    </span>
                    <button
                        onClick={() => fetchImages(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.lastPage}
                        className="p-2 bg-gray-800/50 border border-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 text-gray-300 transition-colors"
                        aria-label="Next page"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
