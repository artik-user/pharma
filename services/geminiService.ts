import { GoogleGenerativeAI } from "@google/generative-ai";
import { Difficulty, DictationContent, ListeningContent, ReadingContent, SimulationResponse, ChatMessage } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to get model name
const MODEL_NAME = 'gemini-2.5-flash';

// Helper for random topics
const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const DICTATION_TOPICS = [
  "Zasady przechowywania szczepionek w lodówce aptecznej",
  "Procedura realizacji recepty na leki psychotropowe",
  "Obsługa pacjenta z receptą transgraniczną",
  "Sporządzanie maści recepturowej z hydrokortyzonem",
  "Interakcje leków przeciwzakrzepowych z żywnością",
  "Rola farmaceuty w opiece farmaceutycznej nad seniorem",
  "Zasady utylizacji przeterminowanych leków",
  "Suplementacja witaminy D w okresie jesienno-zimowym",
  "Różnice między lekiem oryginalnym a generycznym",
  "Postępowanie w przypadku błędu w dawkowaniu na recepcie"
];

const LISTENING_TOPICS = [
  "Pacjent skarżący się na silny, suchy kaszel w nocy",
  "Matka szukająca mleka modyfikowanego dla alergika",
  "Telefon od lekarza w sprawie zamiany leku na odpowiednik",
  "Turysta, który zgubił leki na nadciśnienie",
  "Pacjent wstydzący się zapytać o preparat na grzybicę stóp",
  "Instrukcja obsługi inhalatora ciśnieniowego dla astmatyka",
  "Wyjaśnianie pacjentowi różnicy między probiotykiem a prebiotykiem",
  "Rozmowa o skutkach ubocznych antybiotykoterapii",
  "Pacjent chcący zwrócić zakupiony lek (aspekt prawny)",
  "Porada dotycząca oparzenia słonecznego u dziecka"
];

const READING_TOPICS = [
  "Fragment Charakterystyki Produktu Leczniczego (ChPL) nowego leku biologicznego",
  "Artykuł naukowy o nowej generacji leków przeciwcukrzycowych",
  "Zmienione przepisy dotyczące wystawiania recept farmaceutycznych",
  "Opis przypadku klinicznego: pacjent z wielochorobowością",
  "Historia odkrycia penicyliny i jej wpływ na współczesną medycynę",
  "Raport o najczęstszych błędach w samoleczeniu Polaków",
  "Artykuł o rosnącej oporności bakterii na antybiotyki",
  "Opis technologii mRNA w szczepionkach",
  "Zasady Dobrej Praktyki Wytwarzania (GMP) w aptece",
  "Wpływ ziół na metabolizm leków syntetycznych"
];

/**
 * Part A: Dictation
 * Generates a short medical/pharmaceutical text.
 */
export const generateDictation = async (level: Difficulty): Promise<DictationContent> => {
  const topic = getRandomElement(DICTATION_TOPICS);
  
  const prompt = `
    Jesteś egzaminatorem na egzaminie z języka polskiego dla farmaceutów.
    Przygotuj tekst dyktanda (Część A egzaminu).
    Poziom trudności: ${level}.
    Wylosowany temat szczegółowy: "${topic}".
    
    Wymagania:
    - Tekst musi być unikalny i dotyczyć wylosowanego tematu.
    - Długość: około 5-7 zdań złożonych.
    - Użyj profesjonalnego słownictwa medycznego/farmaceutycznego adekwatnego do tematu.
    - Nie powtarzaj ciągle tych samych fraz.
    
    Zwróć wynik w formacie JSON zawierającym "text" (treść dyktanda) i "topic" (krótki tytuł tematu - użyj wylosowanego).
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          topic: { type: Type.STRING },
        },
        required: ["text", "topic"],
      },
    },
  });

  return JSON.parse(response.text || '{}') as DictationContent;
};

/**
 * Part B: Listening Comprehension
 * Generates a dialogue/text script and questions.
 */
export const generateListening = async (level: Difficulty): Promise<ListeningContent> => {
  const topic = getRandomElement(LISTENING_TOPICS);

  const prompt = `
    Przygotuj zadanie do Części B egzaminu (Rozumienie ze słuchu) dla farmaceuty.
    Poziom: ${level}.
    Temat scenariusza: "${topic}".
    
    1. Napisz dialog lub komunikat farmaceutyczny (np. pacjent opisuje objawy, lekarz dzwoni z pytaniem o interakcję, instrukcja stosowania leku). 
       Tekst musi być unikalny, szczegółowy i zawierać konkretne dane (nazwy, dawki, objawy), aby można było ułożyć pytania.
    2. Ułóż dokładnie 10 pytań zamkniętych (jednokrotnego wyboru A, B, C, D) do tego tekstu.
    
    Zwróć JSON.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      script: { type: Type.STRING, description: "Tekst do przeczytania przez lektora" },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctIndex: { type: Type.INTEGER, description: "Indeks poprawnej odpowiedzi (0-3)" },
          },
          required: ["id", "question", "options", "correctIndex"],
        },
      },
    },
    required: ["script", "questions"],
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  return JSON.parse(response.text || '{}') as ListeningContent;
};

/**
 * Part C: Reading Comprehension
 * Generates a longer text and questions.
 */
export const generateReading = async (level: Difficulty): Promise<ReadingContent> => {
  const topic = getRandomElement(READING_TOPICS);

  const prompt = `
    Przygotuj zadanie do Części C egzaminu (Rozumienie tekstu pisanego) dla farmaceuty.
    Poziom: ${level}.
    Temat tekstu: "${topic}".
    
    Tekst powinien być merytoryczny, przypominający autentyczny dokument medyczny lub artykuł branżowy.
    Długość: ok. 400-500 słów. Unikaj ogólników, podaj szczegóły.
    
    Dołącz dokładnie 10 pytań sprawdzających szczegółowe zrozumienie tekstu (nie tylko ogólny sens).
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctIndex: { type: Type.INTEGER },
          },
          required: ["id", "question", "options", "correctIndex"],
        },
      },
    },
    required: ["text", "questions"],
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  return JSON.parse(response.text || '{}') as ReadingContent;
};

/**
 * Part D: Simulation (Chat)
 * Handles the conversational aspect.
 */
export const generateSimulationStart = async (level: Difficulty): Promise<SimulationResponse> => {
  // Simulation needs vary distinct scenarios too
  const scenarios = [
    "Pacjent chce kupić antybiotyk bez recepty, bo 'zawsze mu pomaga'.",
    "Młoda kobieta pyta o antykoncepcję awaryjną (tabletkę 'po').",
    "Starszy pan skarży się, że nowe leki są za drogie i chce tańsze zamienniki.",
    "Pacjent z silnym bólem zęba, pyta o najsilniejszy lek przeciwbólowy.",
    "Klient awanturuje się o długą kolejkę.",
    "Osoba kupująca dużą ilość leków na kaszel (podejrzenie użycia pozamedycznego - acodin/thiocodin).",
    "Pacjentka w ciąży przeziębiona, pyta co może bezpiecznie wziąć.",
    "Realizacja recepty z błędem w numerze PESEL."
  ];
  const scenario = getRandomElement(scenarios);

  const prompt = `
    Rozpoczynasz symulację Części D egzaminu (Mówienie/Porada).
    Wciel się w rolę pacjenta w aptece.
    Poziom językowy pacjenta: naturalny, polski potoczny.
    Farmaceuta musi wykazać się poziomem ${level}.
    
    Scenariusz: ${scenario}
    
    Nie zaczynaj od "Dzień dobry, poproszę...". Zacznij od razu od problemu lub w sposób naturalny dla sytuacji (np. zdenerwowanie, pośpiech).
    Bądź kreatywny.
    Zwróć JSON: { "reply": "Twoja wypowiedź", "isFinished": false }.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reply: { type: Type.STRING },
          isFinished: { type: Type.BOOLEAN },
        },
        required: ["reply", "isFinished"],
      },
    },
  });

  return JSON.parse(response.text || '{}') as SimulationResponse;
};

export const continueSimulation = async (history: ChatMessage[], level: Difficulty): Promise<SimulationResponse> => {
  // Construct history for context
  const conversation = history.map(h => `${h.role === 'user' ? 'Farmaceuta' : 'Pacjent'}: ${h.text}`).join('\n');

  const prompt = `
    Kontynuuj symulację egzaminu (Część D).
    Oto historia rozmowy:
    ${conversation}

    Jako pacjent, zareaguj na ostatnią wypowiedź farmaceuty. Bądź konsekwentny w swojej roli.
    
    W polu 'feedback' (po polsku): Krótko oceń ostatnią wypowiedź farmaceuty pod kątem gramatyki i stylu (poziom ${level}).
    W polu 'betterAnswer' (po polsku): Napisz zwięzłą (maksymalnie 2 zdania), konkretną i profesjonalną odpowiedź, jakiej farmaceuta powinien był udzielić w tej sytuacji. Ma być krótko i na temat.
    
    Jeśli farmaceuta udzielił pełnej porady i problem jest rozwiązany, ustaw "isFinished": true.
    
    Format JSON:
    {
      "reply": "Twoja odpowiedź jako pacjenta",
      "feedback": "Ocena błędów",
      "betterAnswer": "Zwięzła (1-2 zdania) wzorcowa odpowiedź",
      "isFinished": true/false
    }
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reply: { type: Type.STRING },
          feedback: { type: Type.STRING },
          betterAnswer: { type: Type.STRING },
          isFinished: { type: Type.BOOLEAN },
        },
        required: ["reply", "isFinished"],
      },
    },
  });

  return JSON.parse(response.text || '{}') as SimulationResponse;
};
