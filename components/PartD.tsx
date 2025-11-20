import React, { useState, useRef, useEffect } from 'react';
import { Difficulty, ChatMessage } from '../types';
import { generateSimulationStart, continueSimulation } from '../services/geminiService';
import { MessageSquare, Send, User, Bot, RefreshCw, Mic, MicOff, Keyboard, Sparkles, Lightbulb, X } from 'lucide-react';

interface Props {
  difficulty: Difficulty;
}

interface FeedbackData {
  feedback: string;
  betterAnswer?: string;
}

const PartD: React.FC<Props> = ({ difficulty }) => {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [finished, setFinished] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const startNew = async () => {
    setLoading(true);
    setHistory([]);
    setFinished(false);
    setFeedbackData(null);
    setShowFeedback(false);
    setInput('');
    try {
      const res = await generateSimulationStart(difficulty);
      setHistory([{ role: 'model', text: res.reply }]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startNew();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  // Speech Recognition Logic
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Twoja przeglądarka nie obsługuje rozpoznawania mowy. Użyj nowszej wersji Chrome lub Safari.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'pl-PL';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSend = async () => {
    if (!input.trim() || loading || finished) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    const newHistory = [...history, userMsg];
    
    setHistory(newHistory);
    setInput('');
    setLoading(true);
    setFeedbackData(null);
    setShowFeedback(false); // Close feedback when sending new message

    try {
      const res = await continueSimulation(newHistory, difficulty);
      setHistory(prev => [...prev, { role: 'model', text: res.reply }]);
      
      if (res.feedback) {
        setFeedbackData({
          feedback: res.feedback,
          betterAnswer: res.betterAnswer
        });
      }
      
      if (res.isFinished) setFinished(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-gray-50">
       {/* Small Floating Feedback Button */}
       {feedbackData && !loading && !finished && (
          <button 
            onClick={() => setShowFeedback(!showFeedback)}
            className={`absolute top-4 right-4 z-30 p-3 rounded-full shadow-md border transition-all flex items-center justify-center ${showFeedback ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'}`}
            title="Pokaż analizę"
          >
            <Lightbulb size={24} className={showFeedback ? "fill-current" : ""} />
          </button>
       )}

       {/* Feedback Overlay */}
       {showFeedback && feedbackData && (
         <div className="absolute top-20 left-4 right-4 z-20 animate-fade-in">
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl shadow-xl p-5 relative">
               <button 
                 onClick={() => setShowFeedback(false)} 
                 className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
               >
                 <X size={24} />
               </button>
               
               <div className="mb-3">
                 <strong className="text-yellow-800 block mb-1 text-sm uppercase tracking-wide">Ocena Twojej wypowiedzi:</strong> 
                 <p className="text-base text-gray-800">{feedbackData.feedback}</p>
               </div>
               
               {feedbackData.betterAnswer && (
                 <div className="pt-3 border-t border-yellow-200/50">
                    <strong className="text-teal-700 block mb-1 text-sm uppercase tracking-wide flex items-center gap-1">
                      <Sparkles size={16}/> Przykładowa odpowiedź:
                    </strong>
                    <span className="italic text-teal-900 text-base">"{feedbackData.betterAnswer}"</span>
                 </div>
               )}
            </div>
         </div>
       )}

       {/* Chat Area */}
       <div className="flex-1 overflow-y-auto px-4 pb-4 pt-6 space-y-4 no-scrollbar">
          {history.length === 0 && loading && (
             <div className="text-center text-gray-400 text-base mt-10">Inicjowanie pacjenta...</div>
          )}
          
          {history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[90%] p-5 rounded-2xl text-xl shadow-sm transition-all ${
                 msg.role === 'user' 
                   ? 'bg-teal-600 text-white rounded-tr-none' 
                   : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
               }`}>
                 <div className={`flex items-center gap-2 mb-1 text-sm font-bold uppercase ${msg.role === 'user' ? 'text-teal-100' : 'text-gray-400'}`}>
                    {msg.role === 'user' ? <User size={14}/> : <Bot size={14}/>}
                    {msg.role === 'user' ? 'Ty (Farmaceuta)' : 'Pacjent'}
                 </div>
                 {msg.text}
               </div>
            </div>
          ))}
          
          {loading && history.length > 0 && (
             <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 flex gap-1 items-center">
                   <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                   <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                   <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                </div>
             </div>
          )}

          {finished && (
            <div className="flex flex-col items-center py-6">
               <div className="text-teal-600 font-bold mb-3 text-lg">Symulacja zakończona</div>
               <button 
                 onClick={startNew}
                 className="bg-gray-900 text-white px-6 py-3 rounded-full text-base flex items-center gap-2 shadow-lg active:scale-95 transition"
               >
                 <RefreshCw size={18} /> Nowa symulacja
               </button>
            </div>
          )}

          <div ref={messagesEndRef} />
       </div>

       {/* Voice Input Area */}
       <div className="bg-white border-t border-gray-200 p-4 pb-24 md:pb-4">
          <div className="flex flex-col gap-3 max-w-3xl mx-auto">
             
             {/* Mic Button - Centered and Large */}
             {!finished && (
               <div className="flex items-center gap-2">
                 <button
                   onClick={startListening}
                   disabled={loading || finished || isListening}
                   className={`flex-1 h-14 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-lg ${
                     isListening 
                       ? 'bg-red-500 text-white animate-pulse shadow-red-200 shadow-lg' 
                       : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                   }`}
                 >
                   {isListening ? (
                     <>
                       <MicOff size={24} /> Słucham...
                     </>
                   ) : (
                     <>
                       <Mic size={24} /> Naciśnij i mów
                     </>
                   )}
                 </button>
               </div>
             )}

             {/* Text Preview and Send */}
             <div className="flex gap-2">
               <div className="relative flex-1">
                 <input 
                   type="text"
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                   placeholder={finished ? "Zakończono." : isListening ? "Mów teraz..." : "Tutaj pojawi się Twój tekst..."}
                   disabled={loading || finished}
                   className="w-full bg-white border border-gray-300 rounded-xl px-4 py-4 pl-10 focus:ring-2 focus:ring-teal-500 outline-none text-xl text-gray-900 placeholder-gray-500 shadow-sm"
                 />
                 <Keyboard size={20} className="absolute left-3 top-5 text-gray-400" />
               </div>
               
               <button 
                 onClick={handleSend}
                 disabled={!input.trim() || loading || finished}
                 className="bg-teal-600 text-white w-16 h-full rounded-xl flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 hover:bg-teal-700 active:scale-95 transition"
               >
                 <Send size={28} />
               </button>
             </div>
             
             {input && !finished && (
                <p className="text-center text-xs text-gray-400">
                   Sprawdź tekst powyżej i wyślij przyciskiem.
                </p>
             )}
          </div>
       </div>
    </div>
  );
};

export default PartD;