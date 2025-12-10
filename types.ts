export interface MusicAnalysis {
  bpm: number;
  key: string;
  mood: string;
  explanation: string;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface FileData {
  name: string;
  url: string;
  base64: string;
  mimeType: string;
}