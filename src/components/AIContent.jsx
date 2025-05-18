import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { splitByPeriod } from '../utils/textProcessing';

const AIContent = () => {
  const { 
    aiContent, 
    loading, 
    currentRoot,
    aiData,
    dataLoadingStatus
  } = useDataContext();
  
  const [errorMessage, setErrorMessage] = useState(null);
  const contentRef = useRef(null);

  // Format AI content with paragraph breaks - memoized for performance
  const formattedContent = useMemo(() => {
    if (!aiContent) return '';
    
    try {
      // Split the content by periods and join with paragraph breaks
      const paragraphs = splitByPeriod(aiContent);
      return paragraphs.join('<br/><br/>');
    } catch (error) {
      // Error handling without logging for performance
      setErrorMessage("حدث خطأ أثناء تنسيق محتوى الذكاء الاصطناعي");
      return aiContent; // Return unformatted content as fallback
    }
    // Remove currentRoot from dependencies - it's not used in the calculation
    // and was contributing to the infinite loop
  }, [aiContent]);

  // Set HTML content - simplified to fix DOM errors
  useEffect(() => {
    // Safety check
    if (!contentRef.current) return;
    
    try {
      // Set the content - no event listeners for now
      contentRef.current.innerHTML = formattedContent;
      if (errorMessage) setErrorMessage(null);
    } catch (error) {
      // Error handling without logging for performance
      setErrorMessage("حدث خطأ أثناء عرض محتوى الذكاء الاصطناعي");
    }
  }, [formattedContent, errorMessage]);

  if (loading) {
    return (
      <div className="ai-content">
        <div className="loading">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="ai-content">
      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}
      {aiContent ? (
        // If we have AI content, show it
        <div 
          ref={contentRef} 
          className="ai-text"
          dir="rtl"
        />
      ) : (
        // If no AI content, show a simple empty state 
        // Without any DOM manipulation
        <div className="ai-text empty-state" dir="rtl">
          {currentRoot ? (
            <span>لا يوجد محتوى مولد للجذر "{currentRoot}"</span>
          ) : (
            <span>الرجاء اختيار جذر لعرض المحتوى</span>
          )}
        </div>
      )}
    </div>
  );
};

export default AIContent;