import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { splitByPeriod } from "../utils/textProcessing";
import { getRelatedWords, ARABIC_PUNCTUATION, highlightConjugations } from "../utils/arabicUtils";

// Use environment variables with proper fallbacks for production and development
const isProduction = process.env.NODE_ENV === 'production';
// Base URL for API endpoints - empty in production (relative), full URL in development
const BASE_URL = isProduction ? '' : 'http://localhost:3001';
// API URL builds on the BASE_URL
const API_URL = `${BASE_URL}/api`;
// Assets URL for static files
const ASSETS_URL = BASE_URL;

// Remove verbose logging

// Create context
const DataContext = createContext();

// Custom hook to use the data context
export const useDataContext = () => useContext(DataContext);

// Data provider component
export const DataProvider = ({ children }) => {
  // State for data sources
  const [resources, setResources] = useState({});
  const [dataset, setDataset] = useState({});
  const [aiData, setAiData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataLoadingStatus, setDataLoadingStatus] = useState({
    resources: 'pending',
    dataset: 'pending',
    aiData: 'pending'
  });
  

  // Application state
  const [mojam, setMojam] = useState("لسان العرب"); // Default dictionary
  const [roots, setRoots] = useState([]);
  const [currentRootIndex, setCurrentRootIndex] = useState(0);
  const [currentRoot, setCurrentRoot] = useState("");
  const [currentText, setCurrentText] = useState("");
  const [aiContent, setAiContent] = useState("");
  const [currentWords, setCurrentWords] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [sortType, setSortType] = useState("length"); // "default", "alpha", or "length"

  // Load data from JSON files
  useEffect(() => {
    // Removed logging for better performance
    const loadData = async () => {
      setLoading(true);
      
      try {
        // Try to load resources first
        const basePath = await loadResources();
        
        // If resources failed to load, stop loading other data
        if (basePath !== true) {
          // Removed logging for performance;
          setLoading(false);
          return;
        }
        
        // Removed logging for performance;
        
        // Load both dataset and AI data concurrently
        const [datasetResult, aiDataResult] = await Promise.all([
          loadDataset(), // No need to pass basePath
          loadAiData()   // No need to pass basePath
        ]);
        
        if (datasetResult) {
          // Removed logging for performance;
        } else {
          // Removed logging for performance;
        }
        
        if (aiDataResult) {
          // Removed logging for performance;
        } else {
          // Removed logging for performance;
        }
        
        // Removed logging for performance;
      } catch (err) {
        // Removed error logging for performance;
        setError("Error loading data: " + err.message);
      } finally {
        // Removed logging for performance;
        setLoading(false);
      }
    };
    
    // Helper function to load resources - single-copy architecture
    const loadResources = async () => {
      try {
        setDataLoadingStatus(prev => ({ ...prev, resources: 'loading' }));
        
        // Try multiple approaches to load resources
        let resourcesData = null;
        let loadSource = '';
        
        // Approach 1: Try API endpoint first
        try {
          // Removed logging for performance;
          const apiResponse = await fetch(`${API_URL}/get-resources`, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            cache: 'no-store'
          });
          
          if (apiResponse.ok) {
            resourcesData = await apiResponse.json();
            loadSource = 'API endpoint';
          } else {
            // Removed warning for performance;
          }
        } catch (apiErr) {
          // Removed warning for performance;
        }
        
        // Try the special assets/data route if API endpoint failed
        // This route actually serves files from server/data directory
        if (!resourcesData) {
          try {
            // Removed logging for performance;
            const fileResponse = await fetch(`${ASSETS_URL}/assets/data/resources.json`, {
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              },
              cache: 'no-store'
            });
            
            if (fileResponse.ok) {
              resourcesData = await fileResponse.json();
              loadSource = 'assets/data route';
            } else {
              // Removed warning for performance;
            }
          } catch (fileErr) {
            // Removed warning for performance;
          }
        }
        
        // If both approaches failed, show error
        if (!resourcesData || Object.keys(resourcesData).length === 0) {
          // Removed error logging for performance;
          setError('No dictionary data available. Please check the server is running (npm run server) and server/data files exist.');
          resourcesData = {};
          loadSource = 'none - data missing';
        }
        
        // Removed logging for performance;
        
        // Log info about available dictionaries
        Object.keys(resourcesData).forEach(dict => {
          const rootsCount = Object.keys(resourcesData[dict]).length;
          // Removed logging for performance;
          
          // Log a few sample roots for debugging
          if (rootsCount > 0) {
            const sampleRoots = Object.keys(resourcesData[dict]).slice(0, 5);
            // Removed logging for performance;
          }
        });
        
        setResources(resourcesData);
        setDataLoadingStatus(prev => ({ ...prev, resources: 'success' }));
        return true; // Return true to indicate success instead of empty string
      } catch (err) {
        // Removed error logging for performance;
        setError("Failed to load resources: " + err.message);
        setDataLoadingStatus(prev => ({ ...prev, resources: 'error' }));
        
        // No fallback data, show error
        // Removed error logging for performance;
        setError('No dictionary data available. Please check the server is running on port 3001 and server/data files exist.');
        
        // Set empty resources
        setResources({});
        setDataLoadingStatus(prev => ({ ...prev, resources: 'error' }));
        return "";
      }
    };
    
    // Helper function to load dataset - single-copy architecture
    const loadDataset = async () => { // Remove unused basePath parameter
      try {
        setDataLoadingStatus(prev => ({ ...prev, dataset: 'loading' }));
        
        // Try to load from localStorage as a temporary fallback (in case of network issues)
        let datasetData = {};
        try {
          const localData = localStorage.getItem('arabicRootsDataset');
          if (localData) {
            try {
              const parsedData = JSON.parse(localData);
              if (parsedData && Object.keys(parsedData).length > 0) {
                datasetData = parsedData;
                // Removed logging for performance;
              }
            } catch (e) {
              // Silent error - localStorage data could be corrupted
            }
          }
        } catch (e) {
          // Silent error - localStorage might be unavailable
        }
        
        // Always try to load from API endpoint
        try {
          // Load dataset exclusively from the API endpoint
          // Removed logging for performance;
          const datasetResponse = await fetch(`${API_URL}/get-dataset`, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            cache: 'no-store'
          });
          
          if (datasetResponse.ok) {
            // Removed logging for performance;
            try {
              // Read response text first to debug
              const responseText = await datasetResponse.text();
              
              try {
                // Try to parse as JSON
                const serverData = JSON.parse(responseText);
                // Removed logging for performance;
                
                if (serverData && Object.keys(serverData).length > 0) {
                  const dictCount = Object.keys(serverData).length;
                  const rootsCount = Object.values(serverData).reduce((count, dict) => {
                    return count + Object.keys(dict || {}).length;
                  }, 0);
                  
                  // Only proceed if actual data was found
                  if (rootsCount === 0) {
                    // Removed warning for performance;
                    throw new Error("Server returned dataset with no roots");
                  }
                  
                  // Removed logging for performance;
                  
                  // Additional logging for لسان العرب
                  if (serverData["لسان العرب"]) {
                    const arabRoots = Object.keys(serverData["لسان العرب"] || {}).length;
                    // Removed logging for performance;
                    
                    if (arabRoots > 0) {
                      const sampleRoots = Object.keys(serverData["لسان العرب"]).slice(0, 5);
                      // Removed logging for performance;
                    } else {
                      // Removed warning for performance;
                    }
                  } else {
                    // Removed warning for performance;
                  }
                  
                  // Assign server data to our dataset variable - deep copy to avoid reference issues
                  datasetData = JSON.parse(JSON.stringify(serverData));
                  
                  // Important: Signal completion of loading
                  // Removed logging for performance;
                  
                  // Clear flag to allow saving since we have real data
                  window.__preventDatasetOverwrite = false;
                  window.__initialDatasetLoad = true; // Still initial load, don't save right away
                } else {
                  // Removed warning for performance;
                  throw new Error("Server returned empty dataset");
                }
              } catch (jsonErr) {
                // Removed error logging for performance;
                // Removed warning for performance;
                throw jsonErr;
              }
            } catch (parseErr) {
              // Removed error logging for performance;
              throw parseErr;
            }
          } else {
            throw new Error(`API error: ${datasetResponse.status} ${datasetResponse.statusText}`);
          }
        } catch (err) {
          // Removed warning for performance;
          // Removed logging for performance;
          
          // Log the localStorage data if available
          try {
            const localData = localStorage.getItem('arabicRootsDataset');
            if (localData) {
              const parsedData = JSON.parse(localData);
              if (parsedData && Object.keys(parsedData).length > 0) {
                const dictCount = Object.keys(parsedData).length;
                const rootsCount = Object.values(parsedData).reduce((count, dict) => {
                  return count + Object.keys(dict || {}).length;
                }, 0);
                
                // Removed logging for performance;
              } else {
                // Removed logging for performance;
              }
            } else {
              // Removed logging for performance;
            }
          } catch (e) {
            // Removed warning for performance;
          }
          
          // Continue with localStorage data if available
        }
        
        // If no data was loaded, create an empty structure matching the resources dictionaries
        if (!datasetData || Object.keys(datasetData).length === 0) {
          // If resources are available, initialize dataset with dictionary names from resources
          if (resources && Object.keys(resources).length > 0) {
            datasetData = {};
            Object.keys(resources).forEach(dict => {
              datasetData[dict] = {};
            });
            // Removed logging for performance;
          } else {
            // Fallback if resources aren't available yet
            datasetData = { "لسان العرب": {} };
            // Removed logging for performance;
          }
          
          // Removed logging for performance;
          
          // Set a flag to prevent saving this empty structure back to the server
          // and don't save on initial load
          window.__preventDatasetOverwrite = true;
          window.__initialDatasetLoad = true;
        }
        
        // Add debug logging to track dataset state
        if (datasetData && datasetData["لسان العرب"]) {
          const arabRoots = Object.keys(datasetData["لسان العرب"] || {}).length;
          // Removed logging for performance;
          
          if (arabRoots > 0) {
            // Log a few sample roots
            const sampleRoots = Object.keys(datasetData["لسان العرب"]).slice(0, 5);
            // Removed logging for performance;
          }
        }
        
        setDataset(datasetData);
        setDataLoadingStatus(prev => ({ ...prev, dataset: 'success' }));
        return true;
      } catch (err) {
        // Removed error logging for performance;
        setError("Failed to load dataset: " + err.message);
        setDataLoadingStatus(prev => ({ ...prev, dataset: 'error' }));
        return false;
      }
    };
    
    // Helper function to load AI data - single-copy architecture
    const loadAiData = async () => { // Remove unused basePath parameter
      try {
        setDataLoadingStatus(prev => ({ ...prev, aiData: 'loading' }));
        
        // Don't check resources availability - we need to load AI data regardless
        // Removed logging for performance
        
        // Create a dummy AI data object for testing
        const dummyAiData = {
          "أَبأ": "الأباءة: شجرة من الفصيلة النجيلية، ولها ثمر يشبه حب العدس. وأَبَّاء: تأبية للإبل، أي زجر لها وسوق.",
          "شهنز": "الشهنيز: حب يشبه السمسم أسود، وهو نوع من البذور المستخدمة في الطب والطعام قديماً.",
          "جرهس": "الجرهس: الضخم من الإبل، وقيل هو العظيم الخلق من كل شيء."
        };
        
        // Attempt to use the dummy data to show something in the UI immediately
        // Removed logging for performance;
        setAiData(dummyAiData);
        
        // Continue with network request to get the real data
        
        // Load AI data directly from assets path - the server serves static files from server/data
        try {
          // Try multiple paths to find the spectrum.json file
          // Option 1: Try in public assets
          const filePath1 = `${ASSETS_URL}/assets/data/spectrum.json`;
          // Option 2: Try in root public folder
          const filePath2 = `${ASSETS_URL}/spectrum.json`;
          
          // Removed logging for performance;
          // Removed logging for performance;
          // Removed logging for performance;
          
          // Try first path
          let fileResponse = await fetch(filePath1, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            cache: 'no-store'
          });
          
          // If first path fails, try the second path
          if (!fileResponse.ok) {
            // Removed warning for performance;
            
            try {
              fileResponse = await fetch(filePath2, {
                headers: {
                  'Cache-Control': 'no-cache',
                  'Pragma': 'no-cache'
                },
                cache: 'no-store'
              });
            } catch (secondPathError) {
              // Removed error logging for performance;
            }
          }
          
          // If both paths failed, handle the error
          if (!fileResponse.ok) {
            // Removed warning for performance;
            setAiData({});
            setDataLoadingStatus(prev => ({ ...prev, aiData: 'empty' }));
            return true;
          } else {
            // Removed logging for performance;
          }
          
          try {
            // First get the response as text for debugging
            const responseText = await fileResponse.text();
            
            // Check if the response looks like valid JSON
            if (!responseText || responseText.trim() === '' || responseText.length < 10) {
              // Removed warning for performance;
              setAiData({});
              setDataLoadingStatus(prev => ({ ...prev, aiData: 'empty' }));
              return true;
            }
            
            // Log first 100 chars of response for debugging
            // Removed logging for performance;
            
            try {
              // Try to parse the response as JSON
              const serverAiData = JSON.parse(responseText);
              // Removed logging for performance;
              // Removed logging for performance;
              
              // Sample a few entries if available
              if (Object.keys(serverAiData).length > 0) {
                const sampleKeys = Object.keys(serverAiData).slice(0, 3);
                // Removed logging for performance;
                
                // Show sample content
                if (serverAiData[sampleKeys[0]]) {
                  const sampleContent = serverAiData[sampleKeys[0]].substring(0, 50);
                  // Removed logging for performance;
                }
                
                // If we got real data from server, merge it with the dummy data
                const mergedData = { ...dummyAiData, ...serverAiData };
                // Removed logging for performance;
                
                setAiData(mergedData);
              } else {
                // If server data is empty, keep using the dummy data
                // Removed logging for performance;
              }
              
              setDataLoadingStatus(prev => ({ ...prev, aiData: 'success' }));
              return true;
            } catch (parseError) {
              // Removed error logging for performance;
              // Removed logging for performance;
              
              // Keep the dummy data in case of parsing error
              // Removed logging for performance;
              // Don't overwrite the dummy data we set earlier
              // setAiData({});
              
              setDataLoadingStatus(prev => ({ ...prev, aiData: 'partial' }));
              return true;
            }
          } catch (textError) {
            // Removed error logging for performance;
            
            // Keep the dummy data
            // Removed logging for performance;
            // Don't overwrite dummy data
            // setAiData({});
            
            setDataLoadingStatus(prev => ({ ...prev, aiData: 'partial' }));
            return true;
          }
        } catch (fetchErr) {
          // Removed error logging for performance;
          
          // Keep using the dummy data on network error
          // Removed logging for performance;
          // Don't overwrite the dummy data
          // setAiData({});
          
          setDataLoadingStatus(prev => ({ ...prev, aiData: 'partial' }));
          return true;
        }
      } catch (err) {
        // Removed error logging for performance;
        setError("Failed to load AI data: " + err.message);
        setDataLoadingStatus(prev => ({ ...prev, aiData: 'error' }));
        return false;
      }
    };

    loadData();
  }, [])

  // Process roots from resources
  useEffect(() => {
    if (loading || !resources) return;
    
    // Removed logging for performance;
    
    // Check all available dictionaries
    const availableDictionaries = Object.keys(resources);
    // Removed logging for performance;
    
    // If requested mojam doesn't exist but we have other dictionaries, use the first one
    let actualMojam = mojam;
    if (!resources[mojam] && availableDictionaries.length > 0) {
      actualMojam = availableDictionaries[0];
      // Removed logging for performance;
      
      // Update the mojam state to the available dictionary
      setMojam(actualMojam);
      return; // Exit early as setMojam will trigger this effect again
    }
    
    // Verify mojam exists in resources and has roots
    if (!resources[actualMojam]) {
      // Removed error logging for performance;
      setRoots([]);
      return;
    }
    
    // Get roots list from resources
    let rootsList = Object.keys(resources[actualMojam]);
    
    // Removed logging for performance;
    
    if (rootsList.length === 0) {
      // Removed error logging for performance;
      setRoots([]);
      return;
    }
    
    // Apply current sort
    if (sortType === "alpha") {
      rootsList = rootsList.sort();
      // Removed logging for performance;
    } else if (sortType === "length") {
      rootsList = rootsList.sort((a, b) => {
        // Sort by number of words in the content instead of character length
        const aWordCount = resources[actualMojam][a].split(/\s+/).filter(word => word.trim().length > 0).length;
        const bWordCount = resources[actualMojam][b].split(/\s+/).filter(word => word.trim().length > 0).length;
        // Sort from shorter to longer word count
        return aWordCount - bWordCount;
      });
      // Removed logging for performance;
    } else {
      // Removed logging for performance;
    }
    
    // Set the roots list
    // Removed logging for performance;
    setRoots(rootsList);
    
    // Set initial root if needed - only on first load
    if (rootsList.length > 0 && !currentRoot) {
      // Removed logging for performance;
      setCurrentRoot(rootsList[0]);
      setCurrentRootIndex(0);
    }
  }, [resources, mojam, sortType, loading, currentRoot, setMojam]); // Need setMojam for dictionary fallback

  // Track previous root for optimizations
  const prevRootRef = useRef("");
  
  // Flag to prevent multiple updates in a single render cycle
  const isProcessingRootChange = useRef(false);
  
  // Update content when root changes
  useEffect(() => {
    if (!currentRoot || !resources || !resources[mojam]) return;
    
    // Removed logging for performance;
    
    // Scroll back to the top when root changes
    // Only scroll if this is actually a root change (not an initial load)
    if (prevRootRef.current && prevRootRef.current !== currentRoot) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Save previous root words to dataset if they've changed
    const prevRoot = prevRootRef.current;
    if (prevRoot && prevRoot !== currentRoot && currentWords.length > 0) {
      // Removed logging for performance;
      
      // Get a fresh copy of the dataset to avoid stale data
      const newDataset = JSON.parse(JSON.stringify(dataset || {}));
      if (!newDataset[mojam]) {
        newDataset[mojam] = {};
      }
      
      // Save the words for the previous root
      newDataset[mojam][prevRoot] = [...currentWords];
      
      // Update the dataset
      setDataset(newDataset);
      
      // Save to localStorage and server
      try {
        // Update localStorage for offline access
        localStorage.setItem("arabicRootsDataset", JSON.stringify(newDataset));
        
        // Save to server silently
        if (!window.__preventDatasetOverwrite && !window.__initialDatasetLoad) {
          // Removed logging for performance;
          fetch(`${API_URL}/save-dataset`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newDataset),
          }).catch((err) => {
            // Removed warning for performance;
          });
        }
      } catch (e) {
        // Removed warning for performance;
      }
    }
    
    // Update current root reference
    prevRootRef.current = currentRoot;
    
    // Make sure dataset has the current dictionary
    if (!dataset[mojam]) {
      // Removed logging for performance;
      setDataset(prevDataset => ({
        ...prevDataset,
        [mojam]: {}
      }));
    }
    
    // Important: Reset selected word when changing roots to prevent state issues
    setSelectedWord(null);
    
    // Get text for the current root
    const text = resources[mojam][currentRoot];
    setCurrentText(text);
    
    // Update AI content
    if (aiData && Object.keys(aiData).length > 0) {
      if (aiData[currentRoot]) {
        setAiContent(aiData[currentRoot]);
      } else {
        setAiContent("");
      }
    } else {
      setAiContent("");
    }
    
    // Check if this root exists in the dataset
    const rootExistsInDataset = dataset && 
                              dataset[mojam] && 
                              dataset[mojam][currentRoot] &&
                              dataset[mojam][currentRoot].length > 0;
    
    // Get the words for this root
    if (rootExistsInDataset) {
      // Root exists in dataset - use saved words
      // Removed logging for performance;
      setCurrentWords([...dataset[mojam][currentRoot]]);
    } else if (text) {
      // Root doesn't exist in dataset - generate new words
      // Removed logging for performance;
      const words = getRelatedWords(text, currentRoot);
      setCurrentWords([...words]);
      
      // Update dataset temporarily for counter display, but don't save to server yet
      // Removed logging for performance;
      setDataset(prevDataset => {
        const newDataset = {...prevDataset};
        if (!newDataset[mojam]) {
          newDataset[mojam] = {};
        }
        newDataset[mojam][currentRoot] = [...words];
        return newDataset;
      });
      
      // Save to localStorage as backup
      try {
        const localDataset = JSON.parse(localStorage.getItem("arabicRootsDataset") || "{}");
        if (!localDataset[mojam]) {
          localDataset[mojam] = {};
        }
        localDataset[mojam][`${currentRoot}__temp`] = [...words];
        localStorage.setItem("arabicRootsDataset", JSON.stringify(localDataset));
      } catch (e) {
        // Removed warning for performance;
      }
    } else {
      setCurrentWords([]);
    }
  }, [currentRoot, dataset, mojam, aiData, resources]); // Keep dependencies minimal

  // Track the last saved words to avoid unnecessary saves
  const lastSavedWordsRef = useRef({});

  // Keep track of the last words update for auto-saving
  const lastWordsUpdateRef = useRef(null);
  
  // Save current words to dataset when they change - with debounce
  useEffect(() => {
    // Skip if still loading or missing critical data
    if (loading || !currentRoot || !dataset || !mojam) return;
    
    // Store current values for the cleanup function
    const currentWordsSnapshot = [...currentWords];
    const currentRootSnapshot = currentRoot;
    const currentMojamSnapshot = mojam;
    
    // Skip auto-saving immediately after root change (avoid race conditions)
    if (lastWordsUpdateRef.current === 'root-change') {
      // Removed logging for performance;
      lastWordsUpdateRef.current = null;
      return;
    }
    
    // Check if this root already exists in the dataset
    const rootExistsInDataset = dataset && 
                            dataset[mojam] && 
                            dataset[mojam][currentRoot] &&
                            dataset[mojam][currentRoot].length > 0;
                            
    // Only save changes for roots that are already in the dataset
    // For unprocessed roots, we'll save when the user navigates away
    if (!rootExistsInDataset) {
      // Removed logging for performance;
      return;
    }
    
    // Use a ref to track the last saved words to avoid unnecessary updates
    const wordsKey = `${mojam}:${currentRoot}`;
    const lastSavedWords = lastSavedWordsRef.current[wordsKey] || [];
    
    // Only update if the words have actually changed and aren't just a reorder
    const wordsEqual = 
      lastSavedWords.length === currentWords.length && 
      lastSavedWords.every(word => currentWords.includes(word));
    
    if (!wordsEqual) {
      // Removed logging for performance;
      
      // Mark as user-initiated update (not from root change)
      lastWordsUpdateRef.current = 'user-action';
      
      // Save the update with debounce to prevent rapid state changes
      const timer = setTimeout(() => {
        // Verify we still have the same root/mojam before saving
        if (currentRootSnapshot !== currentRoot || currentMojamSnapshot !== mojam) {
          // Removed logging for performance;
          return;
        }
        
        // Removed logging for performance;
        
        try {
          // Important: create a fresh copy of dataset to avoid reference issues
          const newDataset = JSON.parse(JSON.stringify(dataset));
          
          if (!newDataset[mojam]) {
            newDataset[mojam] = {};
          }
          
          // Update the dataset with the new words
          newDataset[mojam][currentRoot] = [...currentWordsSnapshot];
          
          // Track these words as saved
          lastSavedWordsRef.current[wordsKey] = [...currentWordsSnapshot];
          
          // Update the dataset state
          setDataset(newDataset);
    
          // Save to localStorage (client cache)
          localStorage.setItem("arabicRootsDataset", JSON.stringify(newDataset));
          
          // Save to server silently using the single API endpoint
          if (!window.__preventDatasetOverwrite && !window.__initialDatasetLoad) {
            // Removed logging for performance;
            fetch(`${API_URL}/save-dataset`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(newDataset),
            }).catch((err) => {
              // Removed warning for performance;
            });
          } else {
            if (window.__initialDatasetLoad) {
              // Removed logging for performance;
              // Clear initial load flag after a delay
              setTimeout(() => {
                window.__initialDatasetLoad = false;
              }, 5000);
            }
          }
        } catch (e) {
          // Removed warning for performance;
        }
      }, 2000); // Increased debounce to 2 seconds for more stability
      
      // Cleanup function - cancel timer if component unmounts or dependencies change
      return () => {
        clearTimeout(timer);
        // Removed logging for performance;
      };
    }
  }, [currentWords, currentRoot, mojam, dataset, loading]);

  // Select a word from the words list
  const selectWord = React.useCallback((word) => {
    // Removed logging for performance;
    setSelectedWord(word);
  }, []);
  
  // Handle word click in the text with useCallback for memoization
  const handleWordClick = React.useCallback((word) => {
    // Clean the word from punctuation
    const cleanWord = word.replace(new RegExp(`[${ARABIC_PUNCTUATION}\\p{P}\\s]`, "gu"), "");
    
    // Skip if empty after cleaning
    if (!cleanWord || cleanWord.trim() === "") return;
    
    // Process prefixes
    let processedWord = cleanWord;
    
    // Handle common prefixes (only if the word doesn't start with the root)
    const prefixes = ["ك", "ب", "ل", "ف", "و"];
    for (const prefix of prefixes) {
      if (processedWord.startsWith(prefix) && !currentRoot.startsWith(prefix)) {
        // Check if removing the prefix would result in a non-empty word
        if (processedWord.length > 1) {
          processedWord = processedWord.substring(1);
          break; // Only remove one prefix at a time
        }
      }
    }
    
    // Special case for doubled و
    if (processedWord.startsWith("وو") && currentRoot.startsWith("و")) {
      processedWord = processedWord.substring(1);
    }
    
    // Handle diacritics at the beginning
    if (/^[َُِ]/.test(processedWord)) {
      processedWord = processedWord.substring(1);
    }
    
    // Skip if empty after processing
    if (!processedWord || processedWord.trim() === "") return;
    
    // For clicks in the actual text content, we'll do direct toggle
    // This allows highlighting/unhighlighting words in the text by clicking
    const isExistingWord = currentWords.includes(processedWord);
    
    if (isExistingWord) {
      // Remove the word if it exists
      setCurrentWords(prevWords => prevWords.filter(w => w !== processedWord));
      
      // Do NOT deselect it if it was selected - keep it selected for edit functionality
      // if (selectedWord === processedWord) {
      //   selectWord(null);
      // }
    } else {
      // For adding from text, we'll add it directly (no double-click needed)
      setCurrentWords(prevWords => [...prevWords, processedWord]);
      
      // Always select it to enable editing
      selectWord(processedWord);
    }
  }, [currentRoot, selectWord, selectedWord]);
  
  // NO MORE GLOBAL CLICK HANDLERS - we use data attributes and direct event handlers instead
  // This removes the loop of connection and disconnection
  
  // Watch for changes in AI data - PERMANENTLY REMOVED TO FIX LOOP
  // We already update aiContent when the currentRoot changes
  // This was creating a loop of updates causing infinite re-renders
  // DO NOT re-add this effect as it causes an infinite render loop

  // This is the second definition of selectWord - removing to avoid duplicate

  // Add a prefix to the selected word
  const addPrefix = React.useCallback((prefix) => {
    if (!selectedWord) return;
    
    // Removed logging for performance;
    
    const wordIndex = currentWords.indexOf(selectedWord);
    if (wordIndex === -1) return;
    
    setCurrentWords(prevWords => {
      const newWords = [...prevWords];
      newWords[wordIndex] = prefix + newWords[wordIndex];
      return newWords;
    });
    
    setSelectedWord(prev => prefix + prev);
  }, [selectedWord, currentWords]);

  // Create a memoized diacritic map
  const diacriticMap = React.useMemo(() => ({
    "فتحة": "َ",
    "كسرة": "ِ",
    "ضمة": "ُ"
  }), []);

  // Add a diacritic to the selected word
  const addDiacritic = React.useCallback((diacritic) => {
    if (!selectedWord) return;
    
    // Removed logging for performance;
    
    const wordIndex = currentWords.indexOf(selectedWord);
    if (wordIndex === -1) return;
    
    const word = currentWords[wordIndex];
    let newWord;
    
    // Add diacritic after the first character
    if (word.length > 0) {
      newWord = word[0] + diacriticMap[diacritic] + word.substring(1);
    } else {
      newWord = word;
    }
    
    setCurrentWords(prevWords => {
      const newWords = [...prevWords];
      newWords[wordIndex] = newWord;
      return newWords;
    });
    
    setSelectedWord(newWord);
  }, [selectedWord, currentWords, diacriticMap]);

  // Delete the selected word
  const deleteWord = React.useCallback(() => {
    if (!selectedWord) return;
    
    // Removed logging for performance;
    
    setCurrentWords(prevWords => prevWords.filter(word => word !== selectedWord));
    setSelectedWord(null);
  }, [selectedWord]);

  // Reset words for the current root and move to the next one
  const resetAndNext = React.useCallback(() => {
    // Removed logging for performance;
    
    // Remove current root from dataset
    setDataset(prevDataset => {
      const newDataset = { ...prevDataset };
      if (newDataset[mojam] && newDataset[mojam][currentRoot]) {
        delete newDataset[mojam][currentRoot];
      }
      return newDataset;
    });
    
    // Move to the next root
    if (currentRootIndex < roots.length - 1) {
      const nextIndex = currentRootIndex + 1;
      setCurrentRootIndex(nextIndex);
      setCurrentRoot(roots[nextIndex]);
      // Removed logging for performance;
    } else {
      // Removed logging for performance;
    }
  }, [currentRoot, currentRootIndex, roots, mojam]);

  // Sort roots
  const toggleRootSort = React.useCallback(() => {
    // Removed logging for performance;
    
    setSortType(prevSortType => {
      if (prevSortType === "default") {
        return "length";
      } else if (prevSortType === "length") {
        return "alpha";
      } else {
        return "default";
      }
    });
  }, [sortType]);

  // Update the text content for the current root - single-copy architecture
  const updateRootText = React.useCallback(async (newText) => {
    if (!currentRoot || !resources || !mojam) {
      return false;
    }
    
    try {
      // Create a new resources object with the updated text
      const newResources = JSON.parse(JSON.stringify(resources));
      newResources[mojam][currentRoot] = newText;
      
      // Update the resources state immediately for responsiveness
      setResources(newResources);
      
      // Update current text
      setCurrentText(newText);
      
      // First, try to save to localStorage as backup
      try {
        localStorage.setItem("arabicResourcesBackup", JSON.stringify(newResources));
      } catch (localErr) {
        // Silent error handling
      }
      
      // Use the more efficient update-root endpoint first with direct URL
      try {
        const response = await fetch(`${API_URL}/update-root`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mojam,
            root: currentRoot,
            text: newText
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result || !result.success) {
          // Fall back to full resources save if optimized endpoint fails
          const fallbackResponse = await fetch(`${API_URL}/save-resources`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newResources),
          });
          
          if (!fallbackResponse.ok) {
            throw new Error(`Fallback server returned ${fallbackResponse.status}: ${fallbackResponse.statusText}`);
          }
          
          // Try to parse response but handle empty responses gracefully
          try {
            const fallbackResult = await fallbackResponse.json();
            if (!fallbackResult.success) {
              throw new Error(fallbackResult.message || "Unknown error");
            }
          } catch (jsonError) {
            // If parsing failed but status was 200, consider it a success
            if (fallbackResponse.status === 200) {
              // Silent success
            } else {
              throw jsonError;
            }
          }
        }
      } catch (error) {
        setError("Error saving to server: " + error.message);
        // Don't return false here - we've already updated the UI state
      }
      
      // Always return true for UI purposes since we've already updated state
      return true;
    } catch (e) {
      setError("Failed to update text: " + e.message);
      return false;
    }
  }, [currentRoot, resources, mojam, setError]);
  
  // Save data explicitly - single-copy architecture
  const saveData = React.useCallback(async () => {
    try {
      // Save to localStorage first as backup (client-side cache)
      localStorage.setItem("arabicRootsDataset", JSON.stringify(dataset));
      
      // Save to server via API endpoint (single source of truth)
      // But only if we're not working with an empty placeholder dataset
      // and not on initial load
      if (!window.__preventDatasetOverwrite && !window.__initialDatasetLoad) {
        // Use a direct fully-qualified URL to ensure it reaches the server
        const response = await fetch(`${API_URL}/save-dataset`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataset),
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        if (!result.success) {
          setError("Server save failed: " + result.message);
          return false;
        }
      }
      
      return true;
    } catch (e) {
      setError("Failed to save data: " + e.message);
      return false;
    }
  }, [dataset]);

  // Create a memoized version of the formatted text with performance optimizations
  const formattedText = useMemo(() => {
    if (!currentText) return "";
    if (currentWords.length === 0) return currentText; // Skip processing if no words to highlight
    
    // First split the text by periods to handle paragraph breaks properly
    let paragraphs;
    try {
      paragraphs = splitByPeriod(currentText);
    } catch (e) {
      paragraphs = [currentText];
    }
    
    // Process paragraphs using the highlightConjugations function from arabicUtils
    const processedParagraphs = paragraphs.map(paragraph => 
      highlightConjugations(paragraph, currentWords)
    );
    
    // Join paragraphs with line breaks
    const processedHtml = processedParagraphs.join("<br/><br/>");
    
    return processedHtml;
  }, [currentText, currentWords]);

  // Calculate completion percentage using useMemo with performance optimizations
  const completionPercentage = React.useMemo(() => {
    // Safety check for missing data
    if (!resources || !dataset) {
      return 0;
    }
    
    // Create empty dictionary in dataset if it doesn't exist yet
    if (!dataset[mojam]) {
      const updatedDataset = {...dataset};
      updatedDataset[mojam] = {};
      
      // This will take effect on next render, use RAF for better performance
      requestAnimationFrame(() => setDataset(updatedDataset));
    }
    
    // Check for valid dictionary in resources
    if (!resources[mojam]) {
      return 0;
    }
    
    const totalRoots = Object.keys(resources[mojam]).length;
    const completedRoots = Object.keys(dataset[mojam] || {}).length;
    
    // Reduce logging on mobile devices for better performance
    if (process.env.NODE_ENV !== 'production') {
      // Removed logging for performance;
    }
    
    if (totalRoots === 0) {
      return 0;
    }
    
    // Handle case where completed roots might exceed total roots
    // This can happen if dataset contains roots that aren't in the current dictionary
    if (completedRoots > totalRoots) {
      return 100;
    }
    
    const percentage = Math.round((completedRoots / totalRoots) * 100);
    
    // Make sure percentage is within valid range
    return Math.min(Math.max(0, percentage), 100);
  }, [resources, dataset, mojam]);

  // Edit a selected word
  const editWord = React.useCallback((newWord) => {
    if (!selectedWord) return;
    
    // Removed logging for performance;
    
    if (!newWord || newWord.trim() === "") {
      // If new word is empty, just delete the word
      deleteWord();
      return;
    }
    
    // Find and update the word in currentWords
    setCurrentWords(prevWords => {
      const index = prevWords.indexOf(selectedWord);
      if (index === -1) return prevWords;
      
      const newWords = [...prevWords];
      newWords[index] = newWord;
      
      // Update the dataset immediately to ensure the edit is saved
      // This is essential for edited words to persist across refreshes
      const newDataset = JSON.parse(JSON.stringify(dataset || {}));
      if (!newDataset[mojam]) {
        newDataset[mojam] = {};
      }
      
      // Save the updated words list to the dataset
      newDataset[mojam][currentRoot] = [...newWords];
      
      // Update the dataset state
      setTimeout(() => {
        // Removed logging for performance;
        
        // Update localStorage for offline access
        localStorage.setItem("arabicRootsDataset", JSON.stringify(newDataset));
        
        // Save to server immediately after edit
        if (!window.__preventDatasetOverwrite && !window.__initialDatasetLoad) {
          // Removed logging for performance;
          fetch(`${API_URL}/save-dataset`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newDataset),
          }).catch((err) => {
            // Removed warning for performance;
          });
        }
        
        // Update dataset state
        setDataset(newDataset);
      }, 0);
      
      return newWords;
    });
    
    // Update selectedWord to the new word
    setSelectedWord(newWord);
  }, [selectedWord, deleteWord, dataset, mojam, currentRoot, API_URL]);

  // Track the number of context updates to minimize logging
  const contextUpdateCount = useRef(0);
  
  // Memoize the context value to prevent unnecessary re-renders of all consumers
  const contextValue = React.useMemo(() => {
    // Return a stable object structure that won't trigger unnecessary re-renders
    return {
      // Data states
      resources,
      dataset,
      aiData,
      loading,
      error,
      dataLoadingStatus,
      
      // Application state
      mojam,
      setMojam,
      roots,
      currentRoot,
      setCurrentRoot,
      currentRootIndex,
      setCurrentRootIndex,
      currentText,
      aiContent,
      currentWords,
      setCurrentWords,
      selectedWord,
      selectWord,
      sortType,
      
      // Computed values
      formattedText,
      completionPercentage,
      
      // Actions
      handleWordClick,
      addPrefix,
      addDiacritic,
      deleteWord,
      editWord,
      updateRootText,
      resetAndNext,
      toggleRootSort,
      saveData
    };
  }, [
    // Only include the most essential dependencies
    // This prevents unnecessary context updates
    resources,
    dataset,
    aiData,
    loading,
    error,
    mojam,
    roots,
    currentRoot,
    currentRootIndex,
    currentText,
    aiContent,
    currentWords,
    selectedWord,
    sortType,
    formattedText,
    completionPercentage
    // Note: We intentionally exclude function dependencies as they're stable thanks to useCallback
  ]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

// Export DataProvider as the default export
export default DataProvider;