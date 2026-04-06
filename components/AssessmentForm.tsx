"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  COMMERCIAL_SANITY_QUESTIONS,
  FUNCTION_OPTIONS,
  FUNCTIONAL_RELEVANCE_QUESTIONS,
  POC_GATES,
  PRIMARY_WORKFLOW_OPTIONS,
  RECOMMENDATION_OPTIONS,
  SECURITY_PRIVACY_QUESTIONS,
  SCORED_QUESTIONS
} from "@/lib/options";
import { getFitBand, getMaxScore, scoreAssessment } from "@/lib/scoring";
import { trackAssessmentEvent } from "@/lib/analytics";
import type { AssessmentSubmissionInput, FitBand } from "@/types/assessment";

const emptyNumericScores = Object.fromEntries(
  SCORED_QUESTIONS.map((question) => [question.id, null])
) as Record<string, number | null>;

const emptyYesNo = Object.fromEntries(
  [
    ...FUNCTIONAL_RELEVANCE_QUESTIONS,
    ...SECURITY_PRIVACY_QUESTIONS,
    ...COMMERCIAL_SANITY_QUESTIONS
  ].map((question) => [question.id, null])
) as Record<string, "Yes" | "No" | null>;

const emptyPocGates = Object.fromEntries(
  POC_GATES.map((gate) => [gate.id, "Not at this time"])
) as Record<string, "Yes" | "No" | "Not at this time">;

const initialState: AssessmentSubmissionInput = {
  companyName: "",
  primaryContact: "",
  contactTitle: "",
  contactEmail: "",
  contactPhone: "",
  countryRegion: "",
  contributingFunctions: [],
  contributingFunctionsOther: "",
  primaryWorkflow: "",
  workflowOther: "",
  recommendation: "",
  bestWorkflowForPoc: "",
  reasonToProceed: "",
  reasonNotToProceed: "",
  biggestUnansweredQuestion: "",
  numericScores: emptyNumericScores,
  yesNoAssessments: emptyYesNo,
  notes: {},
  pocGates: emptyPocGates,
  partnerToken: "",
  sourceUrl: ""
};

export function AssessmentForm() {
  const [form, setForm] = useState<AssessmentSubmissionInput>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const hasTrackedStart = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const partnerToken = params.get("p") ?? "";
    setForm((current) => ({
      ...current,
      partnerToken,
      sourceUrl: window.location.href
    }));
  }, []);

  const scoring = useMemo(() => scoreAssessment(form), [form]);
  const maxScore = getMaxScore();
  const fitBand = getFitBand(scoring.totalScore);

  function markStarted() {
    if (hasTrackedStart.current) return;
    hasTrackedStart.current = true;
    trackAssessmentEvent("assessment_started");
  }

  function updateField<K extends keyof AssessmentSubmissionInput>(
    key: K,
    value: AssessmentSubmissionInput[K]
  ) {
    markStarted();
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateNumericScore(questionId: string, value: string) {
    markStarted();
    setForm((current) => ({
      ...current,
      numericScores: {
        ...current.numericScores,
        [questionId]: value ? Number(value) : null
      }
    }));
  }

  function updateYesNo(questionId: string, value: "Yes" | "No") {
    markStarted();
    setForm((current) => ({
      ...current,
      yesNoAssessments: {
        ...current.yesNoAssessments,
        [questionId]: value
      }
    }));
  }

  function updateNote(questionId: string, value: string) {
    setForm((current) => ({
      ...current,
      notes: {
        ...current.notes,
        [questionId]: value
      }
    }));
  }

  function updateGate(
    gateId: string,
    value: "Yes" | "No" | "Not at this time"
  ) {
    setForm((current) => ({
      ...current,
      pocGates: {
        ...current.pocGates,
        [gateId]: value
      }
    }));
  }

  function handleFunctionsChange(event: React.ChangeEvent<HTMLSelectElement>) {
    markStarted();
    const selected = Array.from(event.target.selectedOptions).map(
      (option) => option.value
    );
    updateField("contributingFunctions", selected);
  }

  function handleDownloadJson() {
    const payload = {
      ...form,
      scoring: {
        totalScore: scoring.totalScore,
        numericScore: scoring.numericScore,
        yesNoScore: scoring.yesNoScore,
        maxScore
      },
      fitBand
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "qai-assessment.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    if (!window.confirm("Clear all entered data?")) return;
    setForm(initialState);
    setSubmitError("");
    setSubmitMessage("");
    setSubmissionId("");
    hasTrackedStart.current = false;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitMessage("");

    try {
      const response = await fetch("/api/submit-assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          sourceUrl: typeof window !== "undefined" ? window.location.href : ""
        })
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Submission failed");
      }

      setSubmissionId(result.submissionId);
setSubmitMessage(
  result.emailWarning
    ? `Assessment submitted successfully.\n${result.emailWarning}`
    : "Assessment submitted successfully.\nQAi has received the results."
);
      trackAssessmentEvent("assessment_submitted", {
        totalScore: result.totalScore,
        fitBand: result.fitBand?.label ?? fitBand.label
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Submission failed";
      setSubmitError(message);
      trackAssessmentEvent("assessment_submission_failed", { reason: message });
    } finally {
      setSubmitting(false);
    }
  }

  function renderScoreBadge(band: FitBand) {
    return (
      <div className={`fit-band fit-band--${band.key}`}>
        <strong>{band.label}</strong>
        <span>{band.rangeLabel}</span>
      </div>
    );
  }

  return (
    <form className="assessment-form" onSubmit={handleSubmit}>
      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Company &amp; contact</h2>
            <p>
              Tell us who is completing the assessment so QAi can review and
              respond appropriately.
            </p>
          </div>
        </div>

        <div className="grid two-up">
          <label className="field">
            <span>Company name *</span>
            <input
              required
              value={form.companyName}
              onChange={(event) => updateField("companyName", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Primary contact *</span>
            <input
              required
              value={form.primaryContact}
              onChange={(event) =>
                updateField("primaryContact", event.target.value)
              }
            />
          </label>

          <label className="field">
            <span>Title / function</span>
            <input
              value={form.contactTitle}
              onChange={(event) => updateField("contactTitle", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Contact email *</span>
            <input
              required
              type="email"
              value={form.contactEmail}
              onChange={(event) => updateField("contactEmail", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Phone</span>
            <input
              value={form.contactPhone}
              onChange={(event) => updateField("contactPhone", event.target.value)}
            />
          </label>

          <label className="field">
  <span>Country / region</span>
  <input
    placeholder="Type your country or region"
    value={form.countryRegion}
    onChange={(event) => updateField("countryRegion", event.target.value)}
  />
</label>
        </div>

        <div className="grid two-up">
          <label className="field">
            <span>Primary workflow under review *</span>
            <select
              required
              value={form.primaryWorkflow}
              onChange={(event) =>
                updateField("primaryWorkflow", event.target.value)
              }
            >
              <option value="">Select a workflow</option>
              {PRIMARY_WORKFLOW_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Functions contributing *</span>
            <select
              multiple
              required
              value={form.contributingFunctions}
              onChange={handleFunctionsChange}
              className="multi-select"
            >
              {FUNCTION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <small>Use Ctrl/Cmd + click for multiple selections.</small>
          </label>
        </div>

        {(form.primaryWorkflow === "Other" ||
          form.contributingFunctions.includes("Other")) && (
          <div className="grid two-up">
            {form.primaryWorkflow === "Other" && (
              <label className="field">
                <span>Other workflow</span>
                <input
                  value={form.workflowOther}
                  onChange={(event) => updateField("workflowOther", event.target.value)}
                />
              </label>
            )}

            {form.contributingFunctions.includes("Other") && (
              <label className="field">
                <span>Other contributing function(s)</span>
                <input
                  value={form.contributingFunctionsOther}
                  onChange={(event) =>
                    updateField("contributingFunctionsOther", event.target.value)
                  }
                />
              </label>
            )}
          </div>
        )}
      </section>

      <ScoredSection
        title="1. Current-state fit"
        description="Rate each item from 1 (low) to 5 (high)."
        questions={SCORED_QUESTIONS.filter(
          (question) => question.section === "currentStateFit"
        )}
        values={form.numericScores}
        notes={form.notes}
        onScoreChange={updateNumericScore}
        onNoteChange={updateNote}
      />

      <YesNoSection
        title="2. Functional relevance"
        description="Mark Yes or No and add notes where useful."
        questions={FUNCTIONAL_RELEVANCE_QUESTIONS}
        values={form.yesNoAssessments}
        notes={form.notes}
        onChange={updateYesNo}
        onNoteChange={updateNote}
      />

      <ScoredSection
        title="3. Technical assessment"
        description="Rate each item from 1 (low) to 5 (high)."
        questions={SCORED_QUESTIONS.filter(
          (question) => question.section === "technicalAssessment"
        )}
        values={form.numericScores}
        notes={form.notes}
        onScoreChange={updateNumericScore}
        onNoteChange={updateNote}
      />

      <YesNoSection
        title="4. Security, privacy, and governance"
        description="Mark Yes or No and add notes where useful."
        questions={SECURITY_PRIVACY_QUESTIONS}
        values={form.yesNoAssessments}
        notes={form.notes}
        onChange={updateYesNo}
        onNoteChange={updateNote}
      />

      <ScoredSection
        title="5. Compliance and audit usefulness"
        description="Rate each item from 1 (low) to 5 (high)."
        questions={SCORED_QUESTIONS.filter(
          (question) => question.section === "complianceAuditUsefulness"
        )}
        values={form.numericScores}
        notes={form.notes}
        onScoreChange={updateNumericScore}
        onNoteChange={updateNote}
      />

      <YesNoSection
        title="6. Commercial sanity check"
        description="Mark Yes or No and add notes where useful."
        questions={COMMERCIAL_SANITY_QUESTIONS}
        values={form.yesNoAssessments}
        notes={form.notes}
        onChange={updateYesNo}
        onNoteChange={updateNote}
      />

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>7. Overall recommendation</h2>
            <p>
              Add directional comments for QAi’s team and your internal
              stakeholders.
            </p>
          </div>
          {renderScoreBadge(fitBand)}
        </div>

        <div className="summary-grid">
          <div className="score-panel">
            <div className="muted-label">Combined score</div>
            <div className="score-figure">
              {scoring.totalScore} / {maxScore}
            </div>
            <div className="score-breakdown">
              <span>Numeric score: {scoring.numericScore}</span>
              <span>Yes/No score: {scoring.yesNoScore}</span>
            </div>
            <ul className="band-list">
              <li className={fitBand.key === "highPriority" ? "band active high" : "band"}>
                High priority · 65–99
              </li>
              <li className={fitBand.key === "review" ? "band active review" : "band"}>
                Review · 45–64
              </li>
              <li className={fitBand.key === "lighterFit" ? "band active light" : "band"}>
                Lighter fit · 0–44
              </li>
            </ul>
          </div>

          <div className="fields-stack">
            <label className="field">
              <span>Recommendation</span>
              <select
                value={form.recommendation}
                onChange={(event) => updateField("recommendation", event.target.value)}
              >
                <option value="">Select a recommendation</option>
                {RECOMMENDATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Best candidate workflow for POC</span>
              <textarea
                value={form.bestWorkflowForPoc}
                onChange={(event) =>
                  updateField("bestWorkflowForPoc", event.target.value)
                }
              />
            </label>

            <label className="field">
              <span>Main reason to proceed</span>
              <textarea
                value={form.reasonToProceed}
                onChange={(event) => updateField("reasonToProceed", event.target.value)}
              />
            </label>

            <label className="field">
              <span>Main reason not to proceed</span>
              <textarea
                value={form.reasonNotToProceed}
                onChange={(event) =>
                  updateField("reasonNotToProceed", event.target.value)
                }
              />
            </label>

            <label className="field">
              <span>Biggest unanswered question</span>
              <textarea
                value={form.biggestUnansweredQuestion}
                onChange={(event) =>
                  updateField("biggestUnansweredQuestion", event.target.value)
                }
              />
            </label>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Mandatory POC gates</h2>
            <p>
              These do not affect the score. They help QAi understand POC
              readiness and timing.
            </p>
          </div>
        </div>

        <div className="gate-list">
          {POC_GATES.map((gate) => (
            <label className="field" key={gate.id}>
              <span>{gate.label}</span>
              <select
                required
                value={form.pocGates[gate.id] ?? "Not at this time"}
                onChange={(event) =>
                  updateGate(
                    gate.id,
                    event.target.value as "Yes" | "No" | "Not at this time"
                  )
                }
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Not at this time">Not at this time</option>
              </select>
            </label>
          ))}
        </div>
      </section>

      <section className="card toolbar-card">
        <div className="toolbar-row">
          <button type="button" className="button ghost" onClick={() => window.print()}>
            Print / Save PDF
          </button>
          <button type="button" className="button ghost" onClick={handleDownloadJson}>
            Download answers (.json)
          </button>
          <button type="button" className="button ghost" onClick={handleReset}>
            Clear form
          </button>
          <button type="submit" className="button primary" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit results to QAi"}
          </button>
        </div>

        {submitMessage && (
          <div className="callout success">
            <strong>Success.</strong> {submitMessage}
            {submissionId ? <div>Submission ID: {submissionId}</div> : null}
          </div>
        )}

        {submitError && (
          <div className="callout error">
            <strong>Submission failed.</strong> {submitError}
          </div>
        )}
      </section>
    </form>
  );
}

function ScoredSection({
  title,
  description,
  questions,
  values,
  notes,
  onScoreChange,
  onNoteChange
}: {
  title: string;
  description: string;
questions: ReadonlyArray<{ id: string; label: string }>;  
  values: Record<string, number | null>;
  notes: Record<string, string>;
  onScoreChange: (questionId: string, value: string) => void;
  onNoteChange: (questionId: string, value: string) => void;
}) {
  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="table-wrap">
        <table className="assessment-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Score</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((question) => (
              <tr key={question.id}>
                <td>{question.label}</td>
                <td className="score-cell">
                  <select
                    value={values[question.id] ?? ""}
                    onChange={(event) => onScoreChange(question.id, event.target.value)}
                  >
                    <option value="">–</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </td>
                <td>
                  <textarea
                    value={notes[question.id] ?? ""}
                    onChange={(event) => onNoteChange(question.id, event.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function YesNoSection({
  title,
  description,
  questions,
  values,
  notes,
  onChange,
  onNoteChange
}: {
  title: string;
  description: string;
  questions: ReadonlyArray<{ id: string; label: string }>;
  values: Record<string, "Yes" | "No" | null>;
  notes: Record<string, string>;
  onChange: (questionId: string, value: "Yes" | "No") => void;
  onNoteChange: (questionId: string, value: string) => void;
}) {
  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="table-wrap">
        <table className="assessment-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Assessment</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((question) => (
              <tr key={question.id}>
                <td>{question.label}</td>
              <td className="yes-no-cell">
  <div className="yes-no-group">
   <td className="yes-no-cell">
  <fieldset className="yes-no-group">
    <legend className="sr-only">{question.label}</legend>

    <label className="inline-choice">
      <input
        type="radio"
        name={question.id}
        checked={values[question.id] === "Yes"}
        onChange={() => onChange(question.id, "Yes")}
      />
      <span>Yes</span>
    </label>

    <label className="inline-choice">
      <input
        type="radio"
        name={question.id}
        checked={values[question.id] === "No"}
        onChange={() => onChange(question.id, "No")}
      />
      <span>No</span>
    </label>
  </fieldset>
</td>
                <td>
                  <textarea
                    value={notes[question.id] ?? ""}
                    onChange={(event) => onNoteChange(question.id, event.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
