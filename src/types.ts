export interface ChatMessage {
  role: "user" | "model";
  content: string;
  timestamp?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  summary: string;
  mood: string;
  topics: string[];
  tags: string[];
  conversation: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  entryType?: "dialogue" | "direct";
}

export interface InsightReport {
  id?: string;
  userId: string;
  title: string;
  observations: string[];
  reflectionPrompts: string[];
  patterns: { pattern: string; context: string }[];
  recurringTopics: { topic: string; count: number }[];
  moodDistribution: Record<string, number>;
  growthSummary: string;
  createdAt: string;
}

export type ActiveTab = "dashboard" | "chat" | "journals" | "insights" | "profile" | "audit";

export interface SecurityStatusResponse {
  architecture: string;
  serverSideGemini: boolean;
  geminiClientExposed: boolean;
  secretSource: string;
  firestoreRulesEnforced: boolean;
  dataIsolationPattern: string;
  authenticationProvider: string;
  zeroTrustClientValidation: boolean;
  leastPrivilegeModel: boolean;
}
