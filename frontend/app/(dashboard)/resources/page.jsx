'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { RESOURCE_CATEGORIES, RESOURCE_TYPES } from '@/lib/constants';
import { parsePaginatedResponse } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: '', type: '' });

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await api.getResources({ ...filter, per_page: 9 });
        const parsed = parsePaginatedResponse(response);
        setResources(parsed.data);
        setPagination(parsed.pagination);
      } catch (error) {
        console.error('Error fetching resources:', error);
        setResources([]);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, [filter]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold gradient-text">Resources</h1>

      <div className="premium-card border-gray-800/50 rounded-xl p-4 flex gap-4">
        <select
          value={filter.category}
          onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          className="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <option value="">All Categories</option>
          {Object.entries(RESOURCE_CATEGORIES).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <option value="">All Types</option>
          {Object.entries(RESOURCE_TYPES).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {resources.length === 0 ? (
        <div className="premium-card border-gray-800/50 rounded-xl p-12 text-center">
          <p className="text-gray-400 text-lg">No resources found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <div key={resource.id} className="premium-card border-gray-800/50 rounded-xl p-6 hover:border-teal-500/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-white flex-1">{resource.title}</h3>
                <span className="px-2 py-1 bg-teal-500/10 text-teal-400 text-xs rounded font-medium ml-2 border border-teal-500/20">
                  {RESOURCE_TYPES[resource.type] || resource.type}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4 line-clamp-3">{resource.description}</p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xs text-gray-500 font-medium">
                  {RESOURCE_CATEGORIES[resource.category] || resource.category}
                </span>
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-400 hover:text-teal-300 text-sm font-medium"
                  >
                    Learn More →
                  </a>
                )}
              </div>
              {resource.tags && resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {resource.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-gray-800/50 text-gray-400 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.lastPage > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <button
            onClick={() => setFilter({ ...filter, page: pagination.currentPage - 1 })}
            disabled={pagination.currentPage === 1}
            className="p-2 bg-gray-800/50 border border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5 text-gray-300" />
          </button>
          <span className="text-gray-300 font-medium">
            Page {pagination.currentPage} of {pagination.lastPage}
          </span>
          <button
            onClick={() => setFilter({ ...filter, page: pagination.currentPage + 1 })}
            disabled={pagination.currentPage === pagination.lastPage}
            className="p-2 bg-gray-800/50 border border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      )}
    </div>
  );
}
