import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, Package, Pill } from 'lucide-react';
import { createNumericInputHandler, VALIDATION_OPTIONS } from '../utils/inputValidation';

const UnitSelector = ({
  medicine,
  onUnitChange,
  defaultUnit = 'strip',
  defaultQuantity = 1,
  showQuantityInput = true,
  className = ''
}) => {
  const [selectedUnit, setSelectedUnit] = useState(defaultUnit);
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [isOpen, setIsOpen] = useState(false);

  // Memoize available units to prevent recalculation on every render
  const availableUnits = useMemo(() => {
    if (!medicine?.unitTypes) {
      return [{ value: 'units', label: 'Units', icon: Pill }];
    }

    const units = [];

    if (medicine.unitTypes.hasStrips) {
      const stripPrice = medicine.stripInfo?.sellingPrice || 0;
      units.push({
        value: 'strip',
        label: 'Strips',
        icon: Package,
        conversion: medicine.unitTypes.unitsPerStrip || 10,
        price: stripPrice
      });
    }

    if (medicine.unitTypes.hasIndividual) {
      const individualPrice = medicine.individualInfo?.sellingPrice || 0;
      units.push({
        value: 'individual',
        label: 'Individual',
        icon: Pill,
        conversion: 1,
        price: individualPrice
      });
    }

    return units.length > 0 ? units : [{ value: 'units', label: 'Units', icon: Pill }];
  }, [medicine?.unitTypes, medicine?.stripInfo?.sellingPrice, medicine?.individualInfo?.sellingPrice]);

  const currentUnit = useMemo(() =>
    availableUnits.find(unit => unit.value === selectedUnit) || availableUnits[0],
    [availableUnits, selectedUnit]
  );

  // Initialize selected unit based on available units
  useEffect(() => {
    if (availableUnits.length > 0) {
      const validUnit = availableUnits.find(unit => unit.value === defaultUnit);
      if (!validUnit) {
        setSelectedUnit(availableUnits[0].value);
      }
    }
  }, [availableUnits, defaultUnit]);

  // Create stable unit data object
  const unitData = useMemo(() => ({
    value: currentUnit.value,
    label: currentUnit.label,
    conversion: currentUnit.conversion,
    price: currentUnit.price
  }), [currentUnit.value, currentUnit.label, currentUnit.conversion, currentUnit.price]);

  useEffect(() => {
    // Debounce the unit change notification to prevent excessive updates
    const timeoutId = setTimeout(() => {
      if (onUnitChange) {
        onUnitChange({
          unit: selectedUnit,
          quantity: quantity,
          unitData: unitData
        });
      }
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [selectedUnit, quantity, onUnitChange, unitData]);

  const handleUnitChange = useCallback((unitValue) => {
    setSelectedUnit(unitValue);
    setIsOpen(false);
  }, []);

  const handleQuantityChange = useCallback(
    createNumericInputHandler(
      setQuantity,
      null,
      { ...VALIDATION_OPTIONS.QUANTITY, min: 1 }
    ),
    []
  );

  // If only one unit type available, show simplified view
  if (availableUnits.length === 1) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showQuantityInput && (
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={handleQuantityChange}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        )}
        <div className="flex items-center text-sm text-gray-600">
          <currentUnit.icon className="h-4 w-4 mr-1" />
          <span>{currentUnit.label}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-2">
        {showQuantityInput && (
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={handleQuantityChange}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        )}
        
        {/* Unit Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <currentUnit.icon className="h-4 w-4 mr-1" />
            <span>{currentUnit.label}</span>
            <ChevronDown className="h-3 w-3 ml-1" />
          </button>

          {isOpen && (
            <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg">
              {availableUnits.map((unit) => (
                <button
                  key={unit.value}
                  type="button"
                  onClick={() => handleUnitChange(unit.value)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                    selectedUnit === unit.value ? 'bg-green-50 text-green-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <unit.icon className="h-4 w-4 mr-2" />
                    <span>{unit.label}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {unit.conversion > 1 && (
                      <span>1 = {unit.conversion} units</span>
                    )}
                    {unit.price > 0 && (
                      <div>₹{unit.price.toFixed(2)}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conversion Info */}
      {currentUnit.conversion > 1 && (
        <div className="mt-1 text-xs text-gray-500">
          {quantity} {currentUnit.label.toLowerCase()} = {quantity * currentUnit.conversion} individual units
        </div>
      )}
    </div>
  );
};

export default UnitSelector;
