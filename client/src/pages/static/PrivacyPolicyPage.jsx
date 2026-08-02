// client/src/pages/static/PrivacyPolicyPage.jsx
import StaticPageLayout from './StaticPageLayout';

export default function PrivacyPolicyPage() {
  return (
    <StaticPageLayout title="Privacy Policy">
      <p>We collect only the information necessary to provide location tracking services: your account details and the location data your devices report.</p>
      <p>Location history is stored securely and is only accessible to your authenticated account. We do not sell or share your location data with third parties.</p>
      <p>You may request deletion of your account and all associated data at any time from your Profile Settings page.</p>
    </StaticPageLayout>
  );
}