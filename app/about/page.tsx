export const dynamic = 'force-static';
export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 prose">
      <h1>About</h1>
      <p>
        MailApp is a modern bulk email platform designed to help you create, upload, and send campaigns reliably at scale.
        It focuses on clear workflows, responsive UI, and sensible defaults so you can move from idea to inbox quickly.
      </p>
      <h2>What you can do</h2>
      <ul>
        <li>Sign in with your Google account and send campaigns using Gmail.</li>
        <li>Create reusable templates with variables for personalized emails.</li>
        <li>Upload CSV files and manage recipients grouped by each upload.</li>
        <li>Run campaigns in the background with automatic pacing and retries.</li>
        <li>Track progress and delivery outcomes per campaign.</li>
        <li>Provide one‑click unsubscribe links for compliance and user control.</li>
      </ul>
      <p>
        MailApp runs fully on serverless infrastructure and is designed for teams who want a straightforward, dependable
        tool to send legitimate, permission‑based email at scale—without operational overhead.
      </p>
      <h2>Privacy & safety</h2>
      <p>
        We only store the minimum data required to operate the service and deliver your emails. Access to your Google
        account is limited to sending email you explicitly authorize. You can revoke access at any time from your Google
        account settings.
      </p>
      <h2>About the developer</h2>
      <p>
        Built and maintained by Farzan Arshad. Learn more or get in touch at
        {' '}<a href="https://www.farzanfa.com" target="_blank" rel="noopener noreferrer">www.farzanfa.com</a>.
      </p>
    </main>
  );
}



