import React from 'react';
import { RefreshCw, Download, MoreVertical } from 'lucide-react';

const ChartContainer = ({ 
  title, 
  subtitle,
  children, 
  loading = false, 
  onRefresh, 
  onExport,
  showActions = true,
  height = 'h-64',
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            {subtitle && <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>}
          </div>
          {showActions && (
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          )}
        </div>
        <div className={`${height} bg-gray-100 rounded animate-pulse flex items-center justify-center`}>
          <div className="text-gray-400">Loading chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 text-left">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1 text-left">{subtitle}</p>
          )}
        </div>
        {showActions && (
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Export"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      <div className={height}>
        {children}
      </div>
    </div>
  );
};

export default ChartContainer;
