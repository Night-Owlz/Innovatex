'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { FOOD_CATEGORIES, UNITS } from '@/lib/constants';
import { formatDate, getExpirationBadgeClasses, formatExpirationDate, parsePaginatedResponse } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Package, Calendar, Tag, Trash2, ChevronLeft, ChevronRight, Pencil, Filter, Search } from 'lucide-react';

export default function InventoryPage() {
  const { token } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    expiring_soon: false,
    search: '',
    page: 1
  });
  const [searchInput, setSearchInput] = useState('');
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: '',
    unit: 'kg',
    category: 'vegetable',
    purchase_date: new Date().toISOString().split('T')[0],
    expiration_date: '',
  });
  const [editFormData, setEditFormData] = useState({
    item_name: '',
    quantity: '',
    unit: 'kg',
    category: 'vegetable',
    purchase_date: '',
    expiration_date: '',
  });

  const fetchInventory = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        ...(filters.category && { category: filters.category }),
        ...(filters.expiring_soon && { expiring_soon: 7 }),
        ...(filters.search && { search: filters.search })
      };
      const response = await api.getInventory(params);
      const parsed = parsePaginatedResponse(response);
      setInventory(parsed.data);
      setPagination(parsed.pagination);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInventory(filters.page);
    }
  }, [token, filters]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createInventory(formData);
      setFormData({
        item_name: '',
        quantity: '',
        unit: 'kg',
        category: 'vegetable',
        purchase_date: new Date().toISOString().split('T')[0],
        expiration_date: '',
      });
      setShowForm(false);
      setFilters({ ...filters, page: 1 });
    } catch (error) {
      alert('Error adding inventory: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.deleteInventory(id);
      setFilters({ ...filters });
    } catch (error) {
      alert('Error deleting item: ' + error.message);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setEditFormData({
      item_name: item.item_name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      purchase_date: item.purchase_date || '',
      expiration_date: item.expiration_date || '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.updateInventory(editingItem.id, editFormData);
      setShowEditModal(false);
      setEditingItem(null);
      setFilters({ ...filters });
    } catch (error) {
      alert('Error updating inventory: ' + error.message);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingItem(null);
    setEditFormData({
      item_name: '',
      quantity: '',
      unit: 'kg',
      category: 'vegetable',
      purchase_date: '',
      expiration_date: '',
    });
  };

  const handleClearFilters = () => {
    setFilters({
      category: '',
      expiring_soon: false,
      search: '',
      page: 1
    });
    setSearchInput('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.expiring_soon) count++;
    if (filters.search) count++;
    return count;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-400 dark:text-gray-400 light:text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Inventory</h1>
          <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 mt-2">
            Manage your food items and track expiration dates
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gap-2"
          variant={showForm ? "outline" : "default"}
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Item
            </>
          )}
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="premium-card border-gray-800/50 dark:border-gray-800/50 light:border-gray-300/50">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search by food item name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="w-full lg:w-48">
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                className="w-full h-11 px-4 bg-gray-900/50 dark:bg-gray-900/50 light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-300 rounded-xl text-white dark:text-white light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all capitalize"
              >
                <option value="">All Categories</option>
                {FOOD_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="capitalize">{cat}</option>
                ))}
              </select>
            </div>

            {/* Expiring Soon Toggle */}
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-900/30 dark:bg-gray-900/30 light:bg-gray-50 rounded-xl border border-gray-800 dark:border-gray-800 light:border-gray-300">
              <input
                type="checkbox"
                id="expiring_soon"
                checked={filters.expiring_soon}
                onChange={(e) => setFilters({ ...filters, expiring_soon: e.target.checked, page: 1 })}
                className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 bg-gray-800 dark:bg-gray-800 light:bg-white cursor-pointer"
              />
              <Label 
                htmlFor="expiring_soon" 
                className="text-sm text-gray-300 dark:text-gray-300 light:text-gray-700 cursor-pointer whitespace-nowrap"
              >
                Expiring Soon (7 days)
              </Label>
            </div>

            {/* Clear Filters */}
            {getActiveFilterCount() > 0 && (
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="gap-2 whitespace-nowrap"
              >
                <X className="w-4 h-4" />
                Clear Filters
                <span className="ml-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold">
                  {getActiveFilterCount()}
                </span>
              </Button>
            )}
          </div>

          {/* Active Filters Summary */}
          {getActiveFilterCount() > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.category && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-lg text-sm">
                  <Tag className="w-3.5 h-3.5" />
                  <span className="capitalize">{filters.category}</span>
                  <button
                    onClick={() => setFilters({ ...filters, category: '', page: 1 })}
                    className="ml-1 hover:text-purple-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {filters.expiring_soon && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-300 rounded-lg text-sm">
                  <Calendar className="w-3.5 h-3.5" />
                  Expiring within 7 days
                  <button
                    onClick={() => setFilters({ ...filters, expiring_soon: false, page: 1 })}
                    className="ml-1 hover:text-orange-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {filters.search && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 text-teal-300 rounded-lg text-sm">
                  <Search className="w-3.5 h-3.5" />
                  Search: {filters.search}
                  <button
                    onClick={() => {
                      setFilters({ ...filters, search: '', page: 1 });
                      setSearchInput('');
                    }}
                    className="ml-1 hover:text-teal-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Item Form */}
      {showForm && (
        <Card className="premium-card border-gray-800/50 dark:border-gray-800/50 light:border-gray-300/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500/10 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <CardTitle className="text-white dark:text-white light:text-gray-900">Add Inventory Item</CardTitle>
                <CardDescription>Fill in the details to add a new item to your inventory</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="item_name" className="text-gray-300 dark:text-gray-300 light:text-gray-700">Item Name *</Label>
                  <Input
                    id="item_name"
                    type="text"
                    required
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    placeholder="e.g., Tomatoes"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-gray-300 dark:text-gray-300 light:text-gray-700">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="e.g., 2.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-gray-300 dark:text-gray-300 light:text-gray-700">Unit *</Label>
                  <select
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full h-11 px-4 bg-gray-900/50 dark:bg-gray-900/50 light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-300 rounded-xl text-white dark:text-white light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-gray-300 dark:text-gray-300 light:text-gray-700">Category *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-11 px-4 bg-gray-900/50 dark:bg-gray-900/50 light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-300 rounded-xl text-white dark:text-white light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all capitalize"
                  >
                    {FOOD_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="capitalize">{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase_date" className="text-gray-300 dark:text-gray-300 light:text-gray-700">Purchase Date *</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    required
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiration_date" className="text-gray-300 dark:text-gray-300 light:text-gray-700">Expiration Date</Label>
                  <Input
                    id="expiration_date"
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full md:w-auto gap-2">
                <Plus className="w-4 h-4" />
                Add Item to Inventory
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Item Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="premium-card border-gray-800/50 dark:border-gray-800/50 light:border-gray-300/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Pencil className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white dark:text-white light:text-gray-900">Edit Inventory Item</CardTitle>
                    <CardDescription>Update the details of your inventory item</CardDescription>
                  </div>
                </div>
                <Button
                  onClick={handleCancelEdit}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="edit_item_name" className="text-gray-300 dark:text-gray-300 light:text-gray-700">Item Name *</Label>
                    <Input
                      id="edit_item_name"
                      type="text"
                      required
                      value={editFormData.item_name}
                      onChange={(e) => setEditFormData({ ...editFormData, item_name: e.target.value })}
                      placeholder="e.g., Tomatoes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_quantity" className="text-gray-300 dark:text-gray-300 light:text-gray-700">Quantity *</Label>
                    <Input
                      id="edit_quantity"
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      value={editFormData.quantity}
                      onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                      placeholder="e.g., 2.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_unit" className="text-gray-300 dark:text-gray-300 light:text-gray-700">Unit *</Label>
                    <select
                      id="edit_unit"
                      value={editFormData.unit}
                      onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                      className="w-full h-11 px-4 bg-gray-900/50 dark:bg-gray-900/50 light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-300 rounded-xl text-white dark:text-white light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    >
                      {UNITS.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_category" className="text-gray-300 dark:text-gray-300 light:text-gray-700">Category *</Label>
                    <select
                      id="edit_category"
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      className="w-full h-11 px-4 bg-gray-900/50 dark:bg-gray-900/50 light:bg-white border border-gray-800 dark:border-gray-800 light:border-gray-300 rounded-xl text-white dark:text-white light:text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all capitalize"
                    >
                      {FOOD_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="capitalize">{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_purchase_date" className="text-gray-300 dark:text-gray-300 light:text-gray-700">Purchase Date *</Label>
                    <Input
                      id="edit_purchase_date"
                      type="date"
                      required
                      max={new Date().toISOString().split('T')[0]}
                      value={editFormData.purchase_date}
                      onChange={(e) => setEditFormData({ ...editFormData, purchase_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_expiration_date" className="text-gray-300 dark:text-gray-300 light:text-gray-700">Expiration Date</Label>
                    <Input
                      id="edit_expiration_date"
                      type="date"
                      min={editFormData.purchase_date}
                      value={editFormData.expiration_date}
                      onChange={(e) => setEditFormData({ ...editFormData, expiration_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    onClick={handleCancelEdit}
                    variant="outline"
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                  <Button type="submit" className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inventory Table */}
      <Card className="premium-card border-gray-800/50 dark:border-gray-800/50 light:border-gray-300/50">
        {inventory.length === 0 ? (
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 bg-gray-800/50 dark:bg-gray-800/50 light:bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {getActiveFilterCount() > 0 ? (
                <Filter className="w-8 h-8 text-gray-600 dark:text-gray-600 light:text-gray-400" />
              ) : (
                <Package className="w-8 h-8 text-gray-600 dark:text-gray-600 light:text-gray-400" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-white dark:text-white light:text-gray-900 mb-2">
              {getActiveFilterCount() > 0 ? 'No Results Found' : 'No Inventory Items'}
            </h3>
            <p className="text-gray-400 dark:text-gray-400 light:text-gray-600">
              {getActiveFilterCount() > 0 
                ? 'Try adjusting your filters to see more results' 
                : 'Add your first item to start tracking your food inventory'
              }
            </p>
            {getActiveFilterCount() > 0 && (
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="mt-4 gap-2"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </Button>
            )}
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800 dark:divide-gray-800 light:divide-gray-200">
              <thead className="bg-gray-900/50 dark:bg-gray-900/50 light:bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 dark:text-gray-400 light:text-gray-700 uppercase tracking-wider">
                    Item Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 dark:text-gray-400 light:text-gray-700 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 dark:text-gray-400 light:text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 dark:text-gray-400 light:text-gray-700 uppercase tracking-wider">
                    Expiration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 dark:text-gray-400 light:text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 dark:divide-gray-800/50 light:divide-gray-200">
                {inventory.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-gray-900/30 dark:hover:bg-gray-900/30 light:hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white dark:text-white light:text-gray-900">{item.item_name}</div>
                      {item.purchase_date && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Purchased {formatDate(item.purchase_date)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-300 dark:text-gray-300 light:text-gray-700">
                        <Package className="w-4 h-4 text-teal-400" />
                        <span className="font-medium">{parseFloat(item.quantity).toFixed(2)} {item.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-purple-400" />
                        <span className="capitalize text-gray-300 dark:text-gray-300 light:text-gray-700">{item.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.expiration_date ? (
                        <div className="space-y-1">
                          <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-semibold ${
                            item.is_expired 
                              ? 'badge-red' 
                              : item.is_expiring 
                              ? 'badge-orange' 
                              : 'badge-green'
                          }`}>
                            {formatDate(item.expiration_date)}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-600">
                            {formatExpirationDate(item.expiration_date)}
                            {item.days_until_expiration !== undefined && (
                              <span className="ml-2">({item.days_until_expiration} days)</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-500 light:text-gray-400 text-sm">No expiration</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleEdit(item)}
                          variant="ghost"
                          size="sm"
                          className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 gap-2"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(item.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {pagination && pagination.lastPage > 1 && (
        <div className="flex justify-center items-center gap-4">
          <Button
            onClick={() => setFilters({ ...filters, page: pagination.currentPage - 1 })}
            disabled={pagination.currentPage === 1}
            className="p-2 bg-gray-800/50 border border-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 text-gray-300 transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-gray-400 dark:text-gray-400 light:text-gray-600 font-medium">
            Page {pagination.currentPage} of {pagination.lastPage}
            {pagination.total > 0 && ` • ${pagination.total} total items`}
          </span>
          <button
            onClick={() => setFilters({ ...filters, page: pagination.currentPage + 1 })}
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
