# Arabic Roots Analyzer

An interactive application for analyzing Arabic text, identifying root words, and managing word collections associated with each root.

## Features

- View and analyze Arabic text from various dictionaries
- Track and highlight words derived from specific roots
- Save and manage collections of words for each root
- Process Arabic text with prefixes and diacritics

## Setup

1. Install dependencies:
```
npm install
```

2. Start the development server with auto-save functionality:
```
npm run dev
```

This will start both the React application and the backend server needed for saving data.

## How it Works

- The main interface displays Arabic text on the right and roots/words lists on the left
- Clicking on a root in the roots list shows its associated text
- Words can be added to a root by clicking them in the text
- Words can be removed by clicking them in the words list
- Changes are automatically saved to both localStorage and the server

## Data Saving

The application saves data in two ways:

1. **Automatic Saving**: Changes are automatically saved whenever you:
   - Add or remove words for a root
   - Change to a different root

2. **Manual Saving**: Click the "Save" button to explicitly save all changes.

Both save methods update:
- Browser's localStorage (for persistence between sessions)
- The server's dataset.json file (for permanent storage)

## Server API

The backend server provides these endpoints:

- `POST /api/save-dataset` - Saves the dataset to the server
- `GET /api/get-dataset` - Retrieves the dataset from the server

## Files

- `/public/assets/data/` - Contains the data files:
  - `resources.json` - Dictionary resources
  - `dataset.json` - User-generated word collections
  - `spectrum.json` - AI-generated content

## Troubleshooting

If you encounter issues:

1. Make sure the server is running (port 3001)
2. Check that data files exist in the correct location
3. Verify the browser console for any error messages

### Fixing Refresh Loop Issues

If the app keeps refreshing endlessly after loading:

1. **Use the Stable Version**: The app now includes a non-refreshing version to help diagnose issues
   - The stable version is enabled by default in `src/index.js`
   - To switch back: change `const USE_STABLE_VERSION = true` to `false`

2. **Use the Anti-Refresh Tool**: 
   - Navigate to `/stop-refresh.html` in your browser
   - Follow the instructions there to diagnose refresh issues

3. **Common Causes**:
   - Infinite state update loops in useEffect hooks
   - Form submissions without preventDefault() handlers
   - API requests triggering cascading state updates
   - Make sure all buttons have `type="button"` explicitly set

4. **Test the API Directly**:
   - Use the `test-update-root.sh` script to verify API functionality
   - Run: `chmod +x test-update-root.sh && ./test-update-root.sh`