import { Sidebar } from '@/components/layout/Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AppLayout({ children, params }: AppLayoutProps) {
  const { locale } = await params;
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar locale={locale} />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="flex h-14 items-center border-b px-6">
          <div className="ml-auto flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted" />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
