import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ROUTES } from '@/lib/routes';

export type PostLoginPath =
  | typeof ROUTES.home
  | typeof ROUTES.customerProfile
  | typeof ROUTES.workerDashboard
  | typeof ROUTES.adminDashboard;

/**
 * Resolves where to send the user after `signInWithPassword`, using `public.users.role`
 * with short retries (trigger can lag right after signup/sign-in).
 */
export async function getPostLoginPath(): Promise<PostLoginPath> {
  if (!isSupabaseConfigured() || !supabase) return '/';

  const { data: sessionData, error: sessionErr } = await supabase.auth.getUser();
  if (sessionErr || !sessionData.user) return ROUTES.home;

  const authId = sessionData.user.id;
  const metadataRole = sessionData.user.user_metadata?.role as string | undefined;

  let role: string | undefined;
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data: row } = await supabase.from('users').select('role, full_name, phone').eq('auth_id', authId).maybeSingle();
    if (row?.role) {
      role = row.role as string;
      if (row.role === 'customer') {
        const needsProfile = !row.full_name || row.full_name === 'User' || !row.phone;
        if (needsProfile) return ROUTES.customerProfile;
      }
      break;
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  role = role || metadataRole || 'customer';

  if (role === 'worker') return ROUTES.workerDashboard;
  if (role === 'admin') return ROUTES.adminDashboard;
  return ROUTES.home;
}
