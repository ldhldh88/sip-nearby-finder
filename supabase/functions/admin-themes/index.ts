import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function verifyToken(token: string): Promise<boolean> {
  const adminPassword = Deno.env.get('ADMIN_PASSWORD');
  if (!adminPassword) return false;

  const encoder = new TextEncoder();
  const data = encoder.encode(adminPassword + '_admin_token_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const expected = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return token === expected;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = req.headers.get('x-admin-token');
    if (!token || !(await verifyToken(token))) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { action, kakao_place_id, theme_id } = await req.json();

    if (action === 'get_themes') {
      // Get all themes for a place
      const { data, error } = await supabase
        .from('bar_themes')
        .select('theme_id')
        .eq('kakao_place_id', kakao_place_id);
      if (error) throw error;
      return new Response(JSON.stringify({ theme_ids: data.map((r: any) => r.theme_id) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'link') {
      // Upsert bar_meta first
      const { error: metaError } = await supabase
        .from('bar_meta')
        .upsert({ kakao_place_id }, { onConflict: 'kakao_place_id' });
      if (metaError) throw metaError;

      // Insert bar_theme (use a system user_id for admin)
      const { error } = await supabase
        .from('bar_themes')
        .upsert(
          { kakao_place_id, theme_id, user_id: '00000000-0000-0000-0000-000000000000' },
          { onConflict: 'kakao_place_id,theme_id,user_id' }
        );
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'unlink') {
      const { error } = await supabase
        .from('bar_themes')
        .delete()
        .eq('kakao_place_id', kakao_place_id)
        .eq('theme_id', theme_id)
        .eq('user_id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
