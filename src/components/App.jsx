import React, { memo } from 'react';
import { DataProvider } from '../contexts/DataContext';
import TextDisplay from './TextDisplay';
import AIContent from './AIContent';
import RootsList from './RootsList';
import WordsList from './WordsList';
import ControlPanel from './ControlPanel';
import AudioPlayer from './AudioPlayer';
import '../styles/main.css';

// Memoize individual components to prevent unnecessary re-renders
const MemoizedTextDisplay = memo(TextDisplay);
const MemoizedAIContent = memo(AIContent);
const MemoizedControlPanel = memo(ControlPanel);
const MemoizedAudioPlayer = memo(AudioPlayer);
const MemoizedRootsList = memo(RootsList);
const MemoizedWordsList = memo(WordsList);

// Main app component
function App() {
  return (
    <DataProvider>
      <div className="app-container">
        <div className="main-content">
          <MemoizedTextDisplay />
          <MemoizedAIContent />
          <MemoizedControlPanel />
          <MemoizedAudioPlayer />
        </div>
        <div className="sidebar">
          <MemoizedRootsList />
          <MemoizedWordsList />
        </div>
      </div>
    </DataProvider>
  );
}

export default memo(App);