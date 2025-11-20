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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, X, Package, Calendar as CalendarIcon, Tag, Trash2, ChevronLeft, ChevronRight, Pencil, Filter, Search, Calendar1Icon, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      // Refresh current page
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
      // Refresh current page
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

  // Skeleton Components
  const FiltersSkeleton = () => (
    <Card className="premium-card border-border/50">
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="h-11 bg-muted/50 rounded-xl animate-pulse" />
          </div>
          <div className="w-full lg:w-48">
            <div className="h-11 bg-muted/50 rounded-xl animate-pulse" />
          </div>
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-4 h-4 bg-muted/50 rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
          </div>
          <div className="h-11 w-32 bg-muted/50 rounded-xl animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );

  const TableSkeleton = () => (
    <Card className="premium-card border-border/50">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                {[1, 2, 3, 4, 5].map((i) => (
                  <th key={i} className="px-6 py-4">
                    <div className="h-4 bg-muted/50 rounded animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((row) => (
                <tr key={row} className="border-b border-border/50">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-muted/50 rounded animate-pulse w-32" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-muted/50 rounded animate-pulse w-24" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-muted/50 rounded-full animate-pulse w-20" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-muted/50 rounded-full animate-pulse w-24" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <div className="h-9 w-9 bg-muted/50 rounded-lg animate-pulse" />
                      <div className="h-9 w-9 bg-muted/50 rounded-lg animate-pulse" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <div className="py-3.5 w-48 bg-muted/50 rounded-lg animate-pulse mb-3" />
            <div className="h-4 w-96 bg-muted/50 rounded animate-pulse" />
          </div>
          <div className="h-11 w-32 bg-muted/50 rounded-xl animate-pulse" />
        </div>

        {/* Filters Skeleton */}
        <FiltersSkeleton />

        {/* Table Skeleton */}
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header - Clean & Minimal */}
      <div className="relative">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-lime-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="relative flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Package className="w-6 h-6 text-lime-400 dark:text-lime-400 light:text-lime-500" />
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">Inventory</h1>
            </div>
            <p className="text-muted-foreground text-sm ml-9">
              Manage your food items and track expiration dates
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className={cn(
              "gap-2 py-3.5 px-5 text-sm font-medium transition-all duration-300",
              showForm 
                ? "bg-muted/50 text-foreground border-2 border-border hover:bg-muted hover:border-lime-500/50" 
                : "bg-gradient-to-r from-lime-500 to-lime-600 text-white hover:from-lime-600 hover:to-lime-700"
            )}
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
      </div>

      {/* Filters Section - Clean */}
      <Card className="premium-card border-border/50 hover:border-lime-500/30 transition-all duration-300">
        <CardContent className="pt-5">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 group-focus-within:text-lime-400 dark:group-focus-within:text-lime-400 light:group-focus-within:text-lime-500 transition-colors" />
                <Input
                  type="text"
                  placeholder="Search by food item name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 !py-3.5 h-auto text-sm font-normal border focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="w-full lg:w-56">
              <select
                id="category-filter"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                className="w-full py-3.5 px-3 bg-card border border-border rounded-lg text-foreground font-normal text-sm focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all capitalize cursor-pointer hover:border-lime-500/50"
              >
                <option value="">All Categories</option>
                {FOOD_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="capitalize">{cat}</option>
                ))}
              </select>
            </div>

            {/* Expiring Soon Toggle */}
            <div className={cn(
              "flex items-center gap-2.5 px-4 py-2.5 rounded-lg border transition-all cursor-pointer group",
              filters.expiring_soon
                ? "bg-orange-500/10 border-orange-500/40 hover:border-orange-500/60 hover:bg-orange-500/15"
                : "bg-muted/20 border-border hover:border-orange-500/40 hover:bg-orange-500/5"
            )}>
              <div className="relative">
                <input
                  type="checkbox"
                  id="expiring_soon"
                  checked={filters.expiring_soon}
                  onChange={(e) => setFilters({ ...filters, expiring_soon: e.target.checked, page: 1 })}
                  className="w-4 h-4 rounded border-2 border-border text-orange-600 focus:ring-2 focus:ring-orange-500/30 focus:ring-offset-0 bg-card cursor-pointer transition-all checked:bg-orange-500 checked:border-orange-500"
                />
                {filters.expiring_soon && (
                  <div className="absolute inset-0 rounded bg-orange-500/20 animate-pulse" />
                )}
              </div>
              <Label 
                htmlFor="expiring_soon" 
                className={cn(
                  "text-sm font-medium cursor-pointer whitespace-nowrap flex items-center gap-1.5 transition-colors",
                  filters.expiring_soon ? "text-orange-400 dark:text-orange-400 light:text-orange-500" : "text-foreground/80 group-hover:text-orange-400 dark:group-hover:text-orange-400 light:group-hover:text-orange-500"
                )}
              >
                <AlertTriangle className={cn(
                  "w-4 h-4 transition-all",
                  filters.expiring_soon && "animate-pulse"
                )} />
                Expiring Soon (7 days)
              </Label>
            </div>

            {/* Clear Filters */}
            {getActiveFilterCount() > 0 && (
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="gap-2 whitespace-nowrap border hover:bg-muted hover:border-lime-500/50 transition-all font-normal text-sm py-3.5"
              >
                <X className="w-3.5 h-3.5" />
                Clear Filters
                <span className="ml-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                  {getActiveFilterCount()}
                </span>
              </Button>
            )}
          </div>

          {/* Active Filters Summary */}
          {getActiveFilterCount() > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.category && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300/90 rounded-lg text-xs font-normal">
                  <Tag className="w-3 h-3" />
                  <span className="capitalize">{filters.category}</span>
                  <button
                    onClick={() => setFilters({ ...filters, category: '', page: 1 })}
                    className="ml-1 hover:text-purple-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.expiring_soon && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500/15 to-orange-500/10 border border-orange-500/30 text-orange-300 rounded-lg text-xs font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                  <span>Expiring within 7 days</span>
                  <button
                    onClick={() => setFilters({ ...filters, expiring_soon: false, page: 1 })}
                    className="ml-1 hover:text-orange-200 transition-colors rounded-full hover:bg-orange-500/20 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.search && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-lime-500/10 border border-lime-500/20 text-lime-300/90 rounded-lg text-xs font-normal">
                  <Search className="w-3 h-3" />
                  Search: {filters.search}
                  <button
                    onClick={() => {
                      setFilters({ ...filters, search: '', page: 1 });
                      setSearchInput('');
                    }}
                    className="ml-1 hover:text-lime-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Item Form */}
      {showForm && (
        <Card className="premium-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-lime-500/20 to-lime-600/10 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-lime-400 dark:text-lime-400 light:text-lime-500" />
              </div>
              <div>
                <CardTitle className="text-foreground text-xl font-semibold">Add Inventory Item</CardTitle>
                <CardDescription className="text-sm font-normal text-muted-foreground/80">Fill in the details to add a new item to your inventory</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="item_name" className="text-foreground font-medium text-sm">Item Name *</Label>
                  <Input
                    id="item_name"
                    type="text"
                    required
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    placeholder="e.g., Tomatoes"
                    className="!py-3.5 h-auto text-sm font-normal border focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-foreground font-medium text-sm">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="e.g., 2.5"
                    className="!py-3.5 h-auto text-sm font-normal border focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-foreground font-medium text-sm">Unit *</Label>
                  <select
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full py-3.5 px-3 bg-card border border-border rounded-lg text-foreground font-normal text-sm focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all cursor-pointer hover:border-lime-500/50"
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-foreground font-medium text-sm">Category *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full py-3.5 px-3 bg-card border border-border rounded-lg text-foreground font-normal text-sm focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all capitalize cursor-pointer hover:border-lime-500/50"
                  >
                    {FOOD_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="capitalize">{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase_date" className="text-foreground font-medium text-sm">Purchase Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="purchase_date"
                        variant="outline"
                        className={cn(
                          "w-full !py-3.5 h-auto justify-start text-left font-normal text-sm border hover:border-lime-500/50 transition-all",
                          !formData.purchase_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {formData.purchase_date ? formatDate(formData.purchase_date) : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.purchase_date ? new Date(formData.purchase_date + 'T00:00:00') : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            setFormData({ ...formData, purchase_date: `${year}-${month}-${day}` });
                          }
                        }}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date > today;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiration_date" className="text-foreground font-medium text-sm">Expiration Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="expiration_date"
                        variant="outline"
                        className={cn(
                          "w-full !py-3.5 h-auto justify-start text-left font-normal text-sm border hover:border-lime-500/50 transition-all",
                          !formData.expiration_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {formData.expiration_date ? formatDate(formData.expiration_date) : "Pick a date (optional)"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.expiration_date ? new Date(formData.expiration_date + 'T00:00:00') : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            setFormData({ ...formData, expiration_date: `${year}-${month}-${day}` });
                          } else {
                            setFormData({ ...formData, expiration_date: '' });
                          }
                        }}
                        disabled={(date) => {
                          if (!formData.purchase_date) return false;
                          const purchaseDate = new Date(formData.purchase_date + 'T00:00:00');
                          purchaseDate.setHours(0, 0, 0, 0);
                          const checkDate = new Date(date);
                          checkDate.setHours(0, 0, 0, 0);
                          return checkDate < purchaseDate;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full md:w-auto gap-2 py-3.5 px-6 text-sm font-medium bg-gradient-to-r from-lime-500 to-lime-600 text-white hover:from-lime-600 hover:to-lime-700 transition-all duration-300"
              >
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
          <Card className="premium-card border-border/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-lime-500/20 to-lime-600/10 rounded-xl flex items-center justify-center">
                    <Pencil className="w-5 h-5 text-lime-400 dark:text-lime-400 light:text-lime-500" />
                  </div>
                  <CardTitle className="text-foreground text-xl font-semibold">Edit Inventory Item</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEditModal(false)}
                  className="hover:bg-muted h-9 w-9"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="edit_item_name" className="text-foreground font-medium text-sm">Item Name *</Label>
                    <Input
                      id="edit_item_name"
                      type="text"
                      required
                      value={editFormData.item_name}
                      onChange={(e) => setEditFormData({ ...editFormData, item_name: e.target.value })}
                      placeholder="e.g., Tomatoes"
                      className="!py-3.5 h-auto text-sm font-normal border focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_quantity" className="text-foreground font-medium text-sm">Quantity *</Label>
                    <Input
                      id="edit_quantity"
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      value={editFormData.quantity}
                      onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                      placeholder="e.g., 2.5"
                      className="!py-3.5 h-auto text-sm font-normal border focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_unit" className="text-foreground font-medium text-sm">Unit *</Label>
                    <select
                      id="edit_unit"
                      value={editFormData.unit}
                      onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                      className="w-full py-3.5 px-3 bg-card border border-border rounded-lg text-foreground font-normal text-sm focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all cursor-pointer hover:border-lime-500/50"
                    >
                      {UNITS.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_category" className="text-foreground font-medium text-sm">Category *</Label>
                    <select
                      id="edit_category"
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      className="w-full py-3.5 px-3 bg-card border border-border rounded-lg text-foreground font-normal text-sm focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all capitalize cursor-pointer hover:border-lime-500/50"
                    >
                      {FOOD_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="capitalize">{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_purchase_date" className="text-foreground font-medium text-sm">Purchase Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="edit_purchase_date"
                          variant="outline"
                          className={cn(
                            "w-full !py-3.5 h-auto justify-start text-left font-normal text-sm border hover:border-lime-500/50 transition-all",
                            !editFormData.purchase_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {editFormData.purchase_date ? formatDate(editFormData.purchase_date) : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editFormData.purchase_date ? new Date(editFormData.purchase_date + 'T00:00:00') : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              setEditFormData({ ...editFormData, purchase_date: `${year}-${month}-${day}` });
                            }
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date > today;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_expiration_date" className="text-foreground font-medium text-sm">Expiration Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="edit_expiration_date"
                          variant="outline"
                          className={cn(
                            "w-full !py-3.5 h-auto justify-start text-left font-normal text-sm border hover:border-lime-500/50 transition-all",
                            !editFormData.expiration_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {editFormData.expiration_date ? formatDate(editFormData.expiration_date) : "Pick a date (optional)"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editFormData.expiration_date ? new Date(editFormData.expiration_date + 'T00:00:00') : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              setEditFormData({ ...editFormData, expiration_date: `${year}-${month}-${day}` });
                            } else {
                              setEditFormData({ ...editFormData, expiration_date: '' });
                            }
                          }}
                          disabled={(date) => {
                            if (!editFormData.purchase_date) return false;
                            const purchaseDate = new Date(editFormData.purchase_date + 'T00:00:00');
                            purchaseDate.setHours(0, 0, 0, 0);
                            const checkDate = new Date(date);
                            checkDate.setHours(0, 0, 0, 0);
                            return checkDate < purchaseDate;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="py-3.5 px-5 text-sm font-medium border hover:bg-muted hover:border-lime-500/50 transition-all"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="gap-2 py-3.5 px-6 text-sm font-medium bg-gradient-to-r from-lime-500 to-lime-600 text-white hover:from-lime-600 hover:to-lime-700 transition-all duration-300"
                  >
                    <Pencil className="w-4 h-4" />
                    Update Item
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inventory Table */}
      <Card className="premium-card border-border/50">
        {inventory.length === 0 ? (
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 bg-gray-800/50 dark:bg-gray-800/50 light:bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {getActiveFilterCount() > 0 ? (
                <Filter className="w-8 h-8 text-muted-foreground/70" />
              ) : (
                <Package className="w-8 h-8 text-muted-foreground/70" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {getActiveFilterCount() > 0 ? 'No Results Found' : 'No Inventory Items'}
            </h3>
            <p className="text-muted-foreground text-sm font-normal">
              {getActiveFilterCount() > 0 
                ? 'Try adjusting your filters to see more results' 
                : 'Add your first item to start tracking your food inventory'
              }
            </p>
            {getActiveFilterCount() > 0 && (
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="mt-4 gap-2 border hover:bg-muted hover:border-lime-500/50 transition-all font-normal text-sm py-3.5"
              >
                <X className="w-3.5 h-3.5" />
                Clear All Filters
              </Button>
            )}
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800 dark:divide-gray-800 light:divide-gray-200">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Item Details
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Quantity
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Category
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Expiration
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {inventory.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-foreground text-sm">{item.item_name}</div>
                      {item.purchase_date && (
                        <div className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1 font-normal">
                          Purchased {formatDate(item.purchase_date)}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-foreground/90">
                        <Package className="w-3.5 h-3.5 text-lime-400 dark:text-lime-400 light:text-lime-500" />
                        <span className="font-normal text-sm">{parseFloat(item.quantity).toFixed(2)} {item.unit}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-purple-400 dark:text-purple-400 light:text-purple-600" />
                        <span className="capitalize text-foreground/90 font-normal text-sm">{item.category}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {item.expiration_date ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                              item.is_expired 
                                ? 'badge-red' 
                                : item.is_expiring 
                                ? 'badge-orange' 
                                : 'badge-green'
                            }`}>
                              {item.is_expiring && (
                                <AlertTriangle className="w-3 h-3 animate-pulse" />
                              )}
                              {item.is_expired && (
                                <AlertTriangle className="w-3 h-3" />
                              )}
                              {formatDate(item.expiration_date)}
                            </span>
                            {item.is_expiring && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 dark:text-orange-400 light:text-orange-500 rounded text-xs font-medium">
                                Urgent
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 font-normal">
                            <CalendarIcon className="w-3 h-3" />
                            <span>{formatExpirationDate(item.expiration_date)}</span>
                            {item.days_until_expiration !== undefined && (
                              <span className="ml-1 px-1.5 py-0.5 bg-muted/50 rounded text-xs">
                                {item.days_until_expiration} {item.days_until_expiration === 1 ? 'day' : 'days'}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs font-normal">No expiration</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleEdit(item)}
                          variant="ghost"
                          size="sm"
                          className="group relative h-8 px-2.5 text-purple-400 dark:text-purple-400 light:text-purple-500 hover:text-purple-300 dark:hover:text-purple-300 light:hover:text-purple-400 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 rounded-lg transition-all duration-200 gap-1.5 font-normal text-xs"
                        >
                          <Pencil className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          onClick={() => handleDelete(item.id)}
                          variant="ghost"
                          size="sm"
                          className="group relative h-8 px-2.5 text-red-400 dark:text-red-400 light:text-red-500 hover:text-red-300 dark:hover:text-red-300 light:hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition-all duration-200 gap-1.5 font-normal text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                          <span>Delete</span>
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
            variant="outline"
            size="icon"
            className="py-3.5 w-10 rounded-full border-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted hover:border-lime-500/50 transition-all"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-muted-foreground font-normal text-sm">
            Page {pagination.currentPage} of {pagination.lastPage}
            {pagination.total > 0 && ` • ${pagination.total} total items`}
          </span>
          <Button
            onClick={() => setFilters({ ...filters, page: pagination.currentPage + 1 })}
            disabled={pagination.currentPage === pagination.lastPage}
            variant="outline"
            size="icon"
            className="py-3.5 w-10 rounded-full border-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted hover:border-lime-500/50 transition-all"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
