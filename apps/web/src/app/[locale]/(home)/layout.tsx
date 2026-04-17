import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';

interface HomeLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function HomeLayout({ children, params }: HomeLayoutProps) {
  const { locale } = await params;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} />
    </div>
  );
}
