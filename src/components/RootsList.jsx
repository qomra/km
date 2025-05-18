import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { useDataContext } from '../contexts/DataContext';

// Simple RootItem component without memoization
const RootItem = ({ root, isSelected, isCompleted, onClick, title, selectedCount, totalCount }) => {
  return (
    <li 
      className={`list-item ${isSelected ? 'selected' : ''} ${isCompleted ? 'completed' : ''}`}
      onClick={() => onClick(root)}
      title={title}
    >
      <span className="root-text">{root}</span>
      <span className="word-count">({selectedCount}/{totalCount})</span>
    </li>
  );
};

// The main RootsList component with full memoization
const RootsList = () => {
  const { 
    roots, 
    currentRoot, 
    setCurrentRoot,
    setCurrentRootIndex,
    dataset,
    mojam,
    loading,
    error,
    completionPercentage,
    resources
  } = useDataContext();
  
  // State to track whether to show completed roots (default to hidden)
  const [showCompleted, setShowCompleted] = useState(false);
  
  // Keep track of mounted state to prevent updates during unmounting
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Create a stable function for handling root clicks
  const handleRootClick = useCallback((root) => {
    // Skip if component is not mounted
    if (!isMounted.current) return;
    
    // Find the index and perform the update
    const rootIndex = roots.indexOf(root);
    if (rootIndex !== -1) {
      // Check if this is actually a root change
      if (root !== currentRoot) {
        // Set states directly for immediate feedback
        setCurrentRootIndex(rootIndex);
        setCurrentRoot(root);
        
        // Scroll to the top when changing roots (only if it's a different root)
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [roots, setCurrentRoot, setCurrentRootIndex, currentRoot]);

  // Check if a root has been processed (exists in dataset)
  const isRootCompleted = useCallback((root) => {
    return dataset && 
           dataset[mojam] && 
           dataset[mojam][root] && 
           dataset[mojam][root].length > 0;
  }, [dataset, mojam]);
  
  // Get the number of selected words for a root
  const getSelectedWordCount = useCallback((root) => {
    if (dataset && dataset[mojam] && dataset[mojam][root]) {
      return dataset[mojam][root].length;
    }
    return 0;
  }, [dataset, mojam]);
  
  // Get the total number of words in the content for a root
  const getTotalWordCount = useCallback((root) => {
    if (!resources || !resources[mojam] || !resources[mojam][root]) {
      return 0;
    }
    
    // Split the text into words
    const text = resources[mojam][root];
    // A very simple Arabic word count - more sophisticated would be better for production
    const words = text.split(/\s+/).filter(word => word.trim().length > 0);
    return words.length;
  }, [resources, mojam]);
  
  // Cache the completed state for all roots
  const completedStatesRef = useRef(new Map());
  useEffect(() => {
    roots.forEach(root => {
      completedStatesRef.current.set(root, isRootCompleted(root));
    });
  }, [roots, isRootCompleted]);

  // Create a single stable div container
  const rootsListRef = useRef(null);
  
  // Memoize the roots list to prevent constant recreations
  const rootsList = useMemo(() => {
    if (loading || roots.length === 0) return null;
    
    return (
      <ul className="list">
        {roots.map((root) => {
          const completed = isRootCompleted(root);
          const itemKey = `root-${root}`;
          
          const selectedCount = getSelectedWordCount(root);
          const totalCount = getTotalWordCount(root);
          
          return (
            <RootItem 
              key={itemKey}
              root={root}
              isSelected={currentRoot === root}
              isCompleted={completed}
              onClick={handleRootClick}
              title={`${root} (${completed ? 'تم معالجته' : 'لم يتم معالجته بعد'}) - ${selectedCount}/${totalCount} كلمة`}
              selectedCount={selectedCount}
              totalCount={totalCount}
            />
          );
        })}
      </ul>
    );
  }, [roots, currentRoot, isRootCompleted, handleRootClick, getSelectedWordCount, getTotalWordCount]);
  
  // Memoize the completion indicator
  const completionIndicator = useMemo(() => {
    if (loading || roots.length === 0) return null;
    
    return (
      <div className="completion">
        <span>اكتمال: {completionPercentage}%</span>
        <div className="progress-bar">
          <div 
            className="progress" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>
    );
  }, [completionPercentage, loading, roots.length]);

  // Memoized root list items for better performance
  const rootItems = useMemo(() => {
    // Log the number of roots we're processing
    // Removed logging for performance;
    
    // Safety check to prevent errors with empty roots array
    if (!Array.isArray(roots) || roots.length === 0) {
      // Removed warning for performance;
      return [];
    }
    
    return roots.map((root) => {
      const completed = isRootCompleted(root);
      const isSelected = currentRoot === root;
      
      // Skip completed roots if not showing them, but always show the current root
      if (completed && !showCompleted && !isSelected) {
        return null;
      }
      
      // Determine appropriate classes
      let itemClasses = 'list-item';
      if (isSelected) itemClasses += ' selected';
      if (completed) itemClasses += ' completed';
      
      // Get the counts
      const selectedCount = getSelectedWordCount(root);
      const totalCount = getTotalWordCount(root);
      
      return (
        <li 
          key={root}
          className={itemClasses}
          onClick={() => {
            if (!isSelected) {
              const index = roots.indexOf(root);
              if (index !== -1) {
                setCurrentRootIndex(index);
                setCurrentRoot(root);
              }
            }
          }}
          title={`${root} (${completed ? 'تم معالجته' : 'لم يتم معالجته بعد'}) - ${selectedCount}/${totalCount} كلمة`}
        >
          <span className="root-text">{root}</span>
          <span className="word-count">({selectedCount}/{totalCount})</span>
        </li>
      );
    }).filter(item => item !== null); // Filter out null items (completed roots when hidden)
  }, [roots, currentRoot, isRootCompleted, setCurrentRoot, setCurrentRootIndex, showCompleted, getSelectedWordCount, getTotalWordCount]);

  // Calculate the number of processed roots
  const processedRootsCount = useMemo(() => {
    if (!dataset || !dataset[mojam]) return 0;
    return Object.keys(dataset[mojam]).length;
  }, [dataset, mojam]);

  // Memoized completion indicator with toggle button and safety checks
  const completionBar = useMemo(() => {
    // Safety check for invalid values
    const displayPercentage = (completionPercentage > 100 || completionPercentage < 0) 
      ? Math.min(Math.max(0, Math.round((processedRootsCount / Math.max(1, roots.length)) * 100)), 100)
      : completionPercentage;
      
    // Ensure progress bar doesn't exceed 100%
    const barWidth = Math.min(displayPercentage, 100) + '%';
    
    // Removed logging for performance;
    
    return (
      <div className="completion">
        <div className="completion-stats">
          <span>اكتمال: {displayPercentage}% ({processedRootsCount}/{roots.length})</span>
          <button 
            className={`toggle-completed ${showCompleted ? 'active' : ''}`}
            onClick={() => setShowCompleted(prev => !prev)}
          >
            {showCompleted ? 'إخفاء المعالج' : 'إظهار المعالج'}
          </button>
        </div>
        <div className="progress-bar">
          <div 
            className="progress" 
            style={{ width: barWidth }}
          ></div>
        </div>
      </div>
    );
  }, [completionPercentage, processedRootsCount, roots.length, showCompleted]);

  // Stable container approach - reduces DOM changes
  if (loading) {
    return (
      <div className="roots-list">
        <h3 className="list-title">الجذور</h3>
        <div className="loading">جاري التحميل...</div>
        {completionBar}
      </div>
    );
  }
  
  // Error state is already included in the destructured props
  
  if (roots.length === 0) {
    return (
      <div className="roots-list">
        <h3 className="list-title">الجذور</h3>
        <div className="empty-state error-message">
          {error ? 
            <div className="error-box">
              <div className="error-title">خطأ في تحميل البيانات</div>
              <div className="error-details">{error}</div>
              <div className="error-help">يرجى التأكد من تشغيل الخادم على المنفذ 3001 (npm run server) وتوفر ملفات البيانات في المجلد server/data</div>
            </div>
            : 
            'لا توجد جذور'
          }
        </div>
        {completionBar}
      </div>
    );
  }
  
  return (
    <div className="roots-list">
      <h3 className="list-title">الجذور</h3>
      <div className="roots-container">
        <ul className="list">
          {rootItems}
        </ul>
      </div>
      {completionBar}
    </div>
  );
};

// Use React.memo with a custom comparison function
export default React.memo(RootsList, (prevProps, nextProps) => {
  // Since RootsList has no props, it will always return true, 
  // preventing unnecessary re-renders
  return true;
});