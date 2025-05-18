import React from 'react';
import { useDataContext } from '../contexts/DataContext';

const PrefixPanel = () => {
  const { 
    addPrefix, 
    selectedWord 
  } = useDataContext();

  // Define available prefixes
  const prefixes = [
    { key: 'k', value: 'ك', label: 'ك' },
    { key: 'b', value: 'ب', label: 'ب' },
    { key: 'f', value: 'ف', label: 'ف' },
    { key: 'l', value: 'ل', label: 'ل' },
    { key: 'w', value: 'و', label: 'و' }
  ];

  const handlePrefixClick = (prefix) => {
    if (selectedWord) {
      addPrefix(prefix);
    } else {
      alert('الرجاء اختيار كلمة أولاً');
    }
  };

  return (
    <div className="control-group prefix-panel">
      {prefixes.map((prefix) => (
        <button 
          key={prefix.key}
          onClick={() => handlePrefixClick(prefix.value)}
          disabled={!selectedWord}
          className={!selectedWord ? 'disabled' : ''}
          title={`إضافة ${prefix.label} للكلمة المحددة`}
        >
          {prefix.label}
        </button>
      ))}
    </div>
  );
};

export default PrefixPanel;