export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AIState {
  isGenerating: boolean;
  error: string | null;
  suggestion: string | null;
  type: 'summary' | 'continuation' | 'fix' | 'tags' | null;
}

export enum AIServiceTask {
  SUMMARIZE = 'SUMMARIZE',
  CONTINUE = 'CONTINUE',
  FIX_GRAMMAR = 'FIX_GRAMMAR',
  GENERATE_TAGS = 'GENERATE_TAGS',
  GENERATE_TITLE = 'GENERATE_TITLE'
}