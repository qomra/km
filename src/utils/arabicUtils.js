import { unique } from './textProcessing';

// Arabic punctuation characters
export const ARABIC_PUNCTUATION = "،:؟؛«»";

// All Arabic combining marks (tashkīl/diacritics)
export const DIACRITICS = '\u0610-\u061A\u064B-\u0652\u06D6-\u06ED';

// After each letter, allow any number of diacritics
export const COMBINING = `[${DIACRITICS}]*`;

// Define what our "word-character" is
export const WORD_CHAR = `[\\w${DIACRITICS}]`;

// Common prefixes in Arabic
export const PREFIXES = ["لل", "و", "ب", "ل", "ف", "ك"];

/**
 * Extract words related to a given root from text.
 * This is a JavaScript implementation of the original Python function 'get_words'.
 * 
 * @param {string} context - The text to analyze
 * @param {string} root - The root word to search for
 * @returns {string[]} Array of related words
 */
export const getRelatedWords = (context, root) => {
  const similarWords = [];
  
  // Normalize the root for comparison
  const normalizedRoot = root
    .replace(/أ/g, "ء")
    .replace(/ئ/g, "ء")
    .replace(/ؤ/g, "ء")
    .replace(/إ/g, "ء");
  
  // Get root without tashkeel (diacritics)
  const rootNoTashkeel = normalizedRoot.replace(/[^\p{L}]/gu, "");
  
  // Check if the root ends with a repeated letter (for shaddah handling)
  const shaddahLetter = (root.length >= 2 && root[root.length - 1] === root[root.length - 2]) 
    ? root[root.length - 1] 
    : null;
  
  // Split text into words
  const words = context.split(/\s+/);
  
  for (const word of words) {
    // Remove punctuation
    const cleanWord = word.replace(
      new RegExp(`[${ARABIC_PUNCTUATION}\\p{P}]`, "gu"), 
      ""
    );
    
    if (!cleanWord) continue;
    
    // Normalize the word for comparison
    let processedWord = cleanWord
      .replace(/أ/g, "ء")
      .replace(/ئ/g, "ء")
      .replace(/ؤ/g, "ء")
      .replace(/إ/g, "ء")
      .replace(/[اوي]/g, "ايو");
    
    // Handle shaddah if present
    if (shaddahLetter) {
      const shaddahRegex = new RegExp(shaddahLetter, "g");
      processedWord = processedWord.replace(
        shaddahRegex, 
        shaddahLetter + shaddahLetter
      );
    }
    
    // Check if the root is contained in the word
    let i = 0; // index for root
    let j = 0; // index for word
    let isMatch = false;
    
    while (i < rootNoTashkeel.length && j < processedWord.length) {
      if (rootNoTashkeel[i] === "ا") {
        i++;
      } else if (rootNoTashkeel[i] === processedWord[j]) {
        i++;
        j++;
      } else {
        j++;
      }
      
      if (i === rootNoTashkeel.length) {
        isMatch = true;
        break;
      }
    }
    
    if (isMatch) {
      similarWords.push(cleanWord);
    }
  }
  
  // Post-process the similar words
  const processedWords = similarWords.map(word => {
    let processedWord = word;
    
    // Remove prefixes if they don't appear in the root
    if (processedWord.startsWith("ك") && !root.startsWith("ك")) {
      processedWord = processedWord.substring(1);
    } else if (processedWord.startsWith("ب") && !root.startsWith("ب")) {
      processedWord = processedWord.substring(1);
    } else if (processedWord.startsWith("ل") && !root.startsWith("ل")) {
      processedWord = processedWord.substring(1);
    } else if (processedWord.startsWith("ف") && !root.startsWith("ف")) {
      processedWord = processedWord.substring(1);
    } else if (processedWord.startsWith("و") && !root.startsWith("و")) {
      processedWord = processedWord.substring(1);
    } else if (processedWord.startsWith("وو") && root.startsWith("و")) {
      processedWord = processedWord.substring(1);
    }
    
    // Remove diacritics at the beginning
    if (/^[َُِ]/.test(processedWord)) {
      processedWord = processedWord.substring(1);
    }
    
    return processedWord;
  });
  
  // Remove duplicates
  return unique(processedWords);
};

/**
 * Strip diacritics from a string.
 * 
 * @param {string} s - The string to process
 * @returns {string} The string without diacritics
 */
export const stripDiacritics = (s) => {
  return s.replace(new RegExp(`[${DIACRITICS}]`, 'g'), '');
};

/**
 * Split text into tokens that are either words or non-words.
 * This helps prevent partial-word matching.
 * 
 * @param {string} text - The text to tokenize
 * @returns {Array} Array of tokens with their positions
 */
const tokenizeText = (text) => {
  const tokens = [];
  const arabicWordRegex = new RegExp(`[\\p{L}${DIACRITICS}]+`, 'gu');
  
  let match;
  let lastIndex = 0;
  
  // Find all Arabic word tokens
  while ((match = arabicWordRegex.exec(text)) !== null) {
    // Add non-word part before this match if any
    if (match.index > lastIndex) {
      tokens.push({
        text: text.substring(lastIndex, match.index),
        index: lastIndex,
        isWord: false
      });
    }
    
    // Add the word token
    tokens.push({
      text: match[0],
      index: match.index,
      isWord: true
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    tokens.push({
      text: text.substring(lastIndex),
      index: lastIndex,
      isWord: false
    });
  }
  
  return tokens;
};

/**
 * Check if a word starts with a prefix
 * 
 * @param {string} word - The word to check
 * @param {string} prefix - The prefix to check for
 * @returns {boolean} True if the word starts with the prefix
 */
const startsWithPrefix = (word, prefix) => {
  const wordNoDiacritics = stripDiacritics(word);
  const prefixNoDiacritics = stripDiacritics(prefix);
  return wordNoDiacritics.startsWith(prefixNoDiacritics);
};

/**
 * Extract the core word after a prefix, preserving diacritics
 * 
 * @param {string} word - The full word with diacritics
 * @param {string} prefix - The prefix to remove
 * @returns {object} Object containing the prefix part and the core part
 */
const extractCoreWord = (word, prefix) => {
  const wordNoDiacritics = stripDiacritics(word);
  const prefixNoDiacritics = stripDiacritics(prefix);
  
  if (!wordNoDiacritics.startsWith(prefixNoDiacritics)) {
    return { prefix: '', core: word };
  }
  
  // Find where the core starts after the prefix
  // Count diacritics in the prefix area
  let prefixEndIndex = 0;
  let plainCharCount = 0;
  
  for (let i = 0; i < word.length; i++) {
    if (!new RegExp(`[${DIACRITICS}]`).test(word[i])) {
      plainCharCount++;
    }
    
    if (plainCharCount > prefixNoDiacritics.length) {
      break;
    }
    
    prefixEndIndex = i + 1;
  }
  
  return {
    prefix: word.substring(0, prefixEndIndex),
    core: word.substring(prefixEndIndex)
  };
};

/**
 * Highlight specified conjugations in a text using exact word matching.
 * 
 * @param {string} text - The text to process
 * @param {string[]} conjugations - Array of conjugations to highlight
 * @returns {string} HTML string with highlighted words
 */
export const highlightConjugations = (text, conjugations) => {
  if (!text || !conjugations || conjugations.length === 0) return text;
  
  // Convert the text to a safe string to prevent XSS
  let processedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Create a set of conjugations for faster lookup
  const conjSet = new Set(conjugations);
  
  // Also create a set of conjugations without diacritics
  const conjSetNoDiacritics = new Set(conjugations.map(c => stripDiacritics(c)));
  
  // Tokenize the text
  const tokens = tokenizeText(processedText);
  
  // Process each token
  let result = '';
  for (const token of tokens) {
    if (!token.isWord) {
      // Non-word tokens (spaces, punctuation) are added as-is
      result += token.text;
      continue;
    }
    
    const word = token.text;
    
    // Case 1: Check if the entire word is in our conjugations list
    if (conjSet.has(word)) {
      // Whole word exact match - highlight the entire word
      result += `<span style='color:#66d855'>${word}</span>`;
      continue;
    }
    
    // Case 2: Check for prefix + word combinations
    let foundMatch = false;
    
    for (const prefix of PREFIXES) {
      if (startsWithPrefix(word, prefix)) {
        // Extract the core word (after prefix)
        const { prefix: actualPrefix, core: coreWord } = extractCoreWord(word, prefix);
        
        // If the core word is in our list
        if (conjSet.has(coreWord)) {
          result += `${actualPrefix}<span style='color:#66d855'>${coreWord}</span>`;
          foundMatch = true;
          break;
        } 
        
        // Check if the whole word (with prefix) is in our list
        // This is a redundant check (covered above) but kept for clarity
        if (conjSet.has(word)) {
          result += `<span style='color:#66d855'>${word}</span>`;
          foundMatch = true;
          break;
        }
      }
    }
    
    // If no match was found, add the word as-is
    if (!foundMatch) {
      result += word;
    }
  }
  
  return result;
};

/**
 * Legacy highlight function - maintained for compatibility.
 * 
 * @param {string} text - The text to process
 * @param {string[]} words - Array of words to highlight
 * @param {string} highlightClass - CSS class to apply to highlighted words
 * @returns {string} HTML string with highlighted words
 */
export const highlightWords = (text, words, highlightClass = "highlighted-word") => {
  return highlightConjugations(text, words);
};

/**
 * Escape special characters in a string for use in a RegExp.
 * 
 * @param {string} string - The string to escape
 * @returns {string} The escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}