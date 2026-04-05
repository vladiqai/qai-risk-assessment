export const PRIMARY_WORKFLOW_OPTIONS = [
  "Credit scoring",
  "Fraud detection",
  "KYC / AML onboarding",
  "Customer service AI / chatbot",
  "Underwriting",
  "Claims automation",
  "Collections / recoveries",
  "Loan origination",
  "Transaction monitoring",
  "Document intelligence",
  "Case triage",
  "Policy / procedure Q&A",
  "Internal copilots",
  "Agentic workflow automation",
  "Other"
] as const;

export const FUNCTION_OPTIONS = [
  "CTO / Engineering leadership",
  "Data science / ML",
  "MLOps / platform",
  "Application engineering",
  "Risk",
  "Compliance",
  "Security",
  "Legal",
  "Operations",
  "Product",
  "Customer support",
  "Internal audit",
  "Procurement",
  "Architecture",
  "Other"
] as const;

export const RECOMMENDATION_OPTIONS = [
  "Do not proceed",
  "Intro call only",
  "Technical diligence",
  "Narrow POC",
  "Commercial review"
] as const;

export const SCORED_QUESTIONS = [
  { id: "current_visibility", section: "currentStateFit", label: "We currently lack sufficient visibility into production AI behavior." },
  { id: "change_explainability", section: "currentStateFit", label: "We struggle to explain what changed after model, prompt, RAG, or policy updates." },
  { id: "monitoring_fragmentation", section: "currentStateFit", label: "Our current monitoring is fragmented across teams or tools." },
  { id: "incident_attribution_need", section: "currentStateFit", label: "We would benefit from automated incident attribution." },
  { id: "evidence_generation_need", section: "currentStateFit", label: "We would benefit from audit-ready evidence generation." },
  { id: "integration_realism", section: "technicalAssessment", label: "Claimed integration approach looks realistic." },
  { id: "log_access_acceptability", section: "technicalAssessment", label: "Required data or log access seems acceptable." },
  { id: "architecture_compatibility", section: "technicalAssessment", label: "Product appears compatible with our model or provider architecture." },
  { id: "detection_claims_poc", section: "technicalAssessment", label: "Detection claims appear credible enough for a POC." },
  { id: "attribution_claims_poc", section: "technicalAssessment", label: "Attribution claims appear credible enough for a POC." },
  { id: "alert_noise_manageability", section: "technicalAssessment", label: "Risk of alert noise or false positives seems manageable." },
  { id: "engineering_effort_value", section: "technicalAssessment", label: "Engineering effort appears proportionate to expected value." },
  { id: "evidence_usefulness", section: "complianceAuditUsefulness", label: "Evidence packs would be useful to Compliance or Legal." },
  { id: "manual_reconstruction_reduction", section: "complianceAuditUsefulness", label: "Outputs would reduce manual incident reconstruction work." },
  { id: "traceability_value", section: "complianceAuditUsefulness", label: "Traceability of changes and incidents seems valuable." },
  { id: "governance_review_support", section: "complianceAuditUsefulness", label: "Product could support internal governance reviews." },
  { id: "regulator_readiness_support", section: "complianceAuditUsefulness", label: "Product could help with regulator-facing readiness." }
] as const;

export const FUNCTIONAL_RELEVANCE_QUESTIONS = [
  { id: "vendor_solves_real_problem", label: "This assessment maps to a real problem we have today." },
  { id: "relevant_to_stack", label: "The problem area appears relevant for our production AI stack." },
  { id: "additive_vs_duplicative", label: "A solution in this category is more likely additive than duplicative to current tooling." },
  { id: "usable_without_replacing_workflows", label: "A solution in this category could be used without replacing current workflows." },
  { id: "value_clear_beyond_governance_language", label: "The value of a solution in this category is clear beyond generic AI governance language." }
] as const;

export const SECURITY_PRIVACY_QUESTIONS = [
  { id: "comfortable_sharing_required_logs", label: "We are comfortable sharing the required logs or data for a POC." },
  { id: "pii_exposure_manageable", label: "PII or confidential-data exposure appears manageable." },
  { id: "deployment_model_fit", label: "Hosting or deployment model could fit our requirements." },
  { id: "governance_requirements_supportable", label: "A vendor in this category appears able to support our governance requirements." },
  { id: "no_immediate_security_blocker", label: "No immediate blocker is visible from a security or privacy perspective." }
] as const;

export const COMMERCIAL_SANITY_QUESTIONS = [
  { id: "pricing_vs_value", label: "Pricing seems in line with potential value." },
  { id: "poc_commercial_clarity", label: "POC offer is clear and commercially acceptable." },
  { id: "roi_plausibility", label: "Expected ROI is plausible for our environment." },
  { id: "path_to_scaled_usage", label: "We see a credible path from pilot to scaled usage." }
] as const;

export const POC_GATES = [
  { id: "gate_problem_real", label: "Problem is real and current" },
  { id: "gate_integration_feasible", label: "Integration is feasible" },
  { id: "gate_compliance_will_use_outputs", label: "Compliance / risk would use the outputs" },
  { id: "gate_no_security_blocker", label: "No immediate data or security blocker exists" }
] as const;
