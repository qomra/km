import React, { useState, useEffect } from 'react';
import { useDataContext } from '../contexts/DataContext';

const EditPanel = ({ setIsEditing: setParentIsEditing }) => {
  const { selectedWord, editWord } = useDataContext();
  const [editValue, setEditValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Update editValue when selectedWord changes
  useEffect(() => {
    if (selectedWord) {
      setEditValue(selectedWord);
    } else {
      setEditValue('');
      setIsEditing(false);
      if (setParentIsEditing) setParentIsEditing(false);
    }
  }, [selectedWord, setParentIsEditing]);

  const handleStartEdit = () => {
    if (!selectedWord) {
      alert('الرجاء اختيار كلمة أولاً');
      return;
    }
    setIsEditing(true);
    if (setParentIsEditing) setParentIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editValue.trim() === selectedWord) {
      // No change
      setIsEditing(false);
      if (setParentIsEditing) setParentIsEditing(false);
      return;
    }
    
    editWord(editValue.trim());
    setIsEditing(false);
    if (setParentIsEditing) setParentIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue(selectedWord);
    setIsEditing(false);
    if (setParentIsEditing) setParentIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  if (!selectedWord) {
    return null;
  }

  return (
    <div className="edit-panel" style={{display: 'inline-block', width: 'auto'}}>
      {isEditing ? (
        <div className="edit-controls" style={{display: 'flex', flexDirection: 'row', flexWrap: 'nowrap'}}>
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="edit-input"
            dir="rtl"
            style={{width: '200px', minWidth: '100px'}}
          />
          <div className="edit-buttons" style={{display: 'inline-flex', whiteSpace: 'nowrap'}}>
            <button onClick={handleSaveEdit} className="save-button" style={{display: 'inline-block'}}>حفظ</button>
            <button onClick={handleCancelEdit} className="cancel-button" style={{display: 'inline-block'}}>إلغاء</button>
          </div>
        </div>
      ) : (
        <button onClick={handleStartEdit} className="edit-button" style={{display: 'inline-block', whiteSpace: 'nowrap'}}>
          تعديل {selectedWord && `"${selectedWord}"`}
        </button>
      )}
    </div>
  );
};

export default EditPanel;