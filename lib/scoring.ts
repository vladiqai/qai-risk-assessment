import {
  COMMERCIAL_SANITY_QUESTIONS,
  FUNCTIONAL_RELEVANCE_QUESTIONS,
  SCORED_QUESTIONS,
  SECURITY_PRIVACY_QUESTIONS
} from "@/lib/options";
import type { AssessmentSubmissionInput, FitBand, ScoringResult } from "@/types/assessment";

const HIGH_PRIORITY_MIN = 65;
const REVIEW_MIN = 45;

export function getMaxScore() {
  const numericMax = SCORED_QUESTIONS.length * 5;
  const yesNoMax =
    FUNCTIONAL_RELEVANCE_QUESTIONS.length +
    SECURITY_PRIVACY_QUESTIONS.length +
    COMMERCIAL_SANITY_QUESTIONS.length;
  return numericMax + yesNoMax;
}

export function scoreAssessment(
  input: Pick<AssessmentSubmissionInput, "numericScores" | "yesNoAssessments">
): ScoringResult {
  const numericScore = Object.values(input.numericScores).reduce(
    (sum, value) => sum + (typeof value === "number" ? value : 0),
    0
  );

  const yesNoScore = Object.values(input.yesNoAssessments).reduce(
    (sum, value) => sum + (value === "Yes" ? 1 : 0),
    0
  );

  return {
    numericScore,
    yesNoScore,
    totalScore: numericScore + yesNoScore
  };
}

export function getFitBand(totalScore: number): FitBand {
  if (totalScore >= HIGH_PRIORITY_MIN) {
    return {
      key: "highPriority",
      label: "High priority",
      rangeLabel: `${HIGH_PRIORITY_MIN}-${getMaxScore()}`
    };
  }

  if (totalScore >= REVIEW_MIN) {
    return {
      key: "review",
      label: "Review",
      rangeLabel: `${REVIEW_MIN}-${HIGH_PRIORITY_MIN - 1}`
    };
  }

  return {
    key: "lighterFit",
    label: "Lighter fit",
    rangeLabel: `0-${REVIEW_MIN - 1}`
  };
}
