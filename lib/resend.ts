import { Resend } from "resend";
import type { AssessmentEmailPayload, FitBand, ScoringResult } from "@/types/assessment";

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getResendClient() {
  return new Resend(getEnv("RESEND_API_KEY"));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderList(items: string[]) {
  if (!items.length) return "<li>None provided</li>";
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderInternalHtml({
  submissionId,
  submittedAt,
  payload,
  scoring,
  fitBand
}: AssessmentEmailPayload) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.5">
      <h2 style="margin-bottom:8px;">New QAi assessment submission</h2>
      <p style="margin-top:0;color:#4b5563;">
        Submission ID: <strong>${submissionId}</strong><br />
        Submitted at: <strong>${escapeHtml(submittedAt)}</strong>
      </p>

      <h3>Company</h3>
      <ul>
        <li><strong>Company:</strong> ${escapeHtml(payload.companyName)}</li>
        <li><strong>Primary contact:</strong> ${escapeHtml(payload.primaryContact)}</li>
        <li><strong>Title:</strong> ${escapeHtml(payload.contactTitle || "-")}</li>
        <li><strong>Email:</strong> ${escapeHtml(payload.contactEmail)}</li>
        <li><strong>Phone:</strong> ${escapeHtml(payload.contactPhone || "-")}</li>
        <li><strong>Country / region:</strong> ${escapeHtml(payload.countryRegion || "-")}</li>
      </ul>

      <h3>Assessment summary</h3>
      <ul>
        <li><strong>Primary workflow:</strong> ${escapeHtml(payload.primaryWorkflow)}</li>
        <li><strong>Workflow other:</strong> ${escapeHtml(payload.workflowOther || "-")}</li>
        <li><strong>Contributing functions:</strong></li>
        <ul>${renderList(payload.contributingFunctions)}</ul>
        <li><strong>Total score:</strong> ${scoring.totalScore}</li>
        <li><strong>Numeric score:</strong> ${scoring.numericScore}</li>
        <li><strong>Yes / No score:</strong> ${scoring.yesNoScore}</li>
        <li><strong>Fit band:</strong> ${escapeHtml(fitBand.label)} (${escapeHtml(fitBand.rangeLabel)})</li>
        <li><strong>Recommendation:</strong> ${escapeHtml(payload.recommendation || "-")}</li>
      </ul>

      <h3>POC direction</h3>
      <ul>
        <li><strong>Best workflow for POC:</strong> ${escapeHtml(payload.bestWorkflowForPoc || "-")}</li>
        <li><strong>Reason to proceed:</strong> ${escapeHtml(payload.reasonToProceed || "-")}</li>
        <li><strong>Reason not to proceed:</strong> ${escapeHtml(payload.reasonNotToProceed || "-")}</li>
        <li><strong>Biggest unanswered question:</strong> ${escapeHtml(payload.biggestUnansweredQuestion || "-")}</li>
      </ul>

      <h3>POC gates</h3>
      <pre style="background:#f8fafc;padding:12px;border-radius:8px;overflow:auto;">${escapeHtml(JSON.stringify(payload.pocGates, null, 2))}</pre>

      <h3>Answers</h3>
      <pre style="background:#f8fafc;padding:12px;border-radius:8px;overflow:auto;">${escapeHtml(JSON.stringify({ numericScores: payload.numericScores, yesNoAssessments: payload.yesNoAssessments, notes: payload.notes }, null, 2))}</pre>
    </div>
  `;
}

function renderConfirmationHtml(
  payload: AssessmentEmailPayload["payload"],
  scoring: ScoringResult,
  fitBand: FitBand,
  submissionId: string
) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.6">
      <h2 style="margin-bottom:8px;">Thank you for completing the QAi assessment</h2>
      <p style="margin-top:0;color:#4b5563;">
        We have received your submission and will review it shortly.
      </p>

      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px;">
        <p><strong>Submission ID:</strong> ${escapeHtml(submissionId)}</p>
        <p><strong>Company:</strong> ${escapeHtml(payload.companyName)}</p>
        <p><strong>Primary workflow:</strong> ${escapeHtml(payload.primaryWorkflow)}</p>
        <p><strong>Total score:</strong> ${scoring.totalScore}</p>
        <p><strong>Fit band:</strong> ${escapeHtml(fitBand.label)} (${escapeHtml(fitBand.rangeLabel)})</p>
        <p><strong>Recommendation:</strong> ${escapeHtml(payload.recommendation || "-")}</p>
      </div>

      <p style="margin-top:16px;">
        If helpful, you can reply directly to this email and QAi can follow up with a tailored review,
        a discovery session, or a narrow POC discussion.
      </p>
    </div>
  `;
}

export async function sendAssessmentEmails(payload: AssessmentEmailPayload) {
  const resend = getResendClient();
  const from = getEnv("FROM_EMAIL");
  const internalTo = getEnv("QAI_RESULTS_EMAIL");

  const internalEmail = await resend.emails.send({
    from,
    to: [internalTo],
    subject: `New assessment submission — ${payload.payload.companyName}`,
    html: renderInternalHtml(payload),
    text: `New assessment submission from ${payload.payload.companyName}. Submission ID: ${payload.submissionId}. Score: ${payload.scoring.totalScore}.`
  });

  const confirmationEmail = await resend.emails.send({
    from,
    to: [payload.payload.contactEmail],
    subject: "Your QAi assessment submission",
    html: renderConfirmationHtml(
      payload.payload,
      payload.scoring,
      payload.fitBand,
      payload.submissionId
    ),
    text: `Thank you for completing the QAi assessment. Submission ID: ${payload.submissionId}. Score: ${payload.scoring.totalScore}.`
  });

  return { internalEmail, confirmationEmail };
}
