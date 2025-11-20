'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { RESOURCE_CATEGORIES, RESOURCE_TYPES } from '@/lib/constants';
import { parsePaginatedResponse } from '@/lib/utils';
import { ChevronLeft, ChevronRight, BookOpen, ExternalLink, Tag, Filter, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function ResourcesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [resources, setResources] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [filter, setFilter] = useState({ 
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '', 
    type: searchParams.get('type') || '',
    page: parseInt(searchParams.get('page') || '1')
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.search) params.set('search', filter.search);
    if (filter.category) params.set('category', filter.category);
    if (filter.type) params.set('type', filter.type);
    if (filter.page > 1) params.set('page', filter.page.toString());
    
    const newUrl = params.toString() ? `?${params.toString()}` : '/resources';
    router.push(newUrl, { scroll: false });
  }, [filter, router]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filter.search) {
        setFilter(prev => ({ ...prev, search: searchInput, page: 1 }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, filter.search]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
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

  // Skeleton Components
  const FiltersSkeleton = () => (
    <Card className="premium-card border-border/50">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div className="h-12 w-48 bg-muted/50 rounded-xl animate-pulse" />
          <div className="h-12 w-48 bg-muted/50 rounded-xl animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );

  const ResourceCardSkeleton = () => (
    <Card className="premium-card border-border/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="h-6 bg-muted/50 rounded animate-pulse flex-1" />
          <div className="h-6 w-16 bg-muted/50 rounded-full animate-pulse ml-2" />
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-muted/50 rounded animate-pulse" />
          <div className="h-4 bg-muted/50 rounded animate-pulse w-4/5" />
          <div className="h-4 bg-muted/50 rounded animate-pulse w-3/5" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted/50 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-10 w-48 bg-muted/50 rounded-lg animate-pulse mb-3" />
            <div className="h-4 w-96 bg-muted/50 rounded animate-pulse" />
          </div>
        </div>

        {/* Filters Skeleton */}
        <FiltersSkeleton />

        {/* Resource Cards Skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ResourceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header - Enhanced */}
      <div className="relative">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-lime-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-6 h-6 text-lime-400 dark:text-lime-400 light:text-lime-500" />
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Resources</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-9">
            Discover helpful guides, recipes, and tips for food management
          </p>
        </div>
      </div>

      {/* Filters Section - Enhanced */}
      <Card className="premium-card border-border/50 hover:border-lime-500/30 transition-all duration-300">
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-lime-400" />
            <h2 className="text-lg font-semibold text-foreground">Search & Filter Resources</h2>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {/* Search Bar */}
            <div className="space-y-2">
              <Label htmlFor="search-input" className="text-foreground font-medium text-sm">
                Search
              </Label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-lime-400 transition-colors" />
                <Input
                  id="search-input"
                  type="text"
                  placeholder="Search resources by title or description..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-12 py-3.5 text-sm font-medium border-2 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all"
                />
              </div>
            </div>
            
            {/* Category and Type Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category-filter" className="text-foreground font-medium text-sm">
                  Category
                </Label>
                <select
                  id="category-filter"
                  value={filter.category}
                  onChange={(e) => setFilter({ ...filter, category: e.target.value, page: 1 })}
                  className="w-full px-4 py-3.5 bg-card border-2 border-border rounded-lg text-foreground font-medium text-sm focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all capitalize cursor-pointer hover:border-lime-500/50"
                >
                  <option value="">All Categories</option>
                  {Object.entries(RESOURCE_CATEGORIES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type-filter" className="text-foreground font-medium text-sm">
                  Resource Type
                </Label>
                <select
                  id="type-filter"
                  value={filter.type}
                  onChange={(e) => setFilter({ ...filter, type: e.target.value, page: 1 })}
                  className="w-full px-4 py-3.5 bg-card border-2 border-border rounded-lg text-foreground font-medium text-sm focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all capitalize cursor-pointer hover:border-lime-500/50"
                >
                  <option value="">All Types</option>
                  {Object.entries(RESOURCE_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      {resources.length === 0 ? (
        <Card className="premium-card border-border/50">
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground/70" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No resources found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your filters to find what you&apos;re looking for
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <Card 
              key={resource.id} 
              className="group premium-card border-border/50 hover:border-lime-500/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-lime-500/0 via-lime-500/0 to-lime-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-foreground flex-1 group-hover:text-lime-400 transition-colors duration-300">
                    {resource.title}
                  </h3>
                  <span className="px-3 py-1.5 bg-lime-500/10 text-lime-400 dark:text-lime-400 light:text-lime-500 text-xs rounded-full font-medium ml-2 border border-lime-500/30 uppercase tracking-wider">
                    {RESOURCE_TYPES[resource.type] || resource.type}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3 leading-relaxed">
                  {resource.description}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    {RESOURCE_CATEGORIES[resource.category] || resource.category}
                  </span>
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lime-400 dark:text-lime-400 light:text-lime-500 hover:text-lime-300 dark:hover:text-lime-300 light:hover:text-lime-400 text-sm font-medium flex items-center gap-1.5 group-hover:gap-2 transition-all"
                    >
                      Learn More
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
                    {resource.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="px-2.5 py-1 bg-muted/50 text-muted-foreground text-xs rounded-lg font-medium hover:bg-lime-500/10 hover:text-lime-400 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination - Enhanced */}
      {pagination && pagination.lastPage > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
            disabled={filter.page === 1}
            className="p-3 bg-card border-2 border-border rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted hover:border-lime-500/50 transition-all duration-300 group"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5 text-foreground group-hover:text-lime-400 transition-colors" />
          </button>
          <span className="text-foreground font-bold text-base px-4 py-2 bg-muted/30 rounded-xl border-2 border-border">
            Page {filter.page} of {pagination.lastPage}
          </span>
          <button
            onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
            disabled={filter.page === pagination.lastPage}
            className="p-3 bg-card border-2 border-border rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted hover:border-lime-500/50 transition-all duration-300 group"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5 text-foreground group-hover:text-lime-400 transition-colors" />
          </button>
        </div>
      )}
    </div>
  );
}
