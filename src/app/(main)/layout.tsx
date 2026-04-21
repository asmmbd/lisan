import { BottomNav } from '@/components/lisan/bottom-nav';
import { Sidebar } from '@/components/lisan/sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="main-layout-content flex-1 flex flex-col min-w-0">
        <main className="flex-1 pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto w-full px-0 md:px-6 lg:px-8">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
