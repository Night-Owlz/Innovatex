'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function RecommendationsWidget() {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await api.getRecommendations();
        setRecommendations(response?.data || response);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations || Object.keys(recommendations).length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Smart Recommendations
      </h2>

      <div className="space-y-6">
        {/* Waste Reduction Tips */}
        {recommendations.waste_reduction && recommendations.waste_reduction.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <span className="mr-2">♻️</span> Waste Reduction
            </h3>
            <ul className="space-y-2">
              {recommendations.waste_reduction.map((tip, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Budget Tips */}
        {recommendations.budget_tips && recommendations.budget_tips.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <span className="mr-2">💰</span> Budget Optimization
            </h3>
            <ul className="space-y-2">
              {recommendations.budget_tips.map((tip, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Storage Tips */}
        {recommendations.storage_tips && recommendations.storage_tips.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <span className="mr-2">📦</span> Storage Tips
            </h3>
            <ul className="space-y-2">
              {recommendations.storage_tips.map((tip, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Meal Planning */}
        {recommendations.meal_planning && recommendations.meal_planning.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <span className="mr-2">🍽️</span> Meal Planning
            </h3>
            <ul className="space-y-2">
              {recommendations.meal_planning.map((tip, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Resources */}
        {recommendations.resources && recommendations.resources.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Helpful Resources
            </h3>
            <div className="space-y-2">
              {recommendations.resources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{resource.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{resource.description}</p>
                      {resource.reason && (
                        <p className="text-xs text-green-700 mt-1">
                          <span className="font-medium">Why:</span> {resource.reason}
                        </p>
                      )}
                    </div>
                    <span className="ml-2 text-xs text-green-600">→</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {(recommendations.expiring_items_count > 0 || recommendations.total_items > 0) && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            {recommendations.total_items > 0 && (
              <span className="text-gray-600">
                Total items: <strong>{recommendations.total_items}</strong>
              </span>
            )}
            {recommendations.expiring_items_count > 0 && (
              <span className="text-orange-600">
                Expiring soon: <strong>{recommendations.expiring_items_count}</strong>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
