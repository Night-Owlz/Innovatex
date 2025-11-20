import { Calendar, FileImage } from 'lucide-react';
import { Card } from '@/components/ui/card';

const UPLOAD_TYPES = [
    { value: 'receipt', label: 'Receipt', color: 'teal' },
    { value: 'food_label', label: 'Food Label', color: 'purple' },
    { value: 'other', label: 'Other', color: 'gray' },
];

export function UploadCard({ image, getImageUrl, getTypeBadgeColor }) {
    return (
        <div
            className="group relative bg-gray-900/30 dark:bg-gray-900/30 light:bg-gray-50 border border-gray-800 dark:border-gray-800 light:border-gray-200 rounded-xl overflow-hidden hover:border-lime-500/50 transition-all"
        >
            {/* Image */}
            <div className="aspect-square relative overflow-hidden bg-muted">
                <img
                    src={getImageUrl(image.file_path)}
                    alt={`Upload ${image.id}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                     <a
                        href={getImageUrl(image.file_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center px-4 py-2 bg-lime-500 hover:bg-lime-600 text-black font-semibold rounded-lg text-sm transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300"
                    >
                        View Full Image
                    </a>
                </div>
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
                {/* Type Badge */}
                <div className="flex items-center justify-between">
                    <span
                        className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold ${getTypeBadgeColor(image.upload_type) === 'teal'
                            ? 'bg-lime-500/10 text-lime-400 border border-lime-500/30'
                            : getTypeBadgeColor(image.upload_type) === 'purple'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                : 'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                            }`}
                    >
                        {UPLOAD_TYPES.find(t => t.value === image.upload_type)?.label || image.upload_type}
                    </span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                    <Calendar className="w-3 h-3" />
                    {new Date(image.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                </div>

                {/* Associations */}
                {(image.related_inventory_id || image.related_log_id) && (
                    <div className="text-xs text-muted-foreground pt-2 border-t border-gray-800/50">
                        {image.related_inventory_id && (
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                Inventory #{image.related_inventory_id}
                            </div>
                        )}
                        {image.related_log_id && (
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                                Log #{image.related_log_id}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
