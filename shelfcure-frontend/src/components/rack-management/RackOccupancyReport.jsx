import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Package, 
  BarChart3, 
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Grid,
  MapPin
} from 'lucide-react';
import { getRackOccupancy, getRackCategoryColor } from '../../services/rackService';

const RackOccupancyReport = ({ onBack }) => {
  const [occupancyData, setOccupancyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOccupancyData();
  }, []);

  const fetchOccupancyData = async () => {
    try {
      setLoading(true);
      const response = await getRackOccupancy();
      setOccupancyData(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching occupancy data:', err);
      setError(err.message || 'Failed to fetch occupancy data');
    } finally {
      setLoading(false);
    }
  };

  const getOccupancyColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 50) return 'text-blue-600 bg-blue-100';
    return 'text-green-600 bg-green-100';
  };

  const getOccupancyStatus = (percentage) => {
    if (percentage >= 90) return { label: 'Critical', icon: AlertCircle, color: 'text-red-600' };
    if (percentage >= 70) return { label: 'High', icon: Clock, color: 'text-yellow-600' };
    if (percentage >= 50) return { label: 'Moderate', icon: TrendingUp, color: 'text-blue-600' };
    return { label: 'Low', icon: CheckCircle, color: 'text-green-600' };
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading occupancy data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 text-left">Rack Occupancy Report</h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { summary, racks } = occupancyData;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md mr-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 text-left">Rack Occupancy Report</h1>
          <p className="mt-2 text-sm text-gray-700 text-left">
            Overview of rack utilization and storage capacity across your store
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Grid className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Racks</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary.totalRacks}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Positions</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary.totalPositions}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Occupied</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary.occupiedPositions}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className={`h-8 w-8 ${getOccupancyStatus(summary.overallOccupancy).color}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Overall Occupancy</dt>
                  <dd className={`text-lg font-medium ${getOccupancyStatus(summary.overallOccupancy).color}`}>
                    {summary.overallOccupancy}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rack Details */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Rack Details</h3>
          
          <div className="space-y-4">
            {racks.map((rackData, index) => {
              const { rack, occupancy, medicines } = rackData;
              const status = getOccupancyStatus(occupancy.occupancyPercentage);
              const StatusIcon = status.icon;

              return (
                <div key={rack.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 text-left">{rack.name}</h4>
                        <p className="text-sm text-gray-500 text-left">Rack #{rack.rackNumber}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRackCategoryColor(rack.category)}`}>
                        {rack.category}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOccupancyColor(occupancy.occupancyPercentage)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{occupancy.totalPositions}</div>
                      <div className="text-sm text-gray-500">Total Positions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{occupancy.occupiedPositions}</div>
                      <div className="text-sm text-gray-500">Occupied</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${status.color}`}>
                        {occupancy.occupancyPercentage}%
                      </div>
                      <div className="text-sm text-gray-500">Occupancy</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Capacity Utilization</span>
                      <span>{occupancy.occupiedPositions} / {occupancy.totalPositions}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          occupancy.occupancyPercentage >= 90 ? 'bg-red-500' :
                          occupancy.occupancyPercentage >= 70 ? 'bg-yellow-500' :
                          occupancy.occupancyPercentage >= 50 ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${occupancy.occupancyPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Medicines in this rack */}
                  {medicines && medicines.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2 text-left">
                        Medicines ({medicines.length})
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {medicines.slice(0, 4).map((medicine, medIndex) => (
                          <div key={medIndex} className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="font-medium">{medicine.name}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {medicine.location} • {medicine.quantity.strips}s/{medicine.quantity.individual}u
                            </div>
                          </div>
                        ))}
                        {medicines.length > 4 && (
                          <div className="text-xs text-gray-500 text-center md:col-span-2">
                            +{medicines.length - 4} more medicines
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {summary.overallOccupancy > 80 && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 text-left">High Occupancy Alert</h3>
              <div className="mt-2 text-sm text-yellow-700 text-left">
                <p>Your racks are {summary.overallOccupancy}% occupied. Consider:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Creating additional racks for overflow storage</li>
                  <li>Reorganizing medicines to optimize space usage</li>
                  <li>Moving slow-moving medicines to secondary locations</li>
                  <li>Reviewing inventory levels to reduce excess stock</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RackOccupancyReport;
