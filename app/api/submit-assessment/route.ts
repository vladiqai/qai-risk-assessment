import { NextRequest, NextResponse } from "next/server";
import { getFitBand, scoreAssessment } from "@/lib/scoring";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendAssessmentEmails } from "@/lib/resend";
import { assessmentSubmissionSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 30;

function getMissingEnv(names: string[]) {
  return names.filter((name) => !process.env[name]);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();

    const parsed = assessmentSubmissionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Validation failed",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const scoring = scoreAssessment(payload);
    const fitBand = getFitBand(scoring.totalScore);

    const missingSupabaseEnv = getMissingEnv([
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]);

    if (missingSupabaseEnv.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Missing server env: ${missingSupabaseEnv.join(", ")}`,
        },
        { status: 500 }
      );
    }

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
          yesNoAssessments: payload.yesNoAssessments,
        },
        notes: payload.notes,
        poc_gates: payload.pocGates,
        source_url: sourceUrl,
        user_agent: request.headers.get("user-agent"),
        partner_token: payload.partnerToken,
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Supabase insert failed", error);
      return NextResponse.json(
        {
          ok: false,
          error: `Failed to store submission: ${error.message}`,
        },
        { status: 500 }
      );
    }

    let emailWarning: string | null = null;

    const missingEmailEnv = getMissingEnv([
      "RESEND_API_KEY",
      "QAI_RESULTS_EMAIL",
      "FROM_EMAIL",
    ]);

    if (missingEmailEnv.length === 0) {
      try {
        await sendAssessmentEmails({
          submissionId: data.id,
          submittedAt: data.created_at,
          payload,
          scoring,
          fitBand,
        });
      } catch (emailError) {
        console.error("Assessment emails failed", emailError);
        emailWarning = `Stored successfully, but emails failed: ${getErrorMessage(emailError)}`;
      }
    } else {
      emailWarning = `Stored successfully, but email env is missing: ${missingEmailEnv.join(", ")}`;
    }

    return NextResponse.json({
      ok: true,
      submissionId: data.id,
      totalScore: scoring.totalScore,
      fitBand,
      emailWarning,
    });
  } catch (error) {
    console.error("Submission route failed", error);

    return NextResponse.json(
      {
        ok: false,
        error: `Unexpected server error: ${getErrorMessage(error)}`,
      },
      { status: 500 }
    );
  }
}
