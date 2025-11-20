'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { FOOD_CATEGORIES, UNITS } from '@/lib/constants';
import { formatDate, parsePaginatedResponse } from '@/lib/utils';
import { Calendar, Filter, X, Tag, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
    consumption_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchLogs(filters.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createConsumptionLog(formData);
      setFormData({
        item_name: '',
        quantity: '',
        unit: 'kg',
        category: 'vegetable',
        consumption_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setShowForm(false);
      setFilters({ ...filters, page: 1 });
    } catch (error) {
      alert('Error adding log: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this log?')) return;
    try {
      await api.deleteConsumptionLog(id);
      setFilters({ ...filters });
    } catch (error) {
      alert('Error deleting log: ' + error.message);
    }
  };

  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
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

  const handleDateChange = (field, value) => {
    setFilters({ ...filters, [field]: value, page: 1 });
    setActivePreset(''); // Clear preset when manually changing dates
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.date_from || filters.date_to) count++;
    if (filters.category) count++;
    return count;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold gradient-text">Consumption Logs</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-2.5 rounded-xl hover:shadow-xl transition-all font-semibold"
        >
          {showForm ? 'Cancel' : 'Add Log'}
        </button>
      </div>

      {/* Filters Section */}
      <div className="premium-card border-gray-800/50 rounded-xl p-6">
        <div className="space-y-4">
          {/* Date Presets */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyDatePreset('today')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activePreset === 'today'
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => applyDatePreset('last7days')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activePreset === 'last7days'
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => applyDatePreset('last30days')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activePreset === 'last30days'
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => applyDatePreset('thisMonth')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activePreset === 'thisMonth'
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              This Month
            </button>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Date From */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />
                From Date
              </label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleDateChange('date_from', e.target.value)}
                max={filters.date_to || undefined}
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
              />
            </div>

            {/* Date To */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />
                To Date
              </label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleDateChange('date_to', e.target.value)}
                min={filters.date_from || undefined}
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white"
              />
            </div>

            {/* Category Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                <Tag className="inline w-4 h-4 mr-1" />
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent capitalize text-white"
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
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium flex items-center gap-2 whitespace-nowrap"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                  <span className="ml-1 px-2 py-0.5 bg-purple-500/20 text-purple-700 rounded-full text-xs font-semibold">
                    {getActiveFilterCount()}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Date Range Summary */}
          {(filters.date_from || filters.date_to) && (
            <div className="text-sm text-gray-300 flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 px-4 py-2 rounded-lg">
              <Calendar className="w-4 h-4 text-teal-400" />
              <span className="font-medium">
                Showing logs from {filters.date_from ? formatDate(filters.date_from) : 'beginning'} to {filters.date_to ? formatDate(filters.date_to) : 'today'}
              </span>
              <button
                onClick={() => {
                  setFilters({ ...filters, date_from: '', date_to: '', page: 1 });
                  setActivePreset('');
                }}
                className="ml-auto text-teal-400 hover:text-teal-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Active Category Filter */}
          {filters.category && (
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-lg text-sm font-medium">
                <Tag className="w-3.5 h-3.5" />
                <span className="capitalize">{filters.category}</span>
                <button
                  onClick={() => setFilters({ ...filters, category: '', page: 1 })}
                  className="ml-1 hover:text-teal-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="premium-card border-gray-800/50 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4 text-white">Add Consumption Log</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Item Name *</label>
                <input
                  type="text"
                  required
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Quantity *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Unit *</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {FOOD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.consumption_date}
                  onChange={(e) => setFormData({ ...formData, consumption_date: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows="3"
              />
            </div>
            <button type="submit" className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-2.5 rounded-xl hover:shadow-xl transition-all font-semibold">
              Add Log
            </button>
          </form>
        </div>
      )}

      <div className="premium-card border-gray-800/50 rounded-xl overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {getActiveFilterCount() > 0 ? (
                <Filter className="w-8 h-8 text-gray-400" />
              ) : (
                <Calendar className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {getActiveFilterCount() > 0 ? 'No Logs Found' : 'No consumption logs yet'}
            </h3>
            <p className="text-gray-400">
              {getActiveFilterCount() > 0 
                ? 'Try adjusting your filters to see more results' 
                : 'Start tracking your food consumption!'
              }
            </p>
            {getActiveFilterCount() > 0 && (
              <button
                onClick={handleClearFilters}
                className="mt-4 px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-all font-medium inline-flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900/30 divide-y divide-gray-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{log.item_name}</div>
                      {log.notes && (
                        <div className="text-xs text-gray-500 mt-1">{log.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-300">{parseFloat(log.quantity).toFixed(2)} {log.unit}</td>
                    <td className="px-6 py-4 text-gray-300">
                      <span className="capitalize">{log.category}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{formatDate(log.consumption_date)}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleDelete(log.id)} 
                        className="text-red-400 hover:text-red-300 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.lastPage > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <button
            onClick={() => setFilters({ ...filters, page: pagination.currentPage - 1 })}
            disabled={pagination.currentPage === 1}
            className="p-2 bg-gray-800/50 border border-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 text-white transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-gray-300">
            Page {pagination.currentPage} of {pagination.lastPage}
            {pagination.total > 0 && ` (${pagination.total} total logs)`}
          </span>
          <button
            onClick={() => setFilters({ ...filters, page: pagination.currentPage + 1 })}
            disabled={pagination.currentPage === pagination.lastPage}
            className="p-2 bg-gray-800/50 border border-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 text-white transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
