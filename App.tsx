import React, { useState } from 'react';
import { ExamPart, Difficulty } from './types';
import PartA from './components/PartA';
import PartB from './components/PartB';
import PartC from './components/PartC';
import PartD from './components/PartD';
import { Home, Ear, Headphones, BookOpen, MessageSquare, Settings, Menu, ChevronDown } from 'lucide-react';

const App = () => {
  const [currentPart, setCurrentPart] = useState<ExamPart>(ExamPart.HOME);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.B2);

  // Cycle through difficulties: B1 -> B2 -> C1 -> B1
  const cycleDifficulty = () => {
    if (difficulty === Difficulty.B1) setDifficulty(Difficulty.B2);
    else if (difficulty === Difficulty.B2) setDifficulty(Difficulty.C1);
    else setDifficulty(Difficulty.B1);
  };

  const renderContent = () => {
    switch (currentPart) {
      case ExamPart.A: return <PartA difficulty={difficulty} />;
      case ExamPart.B: return <PartB difficulty={difficulty} />;
      case ExamPart.C: return <PartC difficulty={difficulty} />;
      case ExamPart.D: return <PartD difficulty={difficulty} />;
      default:
        return (
          <div className="p-6 space-y-6 pb-32 animate-fade-in h-full overflow-y-auto">
            <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden shrink-0">
               <div className="relative z-10">
                  <h1 className="text-4xl font-bold mb-2">Witaj, Farmaceuto!</h1>
                  <p className="opacity-90 text-lg">Przygotuj się do egzaminu z języka polskiego.</p>
               </div>
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
            </div>

            <div>
              <h3 className="font-bold text-lg text-gray-700 mb-3 px-2">Wybierz część egzaminu</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MenuCard 
                  title="Część A: Dyktando" 
                  desc="Pisanie ze słuchu" 
                  icon={<Ear className="text-white" size={28} />}
                  color="bg-purple-500"
                  onClick={() => setCurrentPart(ExamPart.A)}
                />
                <MenuCard 
                  title="Część B: Słuchanie" 
                  desc="Test wyboru" 
                  icon={<Headphones className="text-white" size={28} />}
                  color="bg-blue-500"
                  onClick={() => setCurrentPart(ExamPart.B)}
                />
                <MenuCard 
                  title="Część C: Czytanie" 
                  desc="Zrozumienie tekstu" 
                  icon={<BookOpen className="text-white" size={28} />}
                  color="bg-orange-500"
                  onClick={() => setCurrentPart(ExamPart.C)}
                />
                <MenuCard 
                  title="Część D: Mówienie" 
                  desc="Symulacja z pacjentem" 
                  icon={<MessageSquare className="text-white" size={28} />}
                  color="bg-green-500"
                  onClick={() => setCurrentPart(ExamPart.D)}
                />
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
               <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
                 <Settings size={20} className="text-gray-400"/> Szybki wybór poziomu
               </h3>
               <div className="flex bg-gray-100 p-1 rounded-xl">
                 {(Object.keys(Difficulty) as Array<keyof typeof Difficulty>).map((lvl) => (
                   <button
                    key={lvl}
                    onClick={() => setDifficulty(Difficulty[lvl])}
                    className={`flex-1 py-3 rounded-lg text-base font-bold transition-all ${difficulty === Difficulty[lvl] ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                   >
                     {lvl}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 h-screen shadow-2xl flex flex-col relative overflow-hidden md:rounded-3xl md:my-5 md:h-[calc(100vh-40px)] md:border md:border-gray-200">
      {/* Header - Hidden on Part D for more space */}
      {currentPart !== ExamPart.D && (
        <header className="bg-white p-4 flex justify-between items-center border-b border-gray-100 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center font-bold text-white text-xl">P</div>
            <span className="font-bold text-lg text-gray-800">Farmaceuta PRO</span>
          </div>
          
          {/* Global Difficulty Selector */}
          <button 
            onClick={cycleDifficulty}
            className="px-4 py-2 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-full text-sm font-bold text-teal-700 flex items-center gap-1 active:scale-95 transition"
          >
            Poziom: {difficulty} 
            <ChevronDown size={16} />
          </button>
        </header>
      )}

      {/* Content */}
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 flex justify-around items-center px-2 pt-2 absolute bottom-0 w-full z-20 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <NavButton 
          active={currentPart === ExamPart.HOME} 
          onClick={() => setCurrentPart(ExamPart.HOME)} 
          icon={<Home size={28}/>} 
          label="Start" 
        />
        <NavButton 
          active={currentPart === ExamPart.A} 
          onClick={() => setCurrentPart(ExamPart.A)} 
          icon={<Ear size={28}/>} 
          label="Dyktando" 
        />
        <NavButton 
          active={currentPart === ExamPart.B} 
          onClick={() => setCurrentPart(ExamPart.B)} 
          icon={<Headphones size={28}/>} 
          label="Słuch" 
        />
        <NavButton 
          active={currentPart === ExamPart.C} 
          onClick={() => setCurrentPart(ExamPart.C)} 
          icon={<BookOpen size={28}/>} 
          label="Tekst" 
        />
        <NavButton 
          active={currentPart === ExamPart.D} 
          onClick={() => setCurrentPart(ExamPart.D)} 
          icon={<MessageSquare size={28}/>} 
          label="Rozmowa" 
        />
      </nav>
    </div>
  );
};

const MenuCard = ({ title, desc, icon, color, onClick }: any) => (
  <button onClick={onClick} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition hover:shadow-md text-left">
    <div className={`${color} w-14 h-14 rounded-xl flex items-center justify-center shadow-md shrink-0`}>
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-lg text-gray-800">{title}</h4>
      <p className="text-sm text-gray-400">{desc}</p>
    </div>
  </button>
);

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${active ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
  >
    <div className={`transition-transform ${active ? 'scale-110' : ''}`}>{icon}</div>
    <span className="text-xs font-medium">{label}</span>
  </button>
);

export default App;