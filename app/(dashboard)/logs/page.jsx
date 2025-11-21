'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { FOOD_CATEGORIES, UNITS } from '@/lib/constants';
import { formatDate, parsePaginatedResponse, cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Filter, X, Tag, ChevronLeft, ChevronRight, Trash2, Plus, Loader2, Lightbulb, RefreshCw, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

const WASTAGE_TIPS = [
  "Plan your meals ahead to avoid buying more than you need.",
  "Store fruits and vegetables properly to extend their shelf life.",
  "Use leftovers creatively in new recipes instead of throwing them away.",
  "Understand expiration dates: 'Best before' refers to quality, not safety.",
  "Compost food scraps instead of sending them to the landfill.",
  "Freeze excess food like bread, fruits, and cooked meals for later use.",
  "Shop with a list to prevent impulse buys that might go to waste.",
  "Practice 'First In, First Out' (FIFO) when organizing your fridge.",
  "Serve smaller portions and go back for seconds if you're still hungry.",
  "Donate non-perishable food items you won't use to local food banks."
];

export default function LogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    category: '',
    page: 1
  });
  const [activePreset, setActivePreset] = useState('');
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: '',
    unit: 'kg',
    category: 'vegetable',
    consumption_date: new Date(),
    notes: '',
  });
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    // Rotate tips every 10 seconds
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % WASTAGE_TIPS.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to }),
        ...(filters.category && { category: filters.category })
      };
      const response = await api.getConsumptionLogs(params);
      const parsed = parsePaginatedResponse(response);
      setLogs(parsed.data);
      setPagination(parsed.pagination);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchLogs(filters.page);
  }, [token, filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        consumption_date: format(formData.consumption_date, 'yyyy-MM-dd')
      };
      await api.createConsumptionLog(payload);
      setFormData({
        item_name: '',
        quantity: '',
        unit: 'kg',
        category: 'vegetable',
        consumption_date: new Date(),
        notes: '',
      });
      setShowForm(false);
      setFilters({ ...filters, page: 1 });
      toast.success('Consumption log added successfully');
      fetchLogs(1); // Refresh list
    } catch (error) {
      toast.error(error.message || 'Failed to add log');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    // Optimistic update
    const previousLogs = [...logs];
    setLogs(logs.filter(log => log.id !== id));

    // Show undo toast
    const toastId = toast.success('Log deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          // Revert optimistic update
          setLogs(previousLogs);
        }
      },
    });

    try {
      await api.deleteConsumptionLog(id);
      if (logs.length === 1 && pagination.currentPage > 1) {
         fetchLogs(pagination.currentPage - 1);
      } else {
         fetchLogs(pagination.currentPage);
      }
    } catch (error) {
      // Revert on error
      setLogs(previousLogs);
      toast.error('Failed to delete log', { id: toastId });
    }
  };

  const formatDateForInput = (date) => {
    return format(date, 'yyyy-MM-dd');
  };

  const applyDatePreset = (preset) => {
    const today = new Date();
    let dateFrom = '';
    let dateTo = formatDateForInput(today);
    
    switch(preset) {
      case 'today':
        dateFrom = formatDateForInput(today);
        break;
      case 'last7days':
        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 7);
        dateFrom = formatDateForInput(last7Days);
        break;
      case 'last30days':
        const last30Days = new Date(today);
        last30Days.setDate(today.getDate() - 30);
        dateFrom = formatDateForInput(last30Days);
        break;
      case 'thisMonth':
        dateFrom = formatDateForInput(new Date(today.getFullYear(), today.getMonth(), 1));
        break;
      default:
        dateFrom = '';
        dateTo = '';
    }
    
    setFilters({ ...filters, date_from: dateFrom, date_to: dateTo, page: 1 });
    setActivePreset(preset);
  };

  const handleClearFilters = () => {
    setFilters({
      date_from: '',
      date_to: '',
      category: '',
      page: 1
    });
    setActivePreset('');
  };

  const handleDateSelect = (field, date) => {
    const value = date ? format(date, 'yyyy-MM-dd') : '';
    setFilters({ ...filters, [field]: value, page: 1 });
    setActivePreset('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.date_from || filters.date_to) count++;
    if (filters.category) count++;
    return count;
  };

  return (
    <div className="space-y-6 fade-in pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <div className="flex items-center gap-3 mb-3">
              <ClipboardList className="w-6 h-6 text-lime-400 dark:text-lime-400 light:text-lime-500" />
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">Consumption Logs</h1>
            </div>
            <p className="text-muted-foreground text-sm ml-9">Track and manage your daily food consumption</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`
            px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300
            ${showForm 
              ? 'bg-red-500/10 text-red-400 dark:text-red-400 light:text-red-500 border border-red-500/20 hover:bg-red-500/20' 
              : 'bg-gradient-to-r from-lime-500 to-lime-600 text-white hover:from-lime-600 hover:to-lime-700 hover:scale-[1.02]'
            }
          `}
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Cancel' : 'Add Log'}
        </button>
      </div>

      {/* Food Wastage Awareness Tip */}
      <div className="bg-gradient-to-r from-lime-500/10 to-lime-500/5 border border-lime-500/20 rounded-xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
        <div className="p-2 bg-lime-500/20 rounded-full shrink-0">
          <Lightbulb className="w-5 h-5 text-lime-400 dark:text-lime-400 light:text-lime-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lime-400 dark:text-lime-400 light:text-lime-500 font-semibold text-sm mb-1">Food Waste Tip</h3>
          <p className="text-foreground/80 text-sm leading-relaxed key={currentTipIndex} className='animate-in fade-in duration-500'">
            {WASTAGE_TIPS[currentTipIndex]}
          </p>
        </div>
        <button 
          onClick={() => setCurrentTipIndex((prev) => (prev + 1) % WASTAGE_TIPS.length)}
          className="p-1.5 text-muted-foreground hover:text-lime-400 dark:hover:text-lime-400 light:hover:text-lime-500 hover:bg-lime-500/10 rounded-lg transition-colors"
          title="Next Tip"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters Section */}
      <Card className="premium-card border-border/50">
        <CardContent>
        <div className="space-y-4">
          {/* Date Presets */}
          <div className="flex flex-wrap gap-2">
            {['today', 'last7days', 'last30days', 'thisMonth'].map((preset) => (
                <button
                key={preset}
                onClick={() => applyDatePreset(preset)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activePreset === preset
                    ? 'bg-gradient-to-r from-lime-500 to-lime-600 text-white'
                    : 'bg-muted/50 text-foreground/80 hover:bg-muted'
                }`}
                >
                {preset === 'today' && 'Today'}
                {preset === 'last7days' && 'Last 7 Days'}
                {preset === 'last30days' && 'Last 30 Days'}
                {preset === 'thisMonth' && 'This Month'}
                </button>
            ))}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Date From */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                <CalendarIcon className="inline w-4 h-4 mr-2 text-lime-400 dark:text-lime-400 light:text-lime-500" />
                From Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "w-full px-4 py-3.5 bg-card border border-border rounded-xl text-left font-normal text-foreground transition-all outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent flex items-center justify-between",
                      !filters.date_from && "text-muted-foreground"
                    )}
                  >
                    {filters.date_from ? format(new Date(filters.date_from), "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.date_from ? new Date(filters.date_from) : undefined}
                    onSelect={(date) => handleDateSelect('date_from', date)}
                    disabled={(date) =>
                      date > new Date() || (filters.date_to ? date > new Date(filters.date_to) : false)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                <CalendarIcon className="inline w-4 h-4 mr-2 text-lime-400 dark:text-lime-400 light:text-lime-500" />
                To Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "w-full px-4 py-3.5 bg-card border border-border rounded-xl text-left font-normal text-foreground transition-all outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent flex items-center justify-between",
                      !filters.date_to && "text-muted-foreground"
                    )}
                  >
                    {filters.date_to ? format(new Date(filters.date_to), "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.date_to ? new Date(filters.date_to) : undefined}
                    onSelect={(date) => handleDateSelect('date_to', date)}
                    disabled={(date) =>
                      date > new Date() || (filters.date_from ? date < new Date(filters.date_from) : false)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Category Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                <Tag className="inline w-4 h-4 mr-2 text-lime-400 dark:text-lime-400 light:text-lime-500" />
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                className="w-full px-4 py-3.5 bg-card border border-border rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-transparent capitalize text-foreground transition-all outline-none appearance-none"
              >
                <option value="">All Categories</option>
                {FOOD_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="capitalize">{cat}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {getActiveFilterCount() > 0 && (
              <div className="flex items-end">
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-3.5 bg-muted/50 text-foreground rounded-xl hover:bg-muted transition-all font-medium flex items-center gap-2 whitespace-nowrap border border-border"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                  <span className="ml-1 px-2 py-0.5 bg-lime-500/20 text-lime-400 dark:text-lime-400 light:text-lime-500 rounded-full text-xs font-medium">
                    {getActiveFilterCount()}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Date Range Summary */}
          {(filters.date_from || filters.date_to) && (
            <div className="text-sm text-foreground flex items-center gap-2 bg-lime-500/10 border border-lime-500/20 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2">
              <CalendarIcon className="w-4 h-4 text-lime-400 dark:text-lime-400 light:text-lime-500" />
              <span className="font-medium">
                Showing logs from {filters.date_from ? formatDate(filters.date_from) : 'beginning'} to {filters.date_to ? formatDate(filters.date_to) : 'today'}
              </span>
              <button
                onClick={() => {
                  setFilters({ ...filters, date_from: '', date_to: '', page: 1 });
                  setActivePreset('');
                }}
                className="ml-auto text-lime-400 dark:text-lime-400 light:text-lime-500 hover:text-lime-300 dark:hover:text-lime-300 light:hover:text-lime-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="premium-card border-border/50 animate-in fade-in slide-in-from-top-4">
          <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center gap-3">
            <div className="p-2 bg-lime-500/10 rounded-lg">
                <Plus className="w-5 h-5 text-lime-400 dark:text-lime-400 light:text-lime-500" />
            </div>
            Add Consumption Log
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Item Name *</label>
                <input
                  type="text"
                  required
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  className="w-full px-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-[#00FFB1] focus:border-transparent transition-all outline-none placeholder:text-gray-600"
                  placeholder="e.g., Apple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Quantity *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-[#00FFB1] focus:border-transparent transition-all outline-none placeholder:text-gray-600"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Unit *</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-[#00FFB1] focus:border-transparent transition-all outline-none appearance-none"
                >
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-[#00FFB1] focus:border-transparent transition-all outline-none appearance-none"
                >
                  {FOOD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Date *</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "w-full px-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl text-left font-normal transition-all outline-none focus:ring-2 focus:ring-[#00FFB1] focus:border-transparent flex items-center justify-between",
                        !formData.consumption_date && "text-muted-foreground"
                      )}
                    >
                      {formData.consumption_date ? format(formData.consumption_date, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-800" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.consumption_date}
                      onSelect={(date) => setFormData({ ...formData, consumption_date: date })}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="bg-gray-900 text-white border-gray-800"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-[#00FFB1] focus:border-transparent transition-all outline-none placeholder:text-gray-600"
                rows="3"
                placeholder="Optional notes..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all font-medium"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={submitting}
                    className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white px-8 py-3 rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-[1.02]"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Log'
                    )}
                </button>
            </div>
          </form>
          </CardContent>
        </Card>
      )}

      <Card className="premium-card border-border/50 overflow-hidden">
        <CardContent className="p-0">
        {loading ? (
            <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-4 border-b border-border/50 last:border-0">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-48 bg-muted/50" />
                            <Skeleton className="h-3 w-32 bg-muted/30" />
                        </div>
                        <div className="flex gap-8">
                            <Skeleton className="h-4 w-20 bg-muted/30" />
                            <Skeleton className="h-4 w-24 bg-muted/30" />
                            <Skeleton className="h-4 w-24 bg-muted/30" />
                        </div>
                    </div>
                ))}
            </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {getActiveFilterCount() > 0 ? (
                <Filter className="w-8 h-8 text-muted-foreground/70" />
              ) : (
                <CalendarIcon className="w-8 h-8 text-muted-foreground/70" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {getActiveFilterCount() > 0 ? 'No Logs Found' : 'No consumption logs yet'}
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {getActiveFilterCount() > 0 
                ? 'Try adjusting your filters to see more results' 
                : 'Start tracking your food consumption to get insights into your habits!'
              }
            </p>
            {getActiveFilterCount() > 0 && (
              <button
                onClick={handleClearFilters}
                className="mt-4 px-6 py-2.5 bg-muted/50 hover:bg-muted text-foreground rounded-xl transition-all font-medium inline-flex items-center gap-2 border border-border"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/30">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Item Details</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantity</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 bg-transparent">
                {logs.map((log) => (
                  <tr key={log.id} className="group hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-foreground text-sm">{log.item_name}</div>
                      {log.notes && (
                        <div className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">{log.notes}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-foreground/90 font-normal text-sm">
                        {parseFloat(log.quantity).toFixed(2)} <span className="text-muted-foreground/70 text-xs">{log.unit}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-muted/50 text-foreground/80 border border-border capitalize">
                        {log.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-foreground/80 text-sm font-normal">{formatDate(log.consumption_date)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button 
                        onClick={() => handleDelete(log.id)} 
                        className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete Log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.lastPage > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setFilters({ ...filters, page: pagination.currentPage - 1 })}
            disabled={pagination.currentPage === 1}
            className="p-2 bg-card border border-border rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent text-foreground transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-muted-foreground font-medium">
            Page {pagination.currentPage} of {pagination.lastPage}
          </span>
          <button
            onClick={() => setFilters({ ...filters, page: pagination.currentPage + 1 })}
            disabled={pagination.currentPage === pagination.lastPage}
            className="p-2 bg-card border border-border rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent text-foreground transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
