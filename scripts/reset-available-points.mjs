import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = process.env.ENV_PATH || path.resolve('D:\\Code\\Personal_Projects\\quinela\\quinela', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      env[key] = valueParts.join('=').trim();
    }
  }
}

const supabaseUrl = env.SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const AWARD_MULTIPLIER = 3;

async function computeAvailablePoints(userId) {
  const { data: matchPointsData } = await supabaseAdmin
    .from('match_points')
    .select('points')
    .eq('user_id', userId);

  const { data: settledAwards } = await supabaseAdmin
    .from('award_predictions')
    .select('points_wagered')
    .eq('user_id', userId)
    .eq('is_winner', true);

  const { data: activeWagers } = await supabaseAdmin
    .from('award_predictions')
    .select('points_wagered')
    .eq('user_id', userId)
    .is('is_winner', null);

  const matchPoints = (matchPointsData ?? []).reduce((sum, mp) => sum + (mp.points ?? 0), 0);
  const settledWinnings = (settledAwards ?? []).reduce((sum, ap) => sum + (ap.points_wagered ?? 0) * AWARD_MULTIPLIER, 0);
  const activeWagered = (activeWagers ?? []).reduce((sum, ap) => sum + (ap.points_wagered ?? 0), 0);

  return matchPoints + settledWinnings - activeWagered;
}

async function main() {
  console.log('Fetching profiles...');
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name, available_points')
    .eq('is_enabled', true);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError.message);
    process.exit(1);
  }

  console.log(`Found ${profiles?.length ?? 0} enabled profiles`);

  let updated = 0;
  let errors = 0;

  for (const profile of profiles ?? []) {
    const newAvailable = await computeAvailablePoints(profile.id);

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ available_points: newAvailable })
      .eq('id', profile.id);

    if (updateError) {
      console.error(`Error updating ${profile.id}:`, updateError.message);
      errors++;
    } else {
      console.log(
        `Updated ${profile.display_name ?? profile.id}: ${profile.available_points ?? 0} -> ${newAvailable}`
      );
      updated++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, Errors: ${errors}`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
