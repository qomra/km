/**
 * Split text by periods except those within parentheses.
 * This mimics the original Python implementation.
 * 
 * @param {string} text - The text to split
 * @returns {string[]} Array of sentences
 */
export const splitByPeriod = (text) => {
    const results = [];
    let currentSentence = "";
    let parenCount = 0;
    
    for (const char of text) {
      currentSentence += char;
      
      if (char === "(") {
        parenCount += 1;
      } else if (char === ")") {
        parenCount = Math.max(0, parenCount - 1); // Prevent negative count
      } else if (char === "." && parenCount === 0) {
        // Only split if we're not inside parentheses
        results.push(currentSentence.trim());
        currentSentence = "";
      }
    }
    
    // Add the last sentence if it doesn't end with a period
    if (currentSentence.trim()) {
      results.push(currentSentence.trim());
    }
    
    return results;
  };
  
  /**
   * Remove duplicate items from an array while preserving order.
   * 
   * @param {Array} array - The array to deduplicate
   * @returns {Array} A new array with duplicates removed
   */
  export const unique = (array) => {
    const seen = new Set();
    return array.filter(item => {
      if (seen.has(item)) {
        return false;
      }
      seen.add(item);
      return true;
    });
  };