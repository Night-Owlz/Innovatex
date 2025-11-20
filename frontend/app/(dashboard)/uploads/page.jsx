'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { parsePaginatedResponse } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Image as ImageIcon, X, Check, ChevronLeft, ChevronRight, FileImage } from 'lucide-react';
import { UploadCard } from '@/components/uploads/UploadCard';
import { UploadSkeleton } from '@/components/uploads/UploadSkeleton';

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
        setLoading(true);
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

    return (
        <div className="space-y-6 fade-in pb-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Image Uploads</h1>
                    <p className="text-muted-foreground mt-2">
                        Upload and manage images for receipts, food labels, and more
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-card border border-border px-4 py-2 rounded-lg shadow-sm">
                        <span className="text-sm text-muted-foreground">Total Uploads:</span>
                        <span className="ml-2 text-lg font-semibold text-lime-400 dark:text-lime-400 light:text-lime-500">
                            {pagination?.total || 0}
                        </span>
                    </div>
                </div>
            </div>

            {/* Upload Form */}
            <Card className="premium-card border-border/50 overflow-hidden">
                <CardHeader className="bg-black/20 border-b border-border/50">
                    <div className="flex items-center gap-3 pt-[15px] pl-5">
                        <div className="w-10 h-10 bg-lime-500/10 rounded-lg flex items-center justify-center ring-1 ring-lime-500/20">
                            <Upload className="w-5 h-5 text-lime-400 dark:text-lime-400 light:text-lime-500" />
                        </div>
                        <div>
                            <CardTitle className="text-foreground">Upload New Image</CardTitle>
                            <CardDescription>Drag and drop or select a file to upload</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                    {/* Success/Error Messages */}
                    {success && (
                        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 animate-in fade-in slide-in-from-top-2">
                            <Check className="w-5 h-5" />
                            <span>{success}</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 dark:text-red-400 light:text-red-500 animate-in fade-in slide-in-from-top-2">
                            <X className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid lg:grid-cols-5 gap-8">
                        {/* Drag and Drop Zone */}
                        <div className="lg:col-span-2">
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={`relative h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${dragActive
                                    ? 'border-lime-500 bg-lime-500/5 scale-[1.02]'
                                    : 'border-gray-700 dark:border-gray-700 light:border-gray-300 hover:border-lime-500/50 hover:bg-gray-900/50'
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
                                    <div className="text-center space-y-4">
                                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto shadow-inner">
                                            <ImageIcon className="w-10 h-10 text-gray-500 dark:text-gray-500 light:text-gray-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-foreground">
                                                Drop image here
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                or click to browse
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            variant="outline"
                                            className="gap-2 mt-4 hover:bg-lime-500/10 hover:text-lime-400 dark:hover:text-lime-400 light:hover:text-lime-500 hover:border-lime-500/50 transition-all"
                                        >
                                            <Upload className="w-4 h-4" />
                                            Select File
                                        </Button>
                                        <p className="text-xs text-muted-foreground/60">
                                            JPEG, PNG, JPG, GIF • Max 5MB
                                        </p>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center">
                                        <div className="relative w-full flex-1 min-h-[200px] rounded-lg overflow-hidden border border-gray-700 mb-4 group">
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="w-full h-full object-contain bg-black/50"
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button
                                                    type="button"
                                                    onClick={clearFile}
                                                    variant="destructive"
                                                    size="sm"
                                                    className="gap-2"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="w-full flex items-center justify-between px-2">
                                            <div className="truncate flex-1 mr-4">
                                                <p className="font-medium text-sm text-foreground truncate">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={clearFile}
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-red-400 dark:hover:text-red-400 light:hover:text-red-500"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Upload Options */}
                        <div className="lg:col-span-3 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Upload Type */}
                                <div className="space-y-3">
                                    <Label htmlFor="upload_type" className="text-foreground/90 font-medium">
                                        Upload Type <span className="text-red-400 dark:text-red-400 light:text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <select
                                            id="upload_type"
                                            value={uploadType}
                                            onChange={(e) => setUploadType(e.target.value)}
                                            disabled={!selectedFile}
                                            className="w-full h-12 px-4 bg-gray-900/50 dark:bg-gray-900/50 light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-300 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-lime-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                                        >
                                            {UPLOAD_TYPES.map((type) => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                            <ChevronLeft className="w-4 h-4 -rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                {/* Related Inventory */}
                                <div className="space-y-3">
                                    <Label htmlFor="inventory" className="text-foreground/90 font-medium">
                                        Related Inventory <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                                    </Label>
                                    <div className="relative">
                                        <select
                                            id="inventory"
                                            value={relatedInventoryId}
                                            onChange={(e) => setRelatedInventoryId(e.target.value)}
                                            disabled={!selectedFile}
                                            className="w-full h-12 px-4 bg-gray-900/50 dark:bg-gray-900/50 light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-300 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-lime-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                                        >
                                            <option value="">Select Inventory Item</option>
                                            {inventoryItems.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.item_name} ({item.quantity} {item.unit})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                            <ChevronLeft className="w-4 h-4 -rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                {/* Related Log */}
                                <div className="space-y-3 md:col-span-2">
                                    <Label htmlFor="log" className="text-foreground/90 font-medium">
                                        Related Consumption Log <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                                    </Label>
                                    <div className="relative">
                                        <select
                                            id="log"
                                            value={relatedLogId}
                                            onChange={(e) => setRelatedLogId(e.target.value)}
                                            disabled={!selectedFile}
                                            className="w-full h-12 px-4 bg-gray-900/50 dark:bg-gray-900/50 light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-300 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-lime-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                                        >
                                            <option value="">Select Consumption Log</option>
                                            {consumptionLogs.map((log) => (
                                                <option key={log.id} value={log.id}>
                                                    {log.item_name || 'Unknown'} - {log.quantity} {log.unit} ({log.consumption_date})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                            <ChevronLeft className="w-4 h-4 -rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={handleUpload}
                                    disabled={uploading || !selectedFile}
                                    className="w-full h-12 gap-2 text-lg font-medium transition-all"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="spinner-sm"></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5" />
                                            Upload Image
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Uploaded Images Gallery */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <FileImage className="w-6 h-6 text-lime-400 dark:text-lime-400 light:text-lime-500" />
                        Recent Uploads
                    </h2>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <UploadSkeleton key={i} />
                        ))}
                    </div>
                ) : images.length === 0 ? (
                    <Card className="bg-gray-900/20 border-dashed border-2 border-gray-800 p-12 text-center">
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ImageIcon className="w-8 h-8 text-muted-foreground/70" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                            No Uploads Yet
                        </h3>
                        <p className="text-muted-foreground">
                            Upload your first image to get started
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {images.map((image) => (
                            <UploadCard
                                key={image.id}
                                image={image}
                                getImageUrl={getImageUrl}
                                getTypeBadgeColor={getTypeBadgeColor}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && pagination && pagination.lastPage > 1 && (
                    <div className="flex justify-center items-center gap-4 pt-8">
                        <Button
                            onClick={() => fetchImages(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className="p-2 bg-card border border-border rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent text-foreground transition-colors"
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <span className="text-muted-foreground font-medium">
                            Page {pagination.currentPage} of {pagination.lastPage}
                        </span>
                        <Button
                            onClick={() => fetchImages(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.lastPage}
                            className="p-2 bg-card border border-border rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent text-foreground transition-colors"
                            aria-label="Next page"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
