export interface Report {
  id: string;
  date: string;
  rawInput: string;
  activity: string;
  learning: string;
  obstacle: string;
  createdAt: string;
}

export interface AiResponse {
  activity: string;
  learning: string;
  obstacle: string;
}
