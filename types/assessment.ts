export type YesNo = "Yes" | "No";
export type PocGateValue = "Yes" | "No" | "Not at this time";

export type AssessmentSubmissionInput = {
  companyName: string;
  primaryContact: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  countryRegion: string;
  contributingFunctions: string[];
  contributingFunctionsOther: string;
  primaryWorkflow: string;
  workflowOther: string;
  recommendation: string;
  bestWorkflowForPoc: string;
  reasonToProceed: string;
  reasonNotToProceed: string;
  biggestUnansweredQuestion: string;
  numericScores: Record<string, number | null>;
  yesNoAssessments: Record<string, YesNo | null>;
  notes: Record<string, string>;
  pocGates: Record<string, PocGateValue>;
  partnerToken?: string;
  sourceUrl?: string;
};

export type ScoringResult = {
  numericScore: number;
  yesNoScore: number;
  totalScore: number;
};

export type FitBand = {
  key: "highPriority" | "review" | "lighterFit";
  label: "High priority" | "Review" | "Lighter fit";
  rangeLabel: string;
};

export type AssessmentEmailPayload = {
  submissionId: string;
  submittedAt: string;
  payload: AssessmentSubmissionInput;
  scoring: ScoringResult;
  fitBand: FitBand;
};
