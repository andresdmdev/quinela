import { useEffect, useMemo, useState } from 'react';
import { Toast } from './ui/Toast';

interface AdminProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_enabled: boolean;
  created_at: string;
}

interface AdminProfilesResponse {
  profiles: AdminProfile[];
}

/**
 * Renders the admin list of profiles with enable/disable controls.
 */
export function AdminProfilesList(): React.JSX.Element {
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect((): void => {
    async function loadProfiles(): Promise<void> {
      try {
        const response = await fetch('/api/admin/profiles');

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Error ${response.status}`);
        }

        const data = (await response.json()) as AdminProfilesResponse;
        setProfiles(data.profiles);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setToast({ message, type: 'error' });
      } finally {
        setLoading(false);
      }
    }

    void loadProfiles();
  }, []);

  async function toggleProfile(profileId: string, newValue: boolean): Promise<void> {
    setUpdating((previous) => ({ ...previous, [profileId]: true }));

    try {
      const response = await fetch('/api/admin/profiles/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, isEnabled: newValue })
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? 'Error actualizando perfil');
      }

      setProfiles((previous) =>
        previous.map((profile) =>
          profile.id === profileId ? { ...profile, is_enabled: newValue } : profile
        )
      );

      setToast({ message: newValue ? 'Perfil habilitado' : 'Perfil deshabilitado', type: 'success' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setToast({ message, type: 'error' });
    } finally {
      setUpdating((previous) => ({ ...previous, [profileId]: false }));
    }
  }

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return profiles;

    return profiles.filter(
      (profile) =>
        (profile.display_name ?? '').toLowerCase().includes(query) ||
        (profile.email ?? '').toLowerCase().includes(query)
    );
  }, [profiles, search]);

  const enabledCount = useMemo(
    () => profiles.filter((profile) => profile.is_enabled).length,
    [profiles]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFB703]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-white rounded-2xl p-4 shadow-sm shadow-[rgba(255,183,3,0.1)] border border-[rgba(2,48,71,0.06)]">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-[#6B7280]">
            Total: <strong className="text-[#1A1A2E]">{profiles.length}</strong>
          </span>
          <span className="font-medium text-[#6B7280]">
            Habilitados: <strong className="text-[#06D6A0]">{enabledCount}</strong>
          </span>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full px-4 py-3 rounded-xl border border-[rgba(2,48,71,0.12)] bg-white text-sm font-semibold text-[#1A1A2E] focus:border-[#FFB703] focus:ring-2 focus:ring-[rgba(255,183,3,0.25)]"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]">🔍</span>
      </div>

      {filteredProfiles.length === 0 ? (
        <div className="text-center py-10 text-[#6B7280]">
          <p className="text-4xl mb-2">👤</p>
          <p className="font-medium">No se encontraron perfiles</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white rounded-2xl p-4 shadow-sm shadow-[rgba(255,183,3,0.1)] border border-[rgba(2,48,71,0.06)] flex items-center gap-3"
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name ?? 'Avatar'}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFB703] to-[#FB8500] flex items-center justify-center text-white font-bold text-lg">
                  {(profile.display_name ?? profile.email ?? '?').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1A1A2E] truncate">
                  {profile.display_name ?? 'Sin nombre'}
                </p>
                <p className="text-sm text-[#6B7280] truncate">{profile.email ?? 'Sin email'}</p>
                <span
                  className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                    profile.is_enabled
                      ? 'bg-[rgba(6,214,160,0.12)] text-[#06A77D]'
                      : 'bg-[rgba(239,71,111,0.12)] text-[#EF476F]'
                  }`}
                >
                  {profile.is_enabled ? 'Habilitado' : 'Deshabilitado'}
                </span>
              </div>

              <button
                onClick={() => void toggleProfile(profile.id, !profile.is_enabled)}
                disabled={updating[profile.id]}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
                  profile.is_enabled
                    ? 'bg-[rgba(239,71,111,0.1)] text-[#EF476F] hover:bg-[rgba(239,71,111,0.2)]'
                    : 'bg-[rgba(6,214,160,0.1)] text-[#06A77D] hover:bg-[rgba(6,214,160,0.2)]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {updating[profile.id] ? '...' : profile.is_enabled ? 'Deshabilitar' : 'Habilitar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
