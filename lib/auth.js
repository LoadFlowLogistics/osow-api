import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

export async function getUserFromAuthHeader(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;

  const { data: user, error } = await supabase.auth.getUser(token);
  if (error || !user?.user) return null;

  const { data: plan, error: planError } = await supabase
    .from('user_plans')
    .select('allowed_states')
    .eq('user_id', user.user.id)
    .single();

  if (planError) return null;

  return {
    id: user.user.id,
    allowedStates: plan.allowed_states || []
  };
}
