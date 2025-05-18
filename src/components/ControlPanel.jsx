import React, { useEffect, useState } from 'react';
import { useDataContext } from '../contexts/DataContext';
import PrefixPanel from './PrefixPanel';
import DiacriticsPanel from './DiacriticsPanel';
import EditPanel from './EditPanel';

const ControlPanel = () => {
  const { 
    resetAndNext,
    toggleRootSort,
    saveData,
    deleteWord,
    sortType,
    selectedWord,
    loading
  } = useDataContext();
  const [isEditing, setIsEditing] = useState(false);

  const handleResetClick = () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين الكلمات لهذا الجذر؟')) {
      resetAndNext();
    }
  };

  const handleSaveClick = () => {
    const success = saveData();
    if (success) {
      alert('تم حفظ البيانات بنجاح');
    } else {
      alert('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleSortClick = () => {
    toggleRootSort();
  };

  const handleDeleteClick = () => {
    if (selectedWord) {
      deleteWord();
    } else {
      alert('الرجاء اختيار كلمة أولاً');
    }
  };

  // Get button label based on current sort type
  const getSortButtonLabel = () => {
    switch(sortType) {
      case 'alpha':
        return 'ترتيب أبجدي';
      case 'length':
        return 'ترتيب حسب الطول';
      default:
        return 'ترتيب';
    }
  };

  // Monitor selectedWord changes for debugging the edit button visibility
  useEffect(() => {
    // Instead of logging, keep this effect to ensure re-render when selectedWord changes
  }, [selectedWord]);

  if (loading) {
    return <div className="control-panel">جاري التحميل...</div>;
  }

  return (
    <div className="control-panel">
      <div className="control-row" style={{display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', overflow: 'auto'}}>
        {!isEditing && (
          <div className="control-group" style={{display: 'inline-flex', flexDirection: 'row', flexWrap: 'nowrap'}}>
            <button onClick={handleResetClick} style={{display: 'inline-block', whiteSpace: 'nowrap'}}>إعادة تعيين</button>
            <button onClick={handleSortClick} style={{display: 'inline-block', whiteSpace: 'nowrap'}}>{getSortButtonLabel()}</button>
            <button onClick={handleSaveClick} style={{display: 'inline-block', whiteSpace: 'nowrap'}}>حفظ</button>
            <button 
              onClick={handleDeleteClick}
              disabled={!selectedWord}
              className={!selectedWord ? 'disabled' : ''}
              style={{display: 'inline-block', whiteSpace: 'nowrap'}}
            >
              حذف
            </button>
          </div>
        )}
        {selectedWord && (
          <div className={isEditing ? "edit-container-expanded" : "edit-container"} style={{display: 'inline-block', width: 'auto'}}>
            <EditPanel setIsEditing={setIsEditing} />
          </div>
        )}
      </div>
      
      {!isEditing && (
        <>
          <PrefixPanel />
          <DiacriticsPanel />
        </>
      )}
    </div>
  );
};

export default ControlPanel;