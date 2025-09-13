import React from 'react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';
import MedicineLocationSearch from '../components/rack-management/MedicineLocationSearch';

const StaffMedicineSearch = () => {
  return (
    <StoreManagerLayout>
      <div className="max-w-6xl mx-auto">
        <MedicineLocationSearch isStaffView={true} />
      </div>
    </StoreManagerLayout>
  );
};

export default StaffMedicineSearch;
