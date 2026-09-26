// client/src/components/layout/AppLayout.jsx
import Navbar from './Navbar';

export default function AppLayout({ children }) {
  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain relative isolate pb-16 md:pb-0 lg:pl-[240px]">
        {children}
      </main>
    </div>
  );
}