import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating image with prompt:', prompt, 'type:', type);

    // Enhanced prompt based on type with exact aspect ratio
    let enhancedPrompt = '';
    let aspectRatioHint = '';
    
    switch (type) {
      case 'banner':
        aspectRatioHint = '16:9 aspect ratio, widescreen horizontal';
        enhancedPrompt = `Create a professional marketing banner image (16:9 wide format, 1920x1080 resolution). ${prompt}. 
Style: Modern, clean, premium digital marketing aesthetic. High contrast, vibrant colors, professional typography placeholder areas.
The image should be perfect for website headers, social media banners, and advertising campaigns.
IMPORTANT: Ultra high resolution, photorealistic quality, no text overlays.`;
        break;
      case 'story':
        aspectRatioHint = '9:16 aspect ratio, vertical portrait format';
        enhancedPrompt = `Create a professional vertical story/reel image (9:16 portrait format, 1080x1920 resolution). ${prompt}.
Style: Instagram/WhatsApp story format, edge-to-edge design, mobile-optimized, eye-catching colors.
The image should fill the entire vertical frame without any empty space.
IMPORTANT: Ultra high resolution, perfect for mobile viewing, no text overlays.`;
        break;
      case 'post':
        aspectRatioHint = '1:1 aspect ratio, square format';
        enhancedPrompt = `Create a professional square social media post image (1:1 format, 1080x1080 resolution). ${prompt}.
Style: Instagram/Facebook post format, centered composition, balanced layout, modern aesthetic.
The image should be perfectly square and optimized for social media feeds.
IMPORTANT: Ultra high resolution, professional quality, no text overlays.`;
        break;
      case 'logo':
        aspectRatioHint = '1:1 aspect ratio, square logo format';
        enhancedPrompt = `Create a professional logo design (1:1 square format, 1024x1024 resolution). ${prompt}.
Style: Minimalist, modern, scalable vector-style design. Clean lines, memorable silhouette, professional branding.
The logo should work on any background (dark or light) and be recognizable at small sizes.
IMPORTANT: Ultra high resolution, clean edges, transparent-friendly design, no text unless specifically requested.`;
        break;
      default:
        aspectRatioHint = '16:9 aspect ratio';
        enhancedPrompt = `Create a professional marketing image. ${prompt}.
Style: Modern, clean, professional. High quality digital marketing material.
IMPORTANT: Ultra high resolution.`;
    }

    // Generate image using Lovable AI Gateway with Gemini
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [
          {
            role: 'user',
            content: `${enhancedPrompt}
            
TECHNICAL REQUIREMENTS:
- Aspect ratio: ${aspectRatioHint}
- Fill the entire canvas - no empty borders or padding
- Professional quality suitable for commercial use
- Modern 2024 design trends
- High contrast and vibrant colors`
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos esgotados. Entre em contato com o suporte.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Response received');

    // Extract image from response
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content || '';

    if (!imageUrl) {
      console.error('No image in response:', JSON.stringify(data));
      throw new Error('Imagem não gerada. Tente um prompt diferente.');
    }

    return new Response(JSON.stringify({ 
      imageUrl,
      description: textResponse,
      aspectRatio: type === 'story' ? '9:16' : type === 'post' || type === 'logo' ? '1:1' : '16:9'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating image:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro ao gerar imagem' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
