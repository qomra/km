import React from 'react';
import './styles/main.css';
import DataProvider from './contexts/DataContext';
import TextDisplay from './components/TextDisplay';
import AIContent from './components/AIContent';
import RootsList from './components/RootsList';
import WordsList from './components/WordsList';
import ControlPanel from './components/ControlPanel';
import AudioPlayer from './components/AudioPlayer';

function App() {
  return (
    <DataProvider>
      <div className="app-container">
        <div className="main-content">
          <TextDisplay />
          <AIContent />
          <ControlPanel />
          <AudioPlayer />
        </div>
        <div className="sidebar">
          <RootsList />
          <WordsList />
        </div>
      </div>
    </DataProvider>
  );
}

export default App;