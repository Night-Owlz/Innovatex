import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function getExpirationBadgeClasses(expirationDate) {
  if (!expirationDate) return 'badge-teal';

  const today = new Date();
  const expDate = new Date(expirationDate);
  const daysUntilExpiration = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiration < 0) return 'badge-red';
  if (daysUntilExpiration <= 3) return 'badge-orange';
  if (daysUntilExpiration <= 7) return 'badge-yellow';
  return 'badge-green';
}

export function formatExpirationDate(expirationDate) {
  if (!expirationDate) return 'No expiration';

  const today = new Date();
  const expDate = new Date(expirationDate);
  const daysUntilExpiration = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiration < 0) {
    return `Expired ${Math.abs(daysUntilExpiration)} days ago`;
  }
  if (daysUntilExpiration === 0) return 'Expires today';
  if (daysUntilExpiration === 1) return 'Expires tomorrow';
  if (daysUntilExpiration <= 7) return `Expires in ${daysUntilExpiration} days`;

  return formatDate(expirationDate);
}

export function parsePaginatedResponse(response) {
  // Handle API response structure: { success, message, data, pagination }
  if (response?.pagination) {
    return {
      data: response.data || [],
      pagination: response.pagination
    };
  }
  
  // Handle nested data structure
  if (response?.data) {
    return {
      data: response.data.data || response.data,
      pagination: response.data.pagination || {
        currentPage: response.data.current_page || 1,
        lastPage: response.data.last_page || 1,
        total: response.data.total || 0,
        perPage: response.data.per_page || 10
      }
    };
  }

  // Fallback for simple array responses
  return {
    data: Array.isArray(response) ? response : [],
    pagination: {
      currentPage: 1,
      lastPage: 1,
      total: Array.isArray(response) ? response.length : 0,
      perPage: Array.isArray(response) ? response.length : 10
    }
  };
}
