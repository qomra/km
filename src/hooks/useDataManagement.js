import { useState, useEffect, useCallback } from 'react';

// Environment-aware URL configuration
const isProduction = process.env.NODE_ENV === 'production';
const BASE_URL = isProduction ? '' : 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;
const ASSETS_URL = BASE_URL;

/**
 * Custom hook for managing data loading and saving
 * This handles loading resources, dataset, and AI data from JSON files
 * and provides methods for saving data
 * 
 * Uses environment-aware URLs that work both in development (localhost) and production (AWS)
 */
export const useDataManagement = () => {
  // State for data sources
  const [resources, setResources] = useState({});
  const [dataset, setDataset] = useState({});
  const [aiData, setAiData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Load data from JSON files on initial mount
  useEffect(() => {
    const loadData = async () => {
      if (initialized) return;
      
      try {
        setLoading(true);
        
        // Load resources.json (contains roots and their contexts)
        try {
          // Try the API endpoint first (using environment-aware URL)
          const resourcesResponse = await fetch(`${API_URL}/get-resources`);
          if (!resourcesResponse.ok) {
            throw new Error(`Failed to load resources from API: ${resourcesResponse.status}`);
          }
          const resourcesData = await resourcesResponse.json();
          setResources(resourcesData);
        } catch (apiErr) {
          try {
            // Fall back to static file route (using environment-aware URL)
            const resourcesResponse = await fetch(`${ASSETS_URL}/assets/data/resources.json`);
            if (!resourcesResponse.ok) {
              throw new Error(`Failed to load resources from static path: ${resourcesResponse.status}`);
            }
            const resourcesData = await resourcesResponse.json();
            setResources(resourcesData);
          } catch (err) {
            // Error handling without logging for performance
            setError(prev => ({ ...prev, resources: err.message }));
          }
        }
        
        // Load dataset.json (previously saved data)
        try {
          // Try the API endpoint first (using environment-aware URL)
          const datasetResponse = await fetch(`${API_URL}/get-dataset`);
          if (datasetResponse.ok) {
            const datasetData = await datasetResponse.json();
            setDataset(datasetData);
          } else {
            // Fall back to static file route
            try {
              const staticResponse = await fetch(`${ASSETS_URL}/assets/data/dataset.json`);
              if (staticResponse.ok) {
                const staticData = await staticResponse.json();
                setDataset(staticData);
              } else {
                // If server file isn't available, try localStorage
                const localData = localStorage.getItem('arabicRootsDataset');
                if (localData) {
                  setDataset(JSON.parse(localData));
                } else {
                  // If no data exists, start with empty dataset
                  setDataset({});
                }
              }
            } catch (staticErr) {
              // If server file isn't available, try localStorage
              const localData = localStorage.getItem('arabicRootsDataset');
              if (localData) {
                setDataset(JSON.parse(localData));
              } else {
                // If no data exists, start with empty dataset
                setDataset({});
              }
            }
          }
        } catch (err) {
          // Error handling without logging for performance
          setError(prev => ({ ...prev, dataset: err.message }));
          
          // Try localStorage as fallback
          try {
            const localData = localStorage.getItem('arabicRootsDataset');
            if (localData) {
              setDataset(JSON.parse(localData));
            }
          } catch (localErr) {
            // Error handling without logging for performance
          }
        }
        
        // Load spectrum.json (AI data)
        try {
          // Try API endpoint first (using environment-aware URL)
          const aiResponse = await fetch(`${API_URL}/get-spectrum`);
          if (!aiResponse.ok) {
            throw new Error(`Failed to load AI data from API: ${aiResponse.status}`);
          }
          const aiData = await aiResponse.json();
          setAiData(aiData);
        } catch (apiErr) {
          try {
            // Fall back to static file route
            const staticAiResponse = await fetch(`${ASSETS_URL}/assets/data/spectrum.json`);
            if (!staticAiResponse.ok) {
              throw new Error(`Failed to load AI data from static path: ${staticAiResponse.status}`);
            }
            const staticAiData = await staticAiResponse.json();
            setAiData(staticAiData);
          } catch (err) {
            // Error handling without logging for performance
            setError(prev => ({ ...prev, aiData: err.message }));
          }
        }
        
        setInitialized(true);
      } catch (err) {
        // Error handling without logging for performance
        setError(prev => ({ ...prev, general: err.message }));
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [initialized]);
  
  // Save dataset to localStorage
  const saveToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem('arabicRootsDataset', JSON.stringify(dataset));
      return true;
    } catch (err) {
      // Error handling without logging for performance
      setError(prev => ({ ...prev, save: err.message }));
      return false;
    }
  }, [dataset]);
  
  // Save dataset to server
  const saveToServer = useCallback(async () => {
    try {
      // Make API call to backend for saving dataset
      const response = await fetch(`${API_URL}/save-dataset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataset),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save to server: ${response.status}`);
      }
      
      const result = await response.json();
      return result.success;
    } catch (err) {
      // Error handling without logging for performance
      setError(prev => ({ ...prev, save: err.message }));
      return false;
    }
  }, [dataset]);
  
  // Save data (to localStorage and server)
  const saveData = useCallback(async () => {
    const localSuccess = saveToLocalStorage();
    
    // Also save to server
    const serverSuccess = await saveToServer();
    
    return localSuccess && serverSuccess;
  }, [saveToLocalStorage, saveToServer]);
  
  // Auto-save to localStorage when dataset changes
  useEffect(() => {
    if (!initialized || Object.keys(dataset).length === 0) return;
    
    // Using a debounce to prevent excessive saves
    const timeoutId = setTimeout(() => {
      saveToLocalStorage();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [dataset, initialized, saveToLocalStorage]);
  
  return {
    // Data
    resources,
    dataset,
    setDataset,
    aiData,
    
    // Status
    loading,
    error,
    initialized,
    
    // Actions
    saveData,
    saveToLocalStorage,
    saveToServer
  };
};

export default useDataManagement;