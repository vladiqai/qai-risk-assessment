import { z } from "zod";
import { POC_GATES } from "@/lib/options";

const yesNoSchema = z.enum(["Yes", "No"]).nullable();
const gateSchema = z.enum(["Yes", "No", "Not at this time"]);

export const assessmentSubmissionSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  primaryContact: z.string().min(1, "Primary contact is required"),
  contactTitle: z.string().optional().default(""),
  contactEmail: z.string().email("Valid contact email is required"),
  contactPhone: z.string().optional().default(""),
  countryRegion: z.string().optional().default(""),
  contributingFunctions: z.array(z.string()).min(1, "Select at least one contributing function"),
  contributingFunctionsOther: z.string().optional().default(""),
  primaryWorkflow: z.string().min(1, "Primary workflow is required"),
  workflowOther: z.string().optional().default(""),
  recommendation: z.string().optional().default(""),
  bestWorkflowForPoc: z.string().optional().default(""),
  reasonToProceed: z.string().optional().default(""),
  reasonNotToProceed: z.string().optional().default(""),
  biggestUnansweredQuestion: z.string().optional().default(""),
  numericScores: z.record(z.string(), z.number().int().min(0).max(5).nullable()),
  yesNoAssessments: z.record(z.string(), yesNoSchema),
  notes: z.record(z.string(), z.string()).default({}),
  pocGates: z
    .record(z.string(), gateSchema)
    .refine(
      (value) => POC_GATES.every((gate) => value[gate.id] !== undefined),
      "All POC gates must be present"
    ),
  partnerToken: z.string().optional().default(""),
  sourceUrl: z.string().optional().default("")
});
