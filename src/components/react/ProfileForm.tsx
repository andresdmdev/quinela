import { useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Toast } from './ui/Toast';

interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface ProfileResponse {
  profile: Profile;
}

/**
 * Allows the user to edit their display name and upload an avatar.
 */
export function ProfileForm(): React.JSX.Element {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect((): void => {
    async function loadProfile(): Promise<void> {
      try {
        const response = await fetch('/api/profile');

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Error ${response.status}`);
        }

        const data = (await response.json()) as ProfileResponse;

        setProfile(data.profile);
        setDisplayName(data.profile.display_name ?? '');
      } catch (err) {
        const messageText = err instanceof Error ? err.message : 'Error desconocido';
        setError(messageText);
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  async function handleNameSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (displayName.trim().length === 0) {
      setToast({ message: 'El nombre no puede estar vacío', type: 'error' });
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim() })
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? 'Error updating profile');
      }

      setProfile((previous) =>
        previous ? { ...previous, display_name: displayName.trim() } : null
      );
      setToast({ message: 'Nombre actualizado', type: 'success' });
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Error desconocido';
      setToast({ message: messageText, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file: File | undefined = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData: FormData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/avatar', {
        method: 'POST',
        body: formData
      });

      const data = (await response.json()) as { avatarUrl?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? 'Error uploading avatar');
      }

      setProfile((previous) =>
        previous ? { ...previous, avatar_url: data.avatarUrl ?? null } : null
      );
      setToast({ message: 'Avatar actualizado', type: 'success' });
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Error desconocido';
      setToast({ message: messageText, type: 'error' });
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFB703]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-[rgba(239,71,111,0.08)] border border-[rgba(239,71,111,0.2)] rounded-2xl p-6 text-center">
        <p className="text-[#EF476F] font-medium">{error ?? 'No se pudo cargar el perfil'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm shadow-[rgba(255,183,3,0.1)] border border-[rgba(2,48,71,0.06)] space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col items-center gap-4">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name ?? 'Avatar'}
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg shadow-[rgba(2,48,71,0.15)]"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FFB703] to-[#FB8500] flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-[rgba(251,133,0,0.3)]">
            {(profile.display_name ?? 'J').charAt(0).toUpperCase()}
          </div>
        )}

        <label className="cursor-pointer px-4 py-2 bg-[rgba(255,183,3,0.12)] text-[#9a6b00] rounded-xl text-sm font-bold hover:bg-[rgba(255,183,3,0.2)] transition-colors">
          {uploading ? 'Subiendo...' : 'Cambiar avatar'}
          <input
            type="file"
            accept="image/*"
            onChange={(event) => void handleAvatarChange(event)}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      <form onSubmit={(event) => void handleNameSubmit(event)} className="space-y-4">
        <Input
          id="displayName"
          label="Nombre a mostrar"
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Tu nombre"
        />

        <Button type="submit" variant="primary" isLoading={saving} className="w-full">
          Guardar nombre
        </Button>
      </form>

      <form action="/api/auth/signout" method="get">
        <Button type="submit" variant="secondary" className="w-full">
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}
