import React, { useState, useEffect } from 'react';
import { ReadingContent, Difficulty } from '../types';
import { generateReading } from '../services/geminiService';
import { BookOpen, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface Props {
  difficulty: Difficulty;
}

const PartC: React.FC<Props> = ({ difficulty }) => {
  const [data, setData] = useState<ReadingContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setSubmitted(false);
    setAnswers({});
    try {
      const content = await generateReading(difficulty);
      setData(content);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  const selectAnswer = (qId: number, optionIdx: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const calculateScore = () => {
    if (!data) return 0;
    let score = 0;
    data.questions.forEach(q => {
      if (answers[q.id] === q.correctIndex) score++;
    });
    return score;
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-20 px-4 pt-4">
       <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border border-teal-100">
        <h2 className="text-2xl font-bold text-teal-800 flex items-center gap-2 mb-2">
           <span className="bg-teal-100 p-2 rounded-lg"><BookOpen size={24} className="text-teal-600"/></span>
          Część C: Rozumienie tekstu
        </h2>
        <p className="text-base text-gray-500">Przeczytaj tekst i odpowiedz na pytania.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
           <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-teal-600 font-medium text-lg">Generowanie artykułu...</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Reading Text */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Tekst źródłowy</h3>
             <div className="prose prose-teal text-gray-800 text-justify leading-relaxed text-base md:text-lg">
                {data.text}
             </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {data.questions.map((q, idx) => (
              <div key={q.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <p className="font-semibold text-lg text-gray-800 mb-4">{idx + 1}. {q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = answers[q.id] === optIdx;
                    const isCorrect = submitted && q.correctIndex === optIdx;
                    const isWrong = submitted && isSelected && q.correctIndex !== optIdx;

                    let btnClass = "w-full text-left p-3 rounded-lg border transition text-base ";
                    
                    if (submitted) {
                      if (isCorrect) btnClass += "bg-green-100 border-green-500 text-green-800 font-medium";
                      else if (isWrong) btnClass += "bg-red-50 border-red-300 text-red-800";
                      else btnClass += "border-gray-200 text-gray-500 opacity-60";
                    } else {
                      if (isSelected) btnClass += "bg-teal-50 border-teal-500 text-teal-800 font-medium";
                      else btnClass += "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-800";
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => selectAnswer(q.id, optIdx)}
                        className={btnClass}
                        disabled={submitted}
                      >
                        <div className="flex justify-between items-center">
                           <span>{opt}</span>
                           {isCorrect && <CheckCircle size={20} className="text-green-600"/>}
                           {isWrong && <XCircle size={20} className="text-red-600"/>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

           {!submitted ? (
            <button 
              onClick={() => setSubmitted(true)}
              disabled={Object.keys(answers).length !== data.questions.length}
              className="w-full bg-teal-600 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold shadow-lg active:scale-[0.98] transition text-lg"
            >
              Zakończ test
            </button>
          ) : (
            <div className="bg-white p-5 rounded-xl shadow border border-gray-200 text-center">
              <p className="text-gray-500 mb-2 text-lg">Twój wynik:</p>
              <p className="text-5xl font-bold text-teal-600 mb-4">{calculateScore()} / {data.questions.length}</p>
              <button 
                onClick={loadData}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 text-lg"
              >
                <RefreshCw size={20} />
                Nowy tekst
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default PartC;