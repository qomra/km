// DiacriticsPanel Componentimport React from 'react';
import { useDataContext } from '../contexts/DataContext';

const DiacriticsPanel = () => {
  const { 
    addDiacritic, 
    selectedWord 
  } = useDataContext();

  // Define available diacritics
  const diacritics = [
    { key: 'fatha', value: 'فتحة', label: 'فتحة' },
    { key: 'kasra', value: 'كسرة', label: 'كسرة' },
    { key: 'damma', value: 'ضمة', label: 'ضمة' }
  ];

  const handleDiacriticClick = (diacritic) => {
    if (selectedWord) {
      addDiacritic(diacritic);
    } else {
      alert('الرجاء اختيار كلمة أولاً');
    }
  };

  return (
    <div className="control-group diacritics-panel">
      {diacritics.map((diacritic) => (
        <button 
          key={diacritic.key}
          onClick={() => handleDiacriticClick(diacritic.value)}
          disabled={!selectedWord}
          className={!selectedWord ? 'disabled' : ''}
          title={`إضافة ${diacritic.label} للكلمة المحددة`}
        >
          {diacritic.label}
        </button>
      ))}
    </div>
  );
};

export default DiacriticsPanel;