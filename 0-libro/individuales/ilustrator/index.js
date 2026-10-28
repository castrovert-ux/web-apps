/* ═══ PROVEEDORES Y CONFIGURACIÓN DE APIS ═══ */
  const KEYS = [
    {id:'aistudio',   label:'AI Studio',  ls:'castroverde_ana_gemini_key',  url:'https://aistudio.google.com/apikey'},
    {id:'groq',       label:'Groq',       ls:'castroverde_groq_key',        url:'https://console.groq.com/keys'},
    {id:'mistral',    label:'Mistral',    ls:'castroverde_ana_mistral_key', url:'https://console.mistral.ai/api-keys'},
    {id:'openrouter', label:'OpenRouter', ls:'castroverde_or_key',          url:'https://openrouter.ai/settings/keys'},
    {id:'deepseek',   label:'DeepSeek',   ls:'castroverde_deepseek_key',    url:'https://platform.deepseek.com/api_keys'},
    {id:'anthropic',  label:'Anthropic',  ls:'castroverde_anthropic_key',   url:'https://console.anthropic.com/settings/keys'}
  ];

  const getKey   = id => { try { return localStorage.getItem(KEYS.find(k => k.id === id)?.ls) || ''; } catch(e){ return ''; } };
  const keyLabel = id => KEYS.find(k => k.id === id)?.label || id;

  const PROVIDERS = {
    aistudio:   {label:'Google AI Studio (Gemini)', models:[
                   {id:'gemini-2.5-flash',         label:'Gemini 2.5 Flash'},
                   {id:'gemini-flash-latest',      label:'Gemini Flash (última)'},
                   {id:'gemini-flash-lite-latest', label:'Gemini Flash-Lite (última)'}]},
    groq:       {label:'Groq', models:[
                   {id:'llama-3.3-70b-versatile', label:'Llama 3.3 70B'},
                   {id:'openai/gpt-oss-120b',     label:'GPT-OSS 120B'}]},
    mistral:    {label:'Mistral', models:[
                   {id:'mistral-small-latest',  label:'Mistral Small'},
                   {id:'mistral-medium-latest', label:'Mistral Medium'},
                   {id:'mistral-large-latest',  label:'Mistral Large'}]},
    openrouter: {label:'OpenRouter', models:[
                   {id:'meta-llama/llama-3.3-70b-instruct:free', label:'Llama 3.3 70B (free)'},
                   {id:'deepseek/deepseek-r1:free',               label:'DeepSeek R1 (free)'}]},
    deepseek:   {label:'DeepSeek', models:[
                   {id:'deepseek-chat',     label:'DeepSeek V3'},
                   {id:'deepseek-reasoner', label:'DeepSeek R1'}]},
    anthropic:  {label:'Anthropic Claude', models:[
                   {id:'claude-3-5-sonnet-20241022', label:'Claude 3.5 Sonnet'},
                   {id:'claude-3-5-haiku-20241022',  label:'Claude 3.5 Haiku'}]}
  };

  const LIST_KEY = {
    aistudio: 'ilustraciones_gemini_models',
    groq: 'ilustraciones_groq_models',
    mistral: 'ilustraciones_mistral_models',
    openrouter: 'ilustraciones_or_models',
    deepseek: 'ilustraciones_deepseek_models',
    anthropic: 'ilustraciones_anthropic_models'
  };

  const SETTINGS_KEY = 'ilustraciones_settings';

  function loadJSON(k){ try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch(e){ return null; } }
  function saveJSON(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }

  let settings = Object.assign({provider:'aistudio', model:'gemini-2.5-flash'}, loadJSON(SETTINGS_KEY) || {});
  if (!PROVIDERS[settings.provider]) { settings.provider = 'aistudio'; settings.model = 'gemini-2.5-flash'; }
  function saveSettings(){ saveJSON(SETTINGS_KEY, settings); }

  function iaStatus(type, msg){
    const el = document.getElementById('iaStatus');
    if (!el) return;
    el.className = 'ia-status ' + (type || '');
    el.textContent = msg || '';
    if (type === 'ok') setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 4000);
  }

  function modelList(prov){
    const c = loadJSON(LIST_KEY[prov]);
    return (c && c.length) ? c : PROVIDERS[prov].models;
  }

  function renderModel(){
    const provSelect = document.getElementById('prov');
    const modelSelect = document.getElementById('model');
    if (!provSelect || !modelSelect) return;

    provSelect.innerHTML = Object.entries(PROVIDERS)
      .map(([k, p]) => `<option value="${k}" ${k === settings.provider ? 'selected' : ''}>${esc(p.label)}</option>`).join('');

    let list = modelList(settings.provider);
    if (!list.some(m => m.id === settings.model)) list = [{id:settings.model, label:settings.model}, ...list];

    modelSelect.innerHTML = list
      .map(m => `<option value="${esc(m.id)}" ${m.id === settings.model ? 'selected' : ''}>${esc(m.label || m.id)}</option>`).join('');
  }

  function changeProvider(){
    settings.provider = document.getElementById('prov').value;
    settings.model = modelList(settings.provider)[0].id;
    saveSettings();
    renderModel();
    iaStatus('', '');
    const p = settings.provider;
    if (!loadJSON(LIST_KEY[p]) && (p === 'openrouter' || getKey(p))) refreshModels(true);
  }

  function changeModel(){
    settings.model = document.getElementById('model').value;
    saveSettings();
  }

  /* ═══ ACTUALIZACIÓN DINÁMICA DE MODELOS ═══ */
  async function refreshModels(quiet){
    const prov = settings.provider;
    try {
      let list = [];
      if (prov === 'openrouter'){
        const r = await fetch('https://openrouter.ai/api/v1/models');
        if (!r.ok) throw new Error('OpenRouter ' + r.status);
        const data = (await r.json()).data || [];
        list = data.filter(m => /:free$/.test(m.id) || (m.pricing && +m.pricing.prompt === 0 && +m.pricing.completion === 0))
          .map(m => ({id:m.id, label:m.id})).sort((a, b) => a.id.localeCompare(b.id));
      } else {
        const key = getKey(prov);
        if (!key){ if (!quiet){ iaStatus('err', 'Falta la clave de ' + keyLabel(prov) + '.'); openKeys(prov); } return; }

        if (prov === 'aistudio'){
          const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=' + encodeURIComponent(key));
          if (!r.ok) throw new Error('AI Studio ' + r.status);
          const data = (await r.json()).models || [];
          list = data.filter(m => (m.supportedGenerationMethods || []).includes('generateContent') && /gemini|gemma/.test(m.name) && !/(embed|tts|image|live|audio|vision)/.test(m.name))
            .map(m => ({id:m.name.replace(/^models\//, ''), label:(m.displayName || m.name.replace(/^models\//, ''))}));
        } else if (prov === 'anthropic'){
          list = PROVIDERS.anthropic.models;
        } else {
          const endpoints = {
            groq: 'https://api.groq.com/openai/v1/models',
            mistral: 'https://api.mistral.ai/v1/models',
            deepseek: 'https://api.deepseek.com/v1/models'
          };
          const r = await fetch(endpoints[prov], {headers:{'Authorization':'Bearer ' + key}});
          if (!r.ok) throw new Error(keyLabel(prov) + ' ' + r.status);
          const data = (await r.json()).data || [];
          list = data.filter(m => m.active !== false && !/(whisper|tts|guard|embed|ocr|moderation)/i.test(m.id))
            .map(m => ({id:m.id, label:m.id})).sort((a, b) => a.id.localeCompare(b.id));
        }
      }
      if (!list.length) throw new Error('La lista ha llegado vacía.');
      saveJSON(LIST_KEY[prov], list);
      renderModel();
      if (!quiet) iaStatus('ok', 'Lista de modelos actualizada.');
    } catch(e){
      if (!quiet) iaStatus('err', 'No se pudo actualizar la lista: ' + e.message);
    }
  }

  /* ═══ MODAL Y GESTIÓN DE CLAVES ═══ */
  function openKeys(highlightProv){
    KEYS.forEach(k => {
      const inp = document.getElementById('key-' + k.id);
      if (inp) {
        inp.value = getKey(k.id);
        inp.type = 'password';
      }
    });
    const chk = document.getElementById('showKeysCheck');
    if (chk) chk.checked = false;

    const modal = document.getElementById('keysModal');
    if (modal) {
      modal.style.display = 'flex';
      if (highlightProv) {
        const target = document.getElementById('key-' + highlightProv);
        if (target) setTimeout(() => target.focus(), 100);
      }
    }
  }

  function closeKeys(){
    const modal = document.getElementById('keysModal');
    if (modal) modal.style.display = 'none';
  }

  function saveKeys(){
    KEYS.forEach(k => {
      const inp = document.getElementById('key-' + k.id);
      if (inp) {
        const val = inp.value.trim();
        try {
          if (val) localStorage.setItem(k.ls, val);
          else localStorage.removeItem(k.ls);
        } catch(e){}
      }
    });
    closeKeys();
    iaStatus('ok', 'Claves API guardadas correctamente.');
    renderModel();
  }

  function toggleShowKeys(show){
    KEYS.forEach(k => {
      const inp = document.getElementById('key-' + k.id);
      if (inp) inp.type = show ? 'text' : 'password';
    });
  }

  /* ═══ EJECUCIÓN UNIFICADA DE MODELOS ═══ */
  async function httpError(resp, who){
    let detail = '';
    try { const j = await resp.json(); detail = (j.error && (j.error.message || j.error)) || j.message || JSON.stringify(j); }
    catch(e){ try { detail = await resp.text(); } catch(_){} }
    if (typeof detail === 'object') detail = JSON.stringify(detail);
    return new Error(`${who} (${resp.status}): ${String(detail).slice(0, 300)}`);
  }

  function needKey(id){
    const k = getKey(id);
    if (!k){ openKeys(id); throw new Error('Falta la clave de ' + keyLabel(id) + '.'); }
    return k;
  }

  function callModel(o){
    if (o.provider === 'aistudio') return callGemini(o);
    if (o.provider === 'anthropic') return callAnthropic(o);

    const configs = {
      openrouter: {url:'https://openrouter.ai/api/v1/chat/completions',   who:'OpenRouter', max:null},
      mistral:    {url:'https://api.mistral.ai/v1/chat/completions',      who:'Mistral',    max:4000},
      groq:       {url:'https://api.groq.com/openai/v1/chat/completions', who:'Groq',       max:4000},
      deepseek:   {url:'https://api.deepseek.com/v1/chat/completions',    who:'DeepSeek',   max:4000}
    };
    return callOpenAICompat(o, configs[o.provider]);
  }

  async function callGemini({model, system, user}){
    const key = needKey('aistudio');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const body = {
      contents: [{ role: 'user', parts: [{ text: user }] }]
    };
    if (system) body.systemInstruction = { parts: [{ text: system }] };

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!resp.ok) throw await httpError(resp, 'Google AI Studio');
    const data = await resp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Respuesta vacía o formato no reconocido de Gemini.');
    return text;
  }

  async function callOpenAICompat({provider, model, system, user}, cfg){
    const key = needKey(provider);
    const messages = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: user });

    const payload = { model, messages };
    if (cfg.max) payload.max_tokens = cfg.max;

    const resp = await fetch(cfg.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key,
        ...(provider === 'openrouter' ? { 'HTTP-Referer': location.origin, 'X-Title': 'Ilustrador Prompts' } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw await httpError(resp, cfg.who);
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Respuesta vacía de ' + cfg.who);
    return text;
  }

  async function callAnthropic({model, system, user}){
    const key = needKey('anthropic');
    const payload = {
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{ role: 'user', content: user }]
    };
    if (system) payload.system = system;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'dangerously-allow-browser': 'true'
      },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw await httpError(resp, 'Anthropic');
    const data = await resp.json();
    const text = data.content?.[0]?.text;
    if (!text) throw new Error('Respuesta vacía de Anthropic');
    return text;
  }

  // Inicialización al cargar la página
  document.addEventListener('DOMContentLoaded', () => {
    renderModel();
    updateCount();
  });