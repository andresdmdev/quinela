import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../lib/supabase';

/**
 * Uploads an avatar image for the authenticated user.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken: string | undefined = cookies.get('sb-access-token')?.value;
  const refreshToken: string | undefined = cookies.get('sb-refresh-token')?.value;

  if (!accessToken || !refreshToken) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data, error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  if (sessionError || !data.session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData: FormData = await request.formData();
  const file: File | null = formData.get('avatar') as File | null;

  if (!file) {
    return new Response('No file provided', { status: 400 });
  }

  const userId: string = data.session.user.id;
  const fileExtension: string = file.name.split('.').pop() ?? 'png';
  const filePath: string = `${userId}.${fileExtension}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    return new Response(JSON.stringify({ error: uploadError.message }), { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
  const avatarUrl: string = publicUrlData.publicUrl;

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ avatarUrl }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
