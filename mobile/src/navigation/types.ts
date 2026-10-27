export type RootStackParamList = {
  Tabs: undefined;
  InterviewSetup: undefined;
  InterviewSession: { roleTitle: string; jobDescription?: string };
  FlashcardReview: { deckId?: number; title?: string } | undefined;
};
export type TabParamList = { Dashboard: undefined; Decks: undefined };
