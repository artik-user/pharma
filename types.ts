export enum Difficulty {
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
}

export enum ExamPart {
  HOME = 'HOME',
  A = 'A', // Dyktando
  B = 'B', // Słuchanie (Test)
  C = 'C', // Czytanie
  D = 'D', // Mówienie (Symulacja)
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface DictationContent {
  text: string;
  topic: string;
}

export interface ListeningContent {
  script: string; // The text to be read aloud by TTS
  questions: Question[];
}

export interface ReadingContent {
  text: string;
  questions: Question[];
}

export interface ChatMessage {
  role: 'model' | 'user';
  text: string;
}

export interface SimulationResponse {
  reply: string;
  feedback?: string; // Optional feedback on the user's Polish
  betterAnswer?: string; // Example of a better/correct answer
  isFinished: boolean;
}