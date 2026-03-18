// ============================================================
// Cloudflare Worker — Proxy de generación de imágenes
// Castroverde Ilustrador
// ============================================================
// INSTRUCCIONES:
// 1. En Cloudflare Workers, crea una variable de entorno llamada
//    HF_TOKEN con tu token de Hugging Face (empieza por hf_...)
// 2. Despliega este worker
// 3. Copia la URL del worker en el index.html (variable WORKER_URL)
// ============================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Modelos disponibles en Hugging Face (gratuitos)
const MODELS = {
  default: 'stabilityai/stable-diffusion-xl-base-1.0',
  fast:    'stabilityai/sdxl-turbo',
};

export default {
  async fetch(request, env) {

    // Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Método no permitido', { status: 405, headers: CORS_HEADERS });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('JSON inválido', { status: 400, headers: CORS_HEADERS });
    }

    const { prompt, negative_prompt, width = 1024, height = 1024 } = body;

    if (!prompt) {
      return new Response('Falta el campo prompt', { status: 400, headers: CORS_HEADERS });
    }

    // Elegir modelo según tamaño (turbo es más rápido para tamaños pequeños)
    const modelKey = (width <= 768 && height <= 768) ? 'fast' : 'default';
    const model = MODELS[modelKey];
    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

    const hfPayload = {
      inputs: prompt,
      parameters: {
        negative_prompt: negative_prompt || 'blurry, low quality, deformed, ugly',
        width:  Math.min(width,  1024),
        height: Math.min(height, 1024),
        num_inference_steps: modelKey === 'fast' ? 4 : 30,
        guidance_scale:      modelKey === 'fast' ? 0 : 7.5,
      },
    };

    try {
      const hfResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.HF_TOKEN}`,
          'Content-Type': 'application/json',
          'x-wait-for-model': 'true',   // esperar si el modelo está cargando
        },
        body: JSON.stringify(hfPayload),
      });

      if (!hfResponse.ok) {
        const errText = await hfResponse.text();
        console.error('HF error:', hfResponse.status, errText);
        return new Response(
          JSON.stringify({ error: `Error del modelo: ${hfResponse.status}`, detail: errText }),
          { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // HF devuelve la imagen directamente como blob
      const imageBlob = await hfResponse.blob();
      return new Response(imageBlob, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': hfResponse.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'no-store',
        },
      });

    } catch (err) {
      console.error('Worker fetch error:', err);
      return new Response(
        JSON.stringify({ error: 'Error interno del worker', detail: err.message }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }
  }
};
