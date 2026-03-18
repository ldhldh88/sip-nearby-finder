import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { district_id, kakao_place_id, place_data } = await req.json();

    if (!district_id || !kakao_place_id || !place_data) {
      return new Response(JSON.stringify({ error: 'district_id, kakao_place_id, place_data are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify district exists
    const { data: district, error: dErr } = await supabase
      .from('districts')
      .select('id, name')
      .eq('id', district_id)
      .single();

    if (dErr || !district) {
      return new Response(JSON.stringify({ error: 'District not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: upsertErr } = await supabase
      .from('cached_places')
      .upsert({
        district_id,
        kakao_place_id,
        place_data,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'district_id,kakao_place_id' });

    if (upsertErr) throw upsertErr;

    return new Response(JSON.stringify({ 
      success: true, 
      district_name: district.name,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
