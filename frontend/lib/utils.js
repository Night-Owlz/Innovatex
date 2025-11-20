export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

export function getDaysUntilExpiration(expirationDate) {
  if (!expirationDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expirationDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function isExpiringSoon(expirationDate, days = 3) {
  const daysUntil = getDaysUntilExpiration(expirationDate);
  return daysUntil !== null && daysUntil >= 0 && daysUntil <= days;
}

export function isExpired(expirationDate) {
  const daysUntil = getDaysUntilExpiration(expirationDate);
  return daysUntil !== null && daysUntil < 0;
}

/**
 * Get expiration status matching backend DateHelper
 * @param {string} expirationDate 
 * @returns {'expired'|'critical'|'warning'|'fresh'}
 */
export function getExpirationStatus(expirationDate) {
  const days = getDaysUntilExpiration(expirationDate);
  
  if (days === null) return 'fresh';
  if (days < 0) return 'expired';
  if (days <= 1) return 'critical';
  if (days <= 3) return 'warning';
  return 'fresh';
}

/**
 * Get CSS classes for expiration status badge
 */
export function getExpirationBadgeClasses(expirationDate) {
  const status = getExpirationStatus(expirationDate);
  
  const classes = {
    expired: 'bg-red-100 text-red-800 border-red-200',
    critical: 'bg-orange-100 text-orange-800 border-orange-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    fresh: 'bg-green-100 text-green-800 border-green-200',
  };
  
  return classes[status] || classes.fresh;
}

/**
 * Format expiration date with contextual text
 */
export function formatExpirationDate(expirationDate) {
  const days = getDaysUntilExpiration(expirationDate);
  
  if (days === null) return 'No expiration date';
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  return `Expires in ${days} days`;
}

/**
 * Parse Laravel paginated response
 */
export function parsePaginatedResponse(response) {
  // Handle both meta (Laravel default) and pagination (custom) structures
  const paginationData = response?.pagination || response?.meta || {};
  
  return {
    data: response?.data || [],
    pagination: {
      currentPage: paginationData?.current_page || paginationData?.currentPage || 1,
      lastPage: paginationData?.last_page || paginationData?.lastPage || 1,
      perPage: paginationData?.per_page || paginationData?.perPage || 15,
      total: paginationData?.total || 0,
      from: paginationData?.from || 0,
      to: paginationData?.to || 0,
    },
    links: response?.links || {},
  };
}
