export interface IGrantUpdateBase {
  title: string;
  text: string;
  proofOfWork?: string;
  completionPercentage?: string;
  pitchDeck?: string;
  demoVideo?: string;
  trackExplanations?: Array<{
    trackId: string;
    trackName: string;
    explanation: string;
  }>;
}
