// client/src/components/layout/AppLayout.jsx
import Navbar from './Navbar';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}