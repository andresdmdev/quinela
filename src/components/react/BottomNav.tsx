import { useEffect, useState } from 'react';

interface ProfileMeResponse {
  email: string | null;
  is_admin: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

/**
 * Renders the bottom navigation bar with an admin tab when applicable.
 * Fetches the current user profile to determine admin access.
 */
export function BottomNav(): React.JSX.Element {
  const [pathname, setPathname] = useState<string>('/');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect((): void => {
    setPathname(window.location.pathname);

    async function loadProfile(): Promise<void> {
      try {
        const response = await fetch('/api/profile/me');

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as ProfileMeResponse;
        setIsAdmin(data.is_admin);
      } catch {
        // Silently ignore - navigation should still work
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  const items: NavItem[] = [
    { href: '/', label: 'Inicio', icon: '🏠' },
    { href: '/pronosticar', label: 'Pronosticar', icon: '⚽' },
    { href: '/ranking', label: 'Ranking', icon: '🏆' },
    { href: '/historial', label: 'Historial', icon: '📜' }
  ];

  if (isAdmin) {
    items.push({ href: '/admin/perfiles', label: 'Admin', icon: '⚙️' });
  }

  if (loading) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-[rgba(2,48,71,0.08)] px-2 py-2 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center h-[60px]">
          <div className="animate-pulse bg-[rgba(2,48,71,0.06)] rounded-xl w-12 h-10"></div>
          <div className="animate-pulse bg-[rgba(2,48,71,0.06)] rounded-xl w-12 h-10"></div>
          <div className="animate-pulse bg-[rgba(2,48,71,0.06)] rounded-xl w-12 h-10"></div>
          <div className="animate-pulse bg-[rgba(2,48,71,0.06)] rounded-xl w-12 h-10"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-[rgba(2,48,71,0.08)] px-2 py-2 z-50">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {items.map((item: NavItem) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[64px] ${
                isActive
                  ? 'bg-gradient-to-r from-[#FFB703] to-[#FB8500] text-[#1A1A2E] shadow-md shadow-[rgba(251,133,0,0.3)]'
                  : 'text-[#6B7280] hover:text-[#023047]'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-bold">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
