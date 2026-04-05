import { NextRequest, NextResponse } from "next/server";
import { getFitBand, scoreAssessment } from "@/lib/scoring";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendAssessmentEmails } from "@/lib/resend";
import { assessmentSubmissionSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = assessmentSubmissionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Validation failed",
          issues: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const scoring = scoreAssessment(payload);
    const fitBand = getFitBand(scoring.totalScore);

    const supabase = getSupabaseAdmin();
    const sourceUrl =
      request.headers.get("origin") ??
      request.headers.get("referer") ??
      payload.sourceUrl ??
      null;

    const { data, error } = await supabase
      .from("assessment_submissions")
      .insert({
        company_name: payload.companyName,
        primary_contact: payload.primaryContact,
        contact_title: payload.contactTitle,
        contact_email: payload.contactEmail,
        contact_phone: payload.contactPhone,
        country_region: payload.countryRegion,
        contributing_functions: payload.contributingFunctions,
        contributing_functions_other: payload.contributingFunctionsOther,
        primary_workflow: payload.primaryWorkflow,
        workflow_other: payload.workflowOther,
        total_score: scoring.totalScore,
        fit_band: fitBand.label,
        recommendation: payload.recommendation,
        best_workflow_for_poc: payload.bestWorkflowForPoc,
        reason_to_proceed: payload.reasonToProceed,
        reason_not_to_proceed: payload.reasonNotToProceed,
        biggest_unanswered_question: payload.biggestUnansweredQuestion,
        answers: {
          numericScores: payload.numericScores,
          yesNoAssessments: payload.yesNoAssessments
        },
        notes: payload.notes,
        poc_gates: payload.pocGates,
        source_url: sourceUrl,
        user_agent: request.headers.get("user-agent"),
        partner_token: payload.partnerToken
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Supabase insert failed", error);
      return NextResponse.json(
        { ok: false, error: "Failed to store submission" },
        { status: 500 }
      );
    }

    await sendAssessmentEmails({
      submissionId: data.id,
      submittedAt: data.created_at,
      payload,
      scoring,
      fitBand
    });

    return NextResponse.json({
      ok: true,
      submissionId: data.id,
      totalScore: scoring.totalScore,
      fitBand
    });
  } catch (error) {
    console.error("Submission route failed", error);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
