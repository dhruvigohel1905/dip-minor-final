import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a book spine/cover OCR specialist. Extract all visible book titles, authors, and ISBNs from the image. Return a JSON array of objects with fields: title, author (if visible), isbn (if visible). Only return the JSON array, no other text. If you can't identify any books, return an empty array []. Be thorough - try to read every book spine or cover visible in the image.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all book information from this image." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_books",
              description: "Extract book information from an image of book spines or covers",
              parameters: {
                type: "object",
                properties: {
                  books: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Book title" },
                        author: { type: "string", description: "Author name if visible" },
                        isbn: { type: "string", description: "ISBN if visible" },
                      },
                      required: ["title"],
                    },
                  },
                },
                required: ["books"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_books" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let books: Array<{ title: string; author?: string; isbn?: string }> = [];

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        books = parsed.books || [];
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    // Fallback: try parsing content as JSON
    if (books.length === 0) {
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try {
          const match = content.match(/\[[\s\S]*\]/);
          if (match) books = JSON.parse(match[0]);
        } catch { /* ignore */ }
      }
    }

    return new Response(JSON.stringify({ books }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("OCR scan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
