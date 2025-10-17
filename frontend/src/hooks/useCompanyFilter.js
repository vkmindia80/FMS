import { useMemo } from 'react';
import { useSuperAdmin } from '../contexts/SuperAdminContext';

/**
 * Custom hook to get company filter params for API calls
 * Returns an object with company_id that can be spread into API params
 * 
 * Usage:
 * const companyFilter = useCompanyFilter();
 * const response = await api.get('/transactions', { params: { ...companyFilter, ...otherParams } });
 */
export const useCompanyFilter = () => {
  const { selectedCompanyId } = useSuperAdmin();
  
  return useMemo(() => {
    // Only include company_id if a specific company is selected
    // Omit it for "All Companies" view (null/undefined)
    return selectedCompanyId ? { company_id: selectedCompanyId } : {};
  }, [selectedCompanyId]);
};

export default useCompanyFilter;
