import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { chat, AIError } from "../_shared/ai.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { jobDescription, total } = await req.json();

    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim() === '') {
      return new Response(JSON.stringify({ error: 'Job description is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let summary: string;
    try {
      const result = await chat({
        temperature: 0.4,
        maxTokens: 300,
        messages: [
          {
            role: 'system',
            content: 'You are a professional business writer. Generate concise, client-facing summaries for construction quotes and invoices. Keep it 1-3 sentences, professional, and focused on the essential job details and costs. Avoid technical jargon. Format: State what the quote covers, key deliverables, and estimated total if provided. Reply with the summary text only.'
          },
          {
            role: 'user',
            content: `Generate a professional summary for this job:\n\nDescription: ${jobDescription}\n${total ? `Estimated Total: £${total.toLocaleString()}` : ''}`
          }
        ],
      });
      summary = result.content.trim();
    } catch (err) {
      if (err instanceof AIError && err.status === 429) {
        return new Response(JSON.stringify({ error: 'The AI is busy right now. Please try again in a minute.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw err;
    }

    if (!summary) {
      throw new Error('No summary generated');
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-summary function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});