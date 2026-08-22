// client/src/components/layout/AppLayout.jsx
import Navbar from './Navbar';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col lg:pl-[240px] pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}