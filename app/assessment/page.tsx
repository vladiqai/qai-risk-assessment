import { AssessmentForm } from "@/components/AssessmentForm";

export default function AssessmentPage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">QAi</span>
          <h1>AI Monitoring &amp; Compliance Risk Assessment</h1>
          <p>
            This assessment helps your team evaluate current-state gaps across
            production AI monitoring, incident attribution, auditability, data
            exposure, and POC readiness.
          </p>
          <div className="hero-note">
            Complete it collaboratively across engineering, risk, compliance,
            security, and operations.
          </div>
        </div>
      </section>

      <AssessmentForm />
    </main>
  );
}
