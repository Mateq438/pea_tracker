import BottomNav from '@/components/ui/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto relative min-h-screen">
      {children}
      <BottomNav />
    </div>
  )
}
