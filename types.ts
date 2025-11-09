export enum DreamState {
  IDLE,
  RECORDING,
  ANALYZING,
  COMPLETE,
  ERROR,
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface DreamData {
  transcript: string;
  imageUrl: string;
  interpretation: string;
}
