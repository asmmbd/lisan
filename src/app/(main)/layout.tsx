import { BottomNav } from '@/components/lisan/bottom-nav';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
