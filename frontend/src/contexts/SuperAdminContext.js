import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from './AuthContext';

const SuperAdminContext = createContext();

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
};

export const SuperAdminProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if user is Super Admin
  useEffect(() => {
    const checkSuperAdminStatus = async () => {
      if (!isAuthenticated || !user) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const response = await adminAPI.checkSuperAdmin();
        setIsSuperAdmin(response.is_superadmin);
        
        // If user is Super Admin, fetch all companies
        if (response.is_superadmin) {
          const companiesData = await adminAPI.getAllCompanies();
          setCompanies(companiesData);
        }
      } catch (error) {
        console.error('Error checking Super Admin status:', error);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkSuperAdminStatus();
  }, [user, isAuthenticated]);

  // Reset selected company when user changes
  useEffect(() => {
    setSelectedCompanyId(null);
  }, [user]);

  const selectCompany = (companyId) => {
    setSelectedCompanyId(companyId);
  };

  const clearCompanySelection = () => {
    setSelectedCompanyId(null);
  };

  const getSelectedCompanyName = () => {
    if (!selectedCompanyId) return 'All Companies';
    const company = companies.find(c => c.id === selectedCompanyId);
    return company ? company.name : 'Unknown Company';
  };

  const refreshCompanies = async () => {
    if (!isSuperAdmin) return;
    
    try {
      const companiesData = await adminAPI.getAllCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error refreshing companies:', error);
    }
  };

  const value = {
    isSuperAdmin,
    selectedCompanyId,
    companies,
    loading,
    selectCompany,
    clearCompanySelection,
    getSelectedCompanyName,
    refreshCompanies,
  };

  return (
    <SuperAdminContext.Provider value={value}>
      {children}
    </SuperAdminContext.Provider>
  );
};
