const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// Define the single source of truth for data files
const DATA_DIR = path.join(__dirname, 'data');
const DATASET_PATH = path.join(DATA_DIR, 'dataset.json');
const RESOURCES_PATH = path.join(DATA_DIR, 'resources.json');
const SPECTRUM_PATH = path.join(DATA_DIR, 'spectrum.json');

// Enable CORS for all requests
app.use(cors());

// Parse JSON request bodies with increased limit for large resources.json
app.use(bodyParser.json({ limit: '200mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '200mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Make sure server data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Created data directory at ${DATA_DIR}`);
  } catch (err) {
    console.error('Failed to create server data directory:', err);
  }
}

// Special route to serve data files directly from server/data
app.get('/assets/data/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(DATA_DIR, filename);
  
  // Only allow access to JSON files
  if (!filename.endsWith('.json')) {
    return res.status(403).json({ success: false, message: 'Only JSON files can be accessed' });
  }
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return res.status(404).json({ success: false, message: 'File not found' });
  }
  
  console.log(`Serving ${filename} from server/data directory`);
  res.sendFile(filePath);
});

// API endpoint to save dataset
app.post('/api/save-dataset', (req, res) => {
  try {
    // Safety check - prevent saving empty or nearly empty dataset
    if (!req.body || Object.keys(req.body).length === 0) {
      console.warn('Attempted to save empty dataset - rejecting request');
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot save empty dataset' 
      });
    }
    
    // Check for minimal data structure that might indicate a problem
    const totalRoots = Object.values(req.body).reduce((sum, dict) => {
      return sum + Object.keys(dict || {}).length;
    }, 0);
    
    if (totalRoots < 3) {
      console.warn(`Attempted to save dataset with only ${totalRoots} roots - rejecting request`);
      return res.status(400).json({ 
        success: false, 
        message: `Cannot save dataset with only ${totalRoots} roots` 
      });
    }
    
    // Another safety check - read existing file first
    if (fs.existsSync(DATASET_PATH)) {
      try {
        const existingData = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf8'));
        const existingRoots = Object.values(existingData).reduce((sum, dict) => {
          return sum + Object.keys(dict || {}).length;
        }, 0);
        
        // Don't allow overwriting a larger dataset with a smaller one
        if (existingRoots > totalRoots) {
          console.warn(`Rejected attempt to overwrite ${existingRoots} roots with only ${totalRoots} roots`);
          return res.status(400).json({ 
            success: false, 
            message: `Cannot overwrite ${existingRoots} roots with only ${totalRoots} roots` 
          });
        }
      } catch (parseErr) {
        console.warn('Could not parse existing dataset for comparison:', parseErr);
        // Continue with save if we can't parse the existing file
      }
    }
    
    // Save directly to server/data - single source of truth
    console.log(`Saving dataset to ${DATASET_PATH} with ${totalRoots} roots`);
    
    // Create directory if it doesn't exist (redundant but safer)
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Write the data
    fs.writeFileSync(DATASET_PATH, JSON.stringify(req.body, null, 2));
    
    res.json({ success: true, message: `Dataset saved successfully with ${totalRoots} roots` });
  } catch (error) {
    console.error('Error saving dataset:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint to save resources
app.post('/api/save-resources', (req, res) => {
  try {
    console.log('Saving resources, received payload size:', JSON.stringify(req.body).length);
    console.log(`Saving resources to ${RESOURCES_PATH}`);
    
    // Create directory if it doesn't exist (redundant but safer)
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Write the resources to the single source of truth
    fs.writeFileSync(RESOURCES_PATH, JSON.stringify(req.body, null, 2));
    console.log('Resources file written successfully');
    
    res.json({ success: true, message: 'Resources saved successfully' });
  } catch (error) {
    console.error('Error saving resources:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint to get dataset
app.get('/api/get-dataset', (req, res) => {
  try {
    console.log(`Reading dataset from ${DATASET_PATH}`);
    
    if (!fs.existsSync(DATASET_PATH)) {
      console.log('Dataset file does not exist, returning empty object');
      return res.json({ "لسان العرب": {} });
    }
    
    const datasetContent = fs.readFileSync(DATASET_PATH, 'utf8');
    console.log(`Dataset read from disk, size: ${datasetContent.length} bytes`);
    
    const dataset = JSON.parse(datasetContent);
    
    // Log dataset structure
    const dictCount = Object.keys(dataset).length;
    const rootsInDicts = {};
    let totalRoots = 0;
    
    Object.keys(dataset).forEach(dict => {
      const rootsCount = Object.keys(dataset[dict] || {}).length;
      rootsInDicts[dict] = rootsCount;
      totalRoots += rootsCount;
    });
    
    console.log(`Dataset loaded successfully: ${dictCount} dictionaries, ${totalRoots} total roots`);
    console.log('Roots per dictionary:', rootsInDicts);
    
    res.json(dataset);
  } catch (error) {
    console.error('Error reading dataset:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint to get resources
app.get('/api/get-resources', (req, res) => {
  try {
    console.log(`Reading resources from ${RESOURCES_PATH}`);
    
    if (!fs.existsSync(RESOURCES_PATH)) {
      console.log('Resources file does not exist');
      return res.json({ 
        "لسان العرب": {
          "أبا": "الأباء بالفتح والمد: القًّصَبُ، والواحدة أباءَهٌ. ويقال هو أَجَمةُ الحَلْفاء.",
          "أبب": "الأبُّ: المَرْعى. قال الله تعالى: \"وفاكِهَةً وأًبّاً\"."
        }
      });
    }
    
    const resources = JSON.parse(fs.readFileSync(RESOURCES_PATH, 'utf8'));
    console.log('Resources loaded, number of dictionaries:', Object.keys(resources).length);
    res.json(resources);
  } catch (error) {
    console.error('Error reading resources:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint to update a specific root in resources
app.post('/api/update-root', (req, res) => {
  try {
    // Validate the request body
    const { mojam, root, text } = req.body;
    
    if (!mojam || !root || typeof text !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields. Need mojam, root, and text.' 
      });
    }
    
    // Read the current resources
    if (!fs.existsSync(RESOURCES_PATH)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resources file not found' 
      });
    }
    
    // Load resources, update the specified root, and save
    const resources = JSON.parse(fs.readFileSync(RESOURCES_PATH, 'utf8'));
    
    // Create dictionary if it doesn't exist
    if (!resources[mojam]) {
      resources[mojam] = {};
    }
    
    // Update the root text
    resources[mojam][root] = text;
    
    // Save back to file
    fs.writeFileSync(RESOURCES_PATH, JSON.stringify(resources, null, 2));
    
    res.json({ 
      success: true, 
      message: `Root '${root}' in '${mojam}' updated successfully` 
    });
  } catch (error) {
    console.error('Error updating root:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint to get spectrum (AI content)
app.get('/api/get-spectrum', (req, res) => {
  try {
    console.log(`Reading spectrum data from ${SPECTRUM_PATH}`);
    
    if (!fs.existsSync(SPECTRUM_PATH)) {
      console.log('Spectrum file does not exist, returning empty object');
      return res.json({});
    }
    
    const spectrumContent = fs.readFileSync(SPECTRUM_PATH, 'utf8');
    console.log(`Spectrum data read from disk, size: ${spectrumContent.length} bytes`);
    
    const spectrum = JSON.parse(spectrumContent);
    
    // Log spectrum structure
    const rootCount = Object.keys(spectrum).length;
    console.log(`Spectrum loaded successfully: ${rootCount} AI content entries`);
    
    res.json(spectrum);
  } catch (error) {
    console.error('Error reading spectrum data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint to save spectrum data
app.post('/api/save-spectrum', (req, res) => {
  try {
    console.log('Saving spectrum data, received payload size:', JSON.stringify(req.body).length);
    console.log(`Saving spectrum data to ${SPECTRUM_PATH}`);
    
    // Create directory if it doesn't exist (redundant but safer)
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Write the spectrum data to the single source of truth
    fs.writeFileSync(SPECTRUM_PATH, JSON.stringify(req.body, null, 2));
    console.log('Spectrum file written successfully');
    
    res.json({ success: true, message: 'Spectrum data saved successfully' });
  } catch (error) {
    console.error('Error saving spectrum data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Diagnostic endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'single-copy',
    dataDirectory: DATA_DIR,
    dataFiles: {
      dataset: fs.existsSync(DATASET_PATH) ? 'exists' : 'missing',
      resources: fs.existsSync(RESOURCES_PATH) ? 'exists' : 'missing',
      spectrum: fs.existsSync(SPECTRUM_PATH) ? 'exists' : 'missing'
    },
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Using single data source at: ${DATA_DIR}`);
});