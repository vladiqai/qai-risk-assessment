import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing-shell">
      <div className="landing-card">
        <span className="eyebrow">QAi</span>
        <h1>AI Monitoring &amp; Compliance Risk Assessment</h1>
        <p>
          Use this assessment to understand whether production AI monitoring,
          drift attribution, and compliance evidence generation are a current
          operational priority for your organization.
        </p>
        <Link href="/assessment" className="primary-button">
          Open assessment
        </Link>
      </div>
    </main>
  );
}
