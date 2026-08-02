// client/src/pages/static/TermsPage.jsx
import StaticPageLayout from './StaticPageLayout';

export default function TermsPage() {
  return (
    <StaticPageLayout title="Terms & Conditions">
      <p>By using Device Tracker, you agree to use the service responsibly and only track devices you own or have explicit permission to monitor.</p>
      <p>We reserve the right to suspend accounts found to be misusing the location tracking features for unauthorized surveillance.</p>
      <p>This service is provided as-is without warranty of any kind.</p>
    </StaticPageLayout>
  );
}