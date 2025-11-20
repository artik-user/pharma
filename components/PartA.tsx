import React, { useState, useEffect, useRef } from 'react';
import { DictationContent, Difficulty } from '../types';
import { generateDictation } from '../services/geminiService';
import { Play, RefreshCw, Check, AlertCircle, Ear, Square } from 'lucide-react';

interface Props {
  difficulty: Difficulty;
}

const PartA: React.FC<Props> = ({ difficulty }) => {
  const [data, setData] = useState<DictationContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  
  // Refs to handle stopping the async loop of slow reading
  const isPlayingRef = useRef(false);
  const timeoutRef = useRef<any>(null);

  const loadData = async () => {
    stopSpeaking();
    setLoading(true);
    setShowResults(false);
    setUserInput('');
    setErrorCount(0);
    try {
      const content = await generateDictation(difficulty);
      setData(content);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const speakUtterance = (text: string, rate: number): Promise<void> => {
    return new Promise((resolve) => {
        if (!isPlayingRef.current) {
            resolve();
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pl-PL';
        utterance.rate = rate;
        
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        
        window.speechSynthesis.speak(utterance);
    });
  };

  const wait = (ms: number): Promise<void> => {
    return new Promise((resolve) => {
        if (!isPlayingRef.current) {
            resolve();
            return;
        }
        timeoutRef.current = setTimeout(resolve, ms);
    });
  };

  // Helper to check if a word is "short" (less than 7 characters, ignoring punctuation)
  const isShortWord = (word: string) => {
    return word.replace(/[.,!?;:]/g, '').length < 7;
  };

  const speakNormal = () => {
    if (!data) return;
    stopSpeaking();
    setIsPlaying(true);
    isPlayingRef.current = true;

    const utterance = new SpeechSynthesisUtterance(data.text);
    utterance.lang = 'pl-PL';
    utterance.rate = 1.0;
    utterance.onend = () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
    };
    window.speechSynthesis.speak(utterance);
  };

  const speakSlowly = async () => {
    if (!data) return;
    stopSpeaking();
    setIsPlaying(true);
    isPlayingRef.current = true;

    // 1. Split text into sentences to read context first
    // Regex splits by punctuation (. ! ?) but keeps the punctuation attached
    const sentences = data.text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [data.text];

    for (const sentence of sentences) {
        if (!isPlayingRef.current) break;

        // A. Read the full sentence normally first
        await speakUtterance(sentence.trim(), 1.0);

        // Pause to switch mode
        if (isPlayingRef.current) await wait(2000);

        // B. Break sentence into words for dictation
        const words = sentence.trim().split(/\s+/);
        let i = 0;

        while (i < words.length) {
            if (!isPlayingRef.current) break;

            // Logic: 3 words if they are short, 2 words if they contain long words
            let chunkSize = 2;
            const remaining = words.length - i;

            if (remaining >= 3) {
                const w1 = words[i];
                const w2 = words[i+1];
                const w3 = words[i+2];
                // If all next 3 words are short, take 3
                if (isShortWord(w1) && isShortWord(w2) && isShortWord(w3)) {
                    chunkSize = 3;
                }
            } else if (remaining === 1) {
                chunkSize = 1;
            }

            const chunkText = words.slice(i, i + chunkSize).join(' ');

            // Read chunk slowly
            await speakUtterance(chunkText, 0.75);

            // C. Wait 9 seconds for writing
            if (isPlayingRef.current) {
                await wait(9000); 
            }

            i += chunkSize;
        }
    }

    setIsPlaying(false);
    isPlayingRef.current = false;
  };

  // Text cleaning for comparison (removes punctuation, lowercase)
  const cleanWord = (w: string) => w.replace(/[.,!?;:"()]/g, "").toLowerCase().trim();

  const renderComparison = () => {
    if (!data) return null;
    
    const originalWords = data.text.split(/\s+/);
    const userWords = userInput.trim().split(/\s+/);
    
    let errors = 0;
    
    const diff = originalWords.map((origWord, index) => {
        const userWord = userWords[index] || "";
        
        const isMatch = cleanWord(origWord) === cleanWord(userWord);
        if (!isMatch) errors++;

        return {
            orig: origWord,
            user: userWord,
            isMatch
        };
    });
    
    // Also count extra words as errors if user wrote way too much
    if (userWords.length > originalWords.length) {
        errors += (userWords.length - originalWords.length);
    }
    
    return { diff, errors };
  };

  const comparisonResult = showResults ? renderComparison() : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-20 px-4 pt-4">
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border border-teal-100">
        <h2 className="text-2xl font-bold text-teal-800 flex items-center gap-2 mb-2">
          <span className="bg-teal-100 p-2 rounded-lg"><Ear size={24} className="text-teal-600"/></span>
          Część A: Dyktando
        </h2>
        <p className="text-base text-gray-500">Posłuchaj tekstu i zapisz go dokładnie.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 animate-pulse">
           <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-teal-600 font-medium text-lg">Generowanie dyktanda przez AI...</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-teal-600 uppercase tracking-wider bg-teal-50 px-2 py-1 rounded">
                Temat: {data.topic}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {!isPlaying ? (
                <>
                    <button 
                        onClick={speakSlowly}
                        className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 active:scale-95 transition text-white py-3 px-4 rounded-xl font-medium text-lg"
                    >
                        <Play size={20} fill="currentColor" />
                        Dyktuj
                    </button>
                    <button 
                        onClick={speakNormal}
                        className="flex items-center justify-center gap-2 bg-teal-100 text-teal-800 hover:bg-teal-200 active:scale-95 transition py-3 px-4 rounded-xl font-medium text-lg"
                    >
                        <Play size={20} />
                        Odsłuch
                    </button>
                </>
              ) : (
                <button 
                    onClick={stopSpeaking}
                    className="col-span-2 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-xl font-medium animate-pulse text-lg"
                >
                    <Square size={20} fill="currentColor" />
                    Zatrzymaj
                </button>
              )}
            </div>

            {!showResults && (
                <textarea
                className="w-full h-48 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-lg"
                placeholder="Wpisz usłyszany tekst tutaj..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                spellCheck={false}
                ></textarea>
            )}
          </div>

          {!showResults ? (
            <button 
              onClick={() => setShowResults(true)}
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold shadow-lg active:scale-[0.98] transition flex items-center justify-center gap-2 text-lg"
            >
              <Check size={24} />
              Sprawdź wynik
            </button>
          ) : comparisonResult ? (
            <div className="bg-white p-5 rounded-xl shadow border border-gray-200 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <AlertCircle size={24} className={comparisonResult.errors === 0 ? "text-green-500" : "text-yellow-500"} />
                    Wyniki
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-base font-bold ${comparisonResult.errors === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    Błędów: {comparisonResult.errors}
                  </span>
              </div>

              <div className="mb-6 leading-loose text-xl">
                {comparisonResult.diff.map((part, i) => (
                    <span key={i} className="mr-1.5 inline-block">
                        {part.isMatch ? (
                            <span className="text-green-700">{part.orig}</span>
                        ) : (
                            <span className="flex flex-col items-center mx-1">
                                <span className="text-red-500 line-through text-base opacity-70">{part.user || "..."}</span>
                                <span className="bg-green-100 text-green-800 px-1 rounded border border-green-200 font-bold">{part.orig}</span>
                            </span>
                        )}
                    </span>
                ))}
              </div>
              
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={loadData}
                  className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-teal-700 text-lg"
                >
                  <RefreshCw size={20} />
                  Dalej
                </button>
                <button 
                  onClick={() => setShowResults(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 text-lg"
                >
                  Ponów
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-10 text-lg">Nie udało się załadować danych.</div>
      )}
    </div>
  );
};

export default PartA;