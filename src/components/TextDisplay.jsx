import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useDataContext } from '../contexts/DataContext';

const TextDisplay = () => {
  const { 
    currentText,
    formattedText,
    handleWordClick,
    loading,
    updateRootText,
    currentRoot,
    mojam,
    dataset,
    resources
  } = useDataContext();
  
  const [errorMessage, setErrorMessage] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedText, setEditedText] = useState('');
  const textRef = useRef(null);
  const previousFormattedText = useRef('');

  // When currentText changes, update editedText with debounce for mobile
  useEffect(() => {
    if (currentText) {
      // On mobile, use a small delay to prevent UI blocking
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        const timerId = setTimeout(() => setEditedText(currentText), 10);
        return () => clearTimeout(timerId);
      } else {
        setEditedText(currentText);
      }
    }
  }, [currentText]);

  // Memoize the click handler to prevent unnecessary re-renders
  // This will use the context's handleWordClick which supports toggling
  const handleWordClickMemoized = useCallback((word) => {
    // Removed logging for performance;
    // Use the context's handleWordClick which handles adding/removing directly for text clicks
    handleWordClick(word);
  }, [handleWordClick]);

  // Set HTML content with highlighted words with performance optimizations for mobile
  useEffect(() => {
    // Safety check
    if (!textRef.current || !formattedText || isEditMode) return;
    
    // Skip update if the formatted text hasn't changed
    if (previousFormattedText.current === formattedText) {
      return;
    }
    
    try {
      // DEBUG: Log a snippet of the formatted text to inspect highlighting
      if (process.env.NODE_ENV !== 'production') {
        const snippet = formattedText.substring(0, 200);
        console.log("Formatted text snippet:", snippet);
      }
      
      // Create paragraphs with line breaks
      const paragraphs = formattedText.split("<br/><br/>");
      const htmlContent = paragraphs.map(p => `<p>${p}</p>`).join('');
      
      // On mobile, use requestAnimationFrame to optimize rendering
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        requestAnimationFrame(() => {
          textRef.current.innerHTML = htmlContent;
          previousFormattedText.current = formattedText;
          if (errorMessage) setErrorMessage(null);
        });
      } else {
        // Direct update for desktop
        textRef.current.innerHTML = htmlContent;
        previousFormattedText.current = formattedText;
        if (errorMessage) setErrorMessage(null);
      }
    } catch (error) {
      console.error("Error updating text display:", error);
      setErrorMessage("حدث خطأ أثناء تنسيق النص");
    }
  }, [formattedText, isEditMode, errorMessage]);

  // Handle clicks using React's onClick with mobile optimizations
  const handleTextClick = useCallback((e) => {
    if (isEditMode) return;
    
    // On mobile devices, add a small debounce to prevent multiple clicks
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Find highlighted word (span element with green text)
    if (e.target.tagName === 'SPAN' && 
        e.target.style && 
        (e.target.style.color === 'rgb(102, 216, 85)' ||  // #66d855 in RGB 
         e.target.style.color === '#66d855')) {           // Handle both formats
      e.stopPropagation(); // Prevent event bubbling
      e.preventDefault(); // Prevent default behavior
      
      // Get the word from the span content
      const word = e.target.textContent;
      
      // Debug the clicked word to verify it's extracted correctly
      console.log("Found highlighted word:", word);
      
      if (word) {
        if (isMobile) {
          // Debounce for mobile
          setTimeout(() => handleWordClickMemoized(word), 10);
        } else {
          handleWordClickMemoized(word);
        }
      }
      return;
    }
    
    // If clicking anywhere else in the text, try to extract the word
    // This is a more expensive operation, so add additional debounce
    const text = window.getSelection().toString().trim();
    if (text && text.length > 0) {
      e.stopPropagation();
      e.preventDefault();
      
      // Debug the selected text
      console.log("Selected text:", text);
      
      if (isMobile) {
        // Longer debounce for selection operations on mobile
        setTimeout(() => handleWordClickMemoized(text), 50);
      } else {
        handleWordClickMemoized(text);
      }
    }
  }, [handleWordClickMemoized, isEditMode]);

  // Handle entering edit mode
  const handleEnterEditMode = useCallback(() => {
    if (isEditMode || !currentText) return;
    setIsEditMode(true);
    setEditedText(currentText);
  }, [isEditMode, currentText]);
  
  // Handle saving edited text
  const handleSaveEdit = useCallback(() => {
    if (!isEditMode) return;
    updateRootText(editedText);
    setIsEditMode(false);
  }, [isEditMode, editedText, updateRootText]);
  
  // Handle canceling edit
  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
    setEditedText(currentText);
  }, [currentText]);
  
  // Handle download dataset
  const handleDownloadDataset = useCallback(() => {
    try {
      if (!dataset) {
        throw new Error("Dataset is not available");
      }
      
      const dataStr = JSON.stringify(dataset, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dataset.json';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      // Removed error logging for performance;
      setErrorMessage('Error downloading dataset: ' + error.message);
    }
  }, [dataset]);
  
  // Handle download resources
  const handleDownloadResources = useCallback(() => {
    try {
      if (!resources) {
        throw new Error("Resources data is not available");
      }
      
      const dataStr = JSON.stringify(resources, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'resources.json';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      // Removed error logging for performance;
      setErrorMessage('Error downloading resources: ' + error.message);
    }
  }, [resources]);

  if (loading) {
    return (
      <div className="text-display">
        <div className="loading">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="text-display">
      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}
      
      <div className="text-actions" style={{display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', overflow: 'auto'}}>
        <div className="text-buttons" style={{display: 'inline-flex', flexDirection: 'row', flexWrap: 'nowrap', width: 'auto'}}>
          {isEditMode ? (
            <>
              <button type="button" onClick={handleSaveEdit} className="save-button" style={{display: 'inline-block', whiteSpace: 'nowrap'}}>حفظ التعديلات</button>
              <button type="button" onClick={handleCancelEdit} className="cancel-button" style={{display: 'inline-block', whiteSpace: 'nowrap'}}>إلغاء</button>
            </>
          ) : (
            <>
              <button type="button" onClick={handleEnterEditMode} disabled={!currentText} style={{display: 'inline-block', whiteSpace: 'nowrap'}}>تعديل النص</button>
              <button type="button" onClick={handleDownloadDataset} style={{display: 'inline-block', whiteSpace: 'nowrap'}}>تنزيل dataset.json</button>
              <button type="button" onClick={handleDownloadResources} style={{display: 'inline-block', whiteSpace: 'nowrap'}}>تنزيل resources.json</button>
            </>
          )}
        </div>
      </div>
      
      {currentRoot && (
        <div className="root-header">
          <div className="dictionary-label">{mojam}</div>
          <div className="root-label">الجذر: <span className="root-value">{currentRoot}</span></div>
        </div>
      )}
      
      <div className="text-display-container">
        {isEditMode ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="text-edit-area"
            dir="rtl"
          />
        ) : (
          <div 
            ref={textRef} 
            className="text-content"
            dir="rtl"
            onClick={handleTextClick}
          >
            {!currentText && <div className="empty-state">لا يوجد نص للعرض</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(TextDisplay);