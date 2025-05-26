
import { supabaseClient } from '@/services/api/supabase/client';

// Re-export the single client instance
export const supabase = supabaseClient;
export default supabaseClient;
