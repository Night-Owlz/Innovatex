'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Filter, Package, Tag, Calendar, Check, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [markingUsed, setMarkingUsed] = useState({});

  useEffect(() => {
    fetchAlerts();
  }, []);

  const applyFilters = () => {
    let filtered = [...alerts];

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Risk level filter
    if (riskFilter !== 'all') {
      if (riskFilter === 'critical') {
        filtered = filtered.filter(item => item.riskScore >= 70);
      } else if (riskFilter === 'warning') {
        filtered = filtered.filter(item => item.riskScore >= 50 && item.riskScore < 70);
      }
    }

    setFilteredAlerts(filtered);
  };

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts, categoryFilter, riskFilter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/ai/expiration-risks');
      const items = response.data.items || response.data || [];
      setAlerts(items);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(items.map(item => item.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.response?.data?.message || 'Failed to fetch expiration alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 70) return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (score >= 50) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    return 'text-green-500 bg-green-500/10 border-green-500/30';
  };

  const getRiskBadgeColor = (score) => {
    if (score >= 70) return 'bg-red-500 text-white';
    if (score >= 50) return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white';
  };

  const getRiskLevel = (score) => {
    if (score >= 70) return 'Critical';
    if (score >= 50) return 'Warning';
    return 'OK';
  };

  const markAsUsed = async (item) => {
    try {
      setMarkingUsed(prev => ({ ...prev, [item.id]: true }));
      
      // Update inventory to reduce quantity by 1 or mark as consumed
      await api.put(`/inventory/${item.id}`, {
        quantity: Math.max(0, item.quantity - 1),
      });

      // Refresh alerts
      await fetchAlerts();
    } catch (err) {
      console.error('Error marking item as used:', err);
      alert('Failed to mark item as used. Please try again.');
    } finally {
      setMarkingUsed(prev => ({ ...prev, [item.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-lime-500 border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading expiration alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Unable to Load Alerts</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={fetchAlerts}
            className="px-6 py-3 bg-lime-500 text-white rounded-lg hover:bg-lime-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-lime-400 to-emerald-500 bg-clip-text text-transparent">
            Expiration Alerts
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor items at risk of expiration
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold">{filteredAlerts.length}</span>
          <span>of {alerts.length} items</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-lime-500" />
          <h3 className="font-semibold text-sm">Filters</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category} className="capitalize">
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Risk Level</label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-4 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
            >
              <option value="all">All Levels</option>
              <option value="critical">Critical (70-100)</option>
              <option value="warning">Warning (50-69)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-card border rounded-lg overflow-hidden">
        {filteredAlerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Item</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Quantity</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Expiry</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Risk</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Recommendation</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-semibold">{alert.item}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-500 rounded-full text-xs capitalize">
                        <Tag className="h-3 w-3" />
                        {alert.category}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm">{alert.quantity} {alert.unit}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className={alert.daysUntilExpiry < 0 ? 'text-red-500 font-semibold' : ''}>
                          {alert.daysUntilExpiry < 0 ? 'Expired' : `${alert.daysUntilExpiry} days`}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskBadgeColor(alert.riskScore)}`}>
                          {alert.riskScore}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {getRiskLevel(alert.riskScore)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <p className="text-xs text-muted-foreground italic line-clamp-2">
                        {alert.recommendation}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => markAsUsed(alert)}
                        disabled={markingUsed[alert.id]}
                        className="flex items-center gap-1 px-3 py-1.5 bg-lime-500/10 text-lime-500 hover:bg-lime-500/20 rounded-lg transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {markingUsed[alert.id] ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Mark Used</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Alerts Found</h3>
            <p className="text-muted-foreground">
              {categoryFilter !== 'all' || riskFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'All items are in good condition!'}
            </p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <div 
              key={alert.id}
              className={`bg-card border rounded-lg p-5 ${getRiskColor(alert.riskScore)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{alert.item}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-500 rounded-full text-xs capitalize">
                      <Tag className="h-3 w-3" />
                      {alert.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {alert.quantity} {alert.unit}
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskBadgeColor(alert.riskScore)} flex-shrink-0`}>
                  {alert.riskScore}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className={alert.daysUntilExpiry < 0 ? 'text-red-500 font-semibold' : ''}>
                    {alert.daysUntilExpiry < 0 ? 'Expired' : `Expires in ${alert.daysUntilExpiry} days`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Risk Level: <span className="font-semibold">{getRiskLevel(alert.riskScore)}</span>
                  </span>
                </div>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg mb-3">
                <p className="text-xs text-muted-foreground italic">
                  💡 {alert.recommendation}
                </p>
              </div>

              <button
                onClick={() => markAsUsed(alert)}
                disabled={markingUsed[alert.id]}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-lime-500/10 text-lime-500 hover:bg-lime-500/20 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {markingUsed[alert.id] ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Mark as Used</span>
                  </>
                )}
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-card border rounded-lg">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Alerts Found</h3>
            <p className="text-muted-foreground">
              {categoryFilter !== 'all' || riskFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'All items are in good condition!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
