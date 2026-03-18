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

    const body = await req.json();
    const { action, kakao_place_id, theme_id, theme_name, new_name, province_id, province_name, district_id, district_name, sort_order } = body;

    // === Bar-theme linking ===
    if (action === 'get_themes') {
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
      const { error: metaError } = await supabase
        .from('bar_meta')
        .upsert({ kakao_place_id }, { onConflict: 'kakao_place_id' });
      if (metaError) throw metaError;

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

    // === Theme CRUD ===
    if (action === 'create_theme') {
      const { data, error } = await supabase
        .from('themes')
        .insert({ name: theme_name })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ theme: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'rename_theme') {
      const { data, error } = await supabase
        .from('themes')
        .update({ name: new_name })
        .eq('id', theme_id)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ theme: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete_theme') {
      const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', theme_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'list_themes_with_count') {
      const { data: themes, error: tErr } = await supabase
        .from('themes')
        .select('*')
        .order('name');
      if (tErr) throw tErr;

      // Get counts per theme
      const { data: counts, error: cErr } = await supabase
        .from('bar_themes')
        .select('theme_id');
      if (cErr) throw cErr;

      const countMap: Record<string, number> = {};
      for (const row of counts || []) {
        countMap[row.theme_id] = (countMap[row.theme_id] || 0) + 1;
      }

      const result = (themes || []).map((t: any) => ({
        ...t,
        bar_count: countMap[t.id] || 0,
      }));

      return new Response(JSON.stringify({ themes: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === Region CRUD ===
    if (action === 'list_regions') {
      const { data: provinces, error: pErr } = await supabase
        .from('provinces')
        .select('*')
        .order('sort_order');
      if (pErr) throw pErr;

      const { data: districts, error: dErr } = await supabase
        .from('districts')
        .select('*')
        .order('sort_order');
      if (dErr) throw dErr;

      return new Response(JSON.stringify({ provinces, districts }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create_province') {
      const { province_name, sort_order } = await req.json().catch(() => ({}));
      const { data, error } = await supabase
        .from('provinces')
        .insert({ name: province_name || theme_name, sort_order: sort_order ?? 999 })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ province: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_province') {
      const { province_id, province_name: pName, sort_order: pSort } = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (pName !== undefined) updates.name = pName;
      if (pSort !== undefined) updates.sort_order = pSort;
      const { error } = await supabase
        .from('provinces')
        .update(updates)
        .eq('id', province_id || theme_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete_province') {
      const { province_id } = await req.json().catch(() => ({}));
      const { error } = await supabase
        .from('provinces')
        .delete()
        .eq('id', province_id || theme_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create_district') {
      const { province_id, district_name, sort_order } = await req.json().catch(() => ({}));
      const { data, error } = await supabase
        .from('districts')
        .insert({ province_id, name: district_name, sort_order: sort_order ?? 999 })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ district: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_district') {
      const { district_id, district_name, sort_order, province_id: newProvinceId } = await req.json().catch(() => ({}));
      const updates: Record<string, any> = {};
      if (district_name !== undefined) updates.name = district_name;
      if (sort_order !== undefined) updates.sort_order = sort_order;
      if (newProvinceId !== undefined) updates.province_id = newProvinceId;
      const { error } = await supabase
        .from('districts')
        .update(updates)
        .eq('id', district_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete_district') {
      const { district_id } = await req.json().catch(() => ({}));
      const { error } = await supabase
        .from('districts')
        .delete()
        .eq('id', district_id);
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
