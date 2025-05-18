import React, { useEffect, useState } from 'react';
import './styles/main.css';

// Create a minimal version of the app that just loads once and doesn't refresh
function StableApp() {
  const [errorMessage, setErrorMessage] = useState("");
  const [resources, setResources] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data once
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load resources
        const resourcesResponse = await fetch('/assets/data/resources.json');
        if (resourcesResponse.ok) {
          const resourcesData = await resourcesResponse.json();
          setResources(resourcesData);
        } else {
          setErrorMessage("Failed to load resources");
        }

        // Try to load dataset
        const datasetResponse = await fetch('http://localhost:3001/api/get-dataset');
        if (datasetResponse.ok) {
          const datasetData = await datasetResponse.json();
          setDataset(datasetData);
        } else {
          setErrorMessage("Failed to load dataset");
        }
      } catch (err) {
        setErrorMessage("Error: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="stable-app">
        <h1>Loading...</h1>
        <p>Please wait while the application data is being loaded.</p>
      </div>
    );
  }

  return (
    <div className="stable-app">
      <h1>Stable App - No Refresh Version</h1>
      
      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}
      
      <div className="data-summary">
        <h3>Application Data Summary:</h3>
        {resources && (
          <div>
            <strong>Resources:</strong> Loaded {Object.keys(resources).length} dictionaries
          </div>
        )}
        
        {dataset && (
          <div>
            <strong>Dataset:</strong> Loaded {Object.keys(dataset).length} dictionaries
          </div>
        )}
      </div>
      
      <div className="instructions">
        <h3>Troubleshooting Instructions:</h3>
        <p>This is a minimal version of the app that won't refresh.</p>
        <p>Follow these steps to diagnose the issue:</p>
        <ol>
          <li>Open the browser developer console (F12 or Ctrl+Shift+I)</li>
          <li>Look for error messages or warnings</li>
          <li>Check for any messages about "React state updates"</li>
          <li>Open the Network tab to see if there are repeated API requests</li>
          <li>Try disabling each component one by one in the original app to identify the problematic one</li>
        </ol>
        
        <button type="button" onClick={() => window.location.href = '/stop-refresh.html'}>
          Open Anti-Refresh Tool
        </button>
      </div>
    </div>
  );
}

export default StableApp;