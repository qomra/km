import React, { memo, useCallback, useMemo, useState } from 'react';
import { useDataContext } from '../contexts/DataContext';

// Simple search component for words
const WordSearch = memo(({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };
  
  return (
    <div className="word-search">
      <input
        type="text"
        placeholder="بحث عن كلمة..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="search-input"
        dir="rtl"
      />
    </div>
  );
});

// Simple word item component
const WordItem = memo(({ word, isSelected, onClick }) => {
  return (
    <li 
      className={`list-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(word)}
    >
      {word}
    </li>
  );
}, (prevProps, nextProps) => {
  // Only re-render if these props change
  return prevProps.isSelected === nextProps.isSelected && 
         prevProps.word === nextProps.word;
});

// Memoize the entire component to prevent unnecessary re-renders
const WordsList = memo(() => {
  const { 
    currentWords, 
    selectedWord,
    selectWord,
    setCurrentWords,
    currentRoot,
    loading
  } = useDataContext();
  
  // Add search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredWords, setFilteredWords] = useState([]);

  // Handle search functionality
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredWords(currentWords);
    } else {
      const filtered = currentWords.filter(word => 
        word.includes(term)
      );
      setFilteredWords(filtered);
    }
  }, [currentWords]);
  
  // Update filtered words when current words change
  React.useEffect(() => {
    if (searchTerm.trim()) {
      setFilteredWords(currentWords.filter(word => word.includes(searchTerm)));
    } else {
      setFilteredWords(currentWords);
    }
  }, [currentWords, searchTerm]);

  // Simple, reliable word click handler
  const handleWordClick = useCallback((word) => {
    // Removed logging for performance;
    
    // If word is already selected - perform action
    if (selectedWord === word) {
      // Toggle word presence in the list
      if (currentWords.includes(word)) {
        // Remove word from list
        // Removed logging for performance;
        setCurrentWords(prevWords => prevWords.filter(w => w !== word));
      } else {
        // Add word to list
        // Removed logging for performance;
        setCurrentWords(prevWords => [...prevWords, word]);
      }
      
      // Do NOT deselect word after toggling to allow editing
      // selectWord(null);
    } else {
      // First click just selects
      // Removed logging for performance;
      selectWord(word);
    }
  }, [selectedWord, selectWord, currentWords, setCurrentWords]);

  // Memoize all UI states unconditionally
  const loadingUI = useMemo(() => (
    <div className="words-list">
      <h3 className="list-title">الكلمات</h3>
      <WordSearch onSearch={handleSearch} />
      <div className="loading">جاري التحميل...</div>
    </div>
  ), [handleSearch]);

  // Memoize the empty state UI
  const emptyStateUI = useMemo(() => (
    <div className="words-list">
      <h3 className="list-title">الكلمات</h3>
      <WordSearch onSearch={handleSearch} />
      {!currentRoot ? (
        <div className="empty-state">الرجاء اختيار جذر أولاً</div>
      ) : (
        <div className="empty-state">لا توجد كلمات للجذر "{currentRoot}"</div>
      )}
    </div>
  ), [currentRoot, handleSearch]);

  // Memoize the words list to prevent unnecessary re-renders
  const wordsListContent = useMemo(() => (
    <div className="words-list">
      <h3 className="list-title">الكلمات</h3>
      <WordSearch onSearch={handleSearch} />
      <ul className="list">
        {filteredWords.map((word, index) => (
          <WordItem 
            key={`${word}-${index}`}
            word={word}
            isSelected={selectedWord === word}
            onClick={handleWordClick}
          />
        ))}
      </ul>
    </div>
  ), [filteredWords, selectedWord, handleWordClick, handleSearch]);
  
  // Simplified render approach
  if (loading) {
    return (
      <div className="words-list">
        <h3 className="list-title">الكلمات</h3>
        <WordSearch onSearch={handleSearch} />
        <div className="words-container">
          <div className="loading">جاري التحميل...</div>
        </div>
      </div>
    );
  }
  
  if (!currentRoot || currentWords.length === 0) {
    return (
      <div className="words-list">
        <h3 className="list-title">الكلمات</h3>
        <WordSearch onSearch={handleSearch} />
        <div className="words-container">
          {!currentRoot ? (
            <div className="empty-state">الرجاء اختيار جذر أولاً</div>
          ) : (
            <div className="empty-state">لا توجد كلمات للجذر "{currentRoot}"</div>
          )}
        </div>
      </div>
    );
  }
  
  // Words list content
  return (
    <div className="words-list">
      <h3 className="list-title">الكلمات</h3>
      <WordSearch onSearch={handleSearch} />
      <div className="words-container">
        <ul className="list">
          {filteredWords.map((word, index) => (
            <WordItem 
              key={`${word}-${index}`}
              word={word}
              isSelected={selectedWord === word}
              onClick={handleWordClick}
            />
          ))}
        </ul>
      </div>
    </div>
  );
});

export default WordsList;