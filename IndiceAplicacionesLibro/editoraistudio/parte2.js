// =====================================================
// PASO 1
// =====================================================
async function runStep1() {
  const texto = document.getElementById('input-text').value.trim();
  if (!texto) { showStatus('err', 'Pega primero el texto'); return; }
  if (step1Result) { setResultText(1, step1Result); switchTab(1); return; }
  if (!checkKey()) return;
  setDot(1, 'running');
  setResultLoading(1, 'Corrigiendo texto...');
  try {
    const result = await callAPI(getPrompt(1), 'Corrige el siguiente texto:\n\n"""\n' + texto + '\n"""');
    step1Result = result;
    step1Prompt = '=== SYSTEM ===\n' + getPrompt(1) + '\n\n=== USER ===\nCorrige el siguiente texto:\n\n"""\n' + texto + '\n"""';
    histAdd(1, step1Result);
    setResultText(1, step1Result);
    setDot(1, 'done');
    document.getElementById('btn-step2').disabled = false;
    document.getElementById('copy-1').disabled = false;
    document.getElementById('show-prompt-1').disabled = false;
    showStatus('ok', 'Paso 1 completado');
  } catch(e) { setResultError(1, e.message); setDot(1, ''); }
}

// =====================================================
// PASO 2
// =====================================================
async function runStep2() {
  if (!step1Result) { showStatus('err', 'Ejecuta Paso 1 primero'); return; }
  if (step2Result) { setResultText(2, step2Result); switchTab(2); return; }
  if (!checkKey()) return;
  setDot(2, 'running');
  setResultLoading(2, 'Editando texto...');
  try {
    const result = await callAPI(getPrompt(2), 'Edita el siguiente texto:\n\n"""\n' + step1Result + '\n"""');
    step2Result = result;
    step2Prompt = '=== SYSTEM ===\n' + getPrompt(2) + '\n\n=== USER ===\nEdita el siguiente texto:\n\n"""\n' + step1Result + '\n"""';
    histAdd(2, step2Result);
    setResultText(2, step2Result);
    setDot(2, 'done');
    document.getElementById('btn-step3').disabled = false;
    document.getElementById('btn-step4').disabled = false;
    document.getElementById('copy-2').disabled = false;
    document.getElementById('show-prompt-2').disabled = false;
    showStatus('ok', 'Paso 2 completado');
  } catch(e) { setResultError(2, e.message); setDot(2, ''); }
}

// =====================================================
// PASO 3
// =====================================================
async function runStep3() {
  if (!step2Result) { showStatus('err', 'Ejecuta Pasos 1 y 2 primero'); return; }
  if (step3Result) { setFidelidadResult(step3Result); switchTab(3); return; }
  if (!checkKey()) return;
  const original = document.getElementById('input-text').value.trim();
  if (!original) { showStatus('err', 'No hay texto original'); return; }
  setDot(3, 'running');
  document.getElementById('result-3').innerHTML = '<span class="empty-msg">⋯ Revisando fidelidad...</span>';
  try {
    const userMsg = `TEXTO ORIGINAL:\n"""\n${original}\n"""\n\nTEXTO EDITADO:\n"""\n${step2Result}\n"""`;
    const result = await callAPI(getPrompt(3), userMsg);
    step3Result = result;
    step3Prompt = '=== SYSTEM ===\n' + getPrompt(3) + '\n\n=== USER ===\n' + userMsg;
    histAdd(3, step3Result);
    setFidelidadResult(step3Result);
    setDot(3, 'done');
    document.getElementById('show-prompt-3').disabled = false;
    showStatus('ok', 'Paso 3 completado');
  } catch(e) { document.getElementById('result-3').innerHTML = '<span class="empty-msg" style="color:#c45a3a;">✗ ' + e.message + '</span>'; setDot(3, ''); }
}

// =====================================================
// PASO 4
// =====================================================
async function runStep4() {
  if (!step2Result) { showStatus('err', 'Ejecuta Pasos 1 y 2 primero'); return; }
  if (step4Result) { setResultText(4, step4Result); switchTab(4); return; }
  if (!checkKey()) return;
  setDot(4, 'running');
  setResultLoading(4, 'Puliendo coherencia...');
  try {
    const result = await callAPI(getPrompt(4), 'Revisa el siguiente texto:\n\n"""\n' + step2Result + '\n"""');
    step4Result = result;
    step4Prompt = '=== SYSTEM ===\n' + getPrompt(4) + '\n\n=== USER ===\nRevisa el siguiente texto:\n\n"""\n' + step2Result + '\n"""';
    histAdd(4, step4Result);
    setResultText(4, step4Result);
    setDot(4, 'done');
    document.getElementById('btn-step5').disabled = false;
    document.getElementById('copy-4').disabled = false;
    document.getElementById('show-prompt-4').disabled = false;
    showStatus('ok', 'Paso 4 completado');
  } catch(e) { setResultError(4, e.message); setDot(4, ''); }
}

// =====================================================
// PASO 5
// =====================================================
async function runStep5() {
  if (!step4Result) { showStatus('err', 'Ejecuta Paso 4 primero'); return; }
  if (step5Result) { setResultText(5, step5Result); switchTab(5); return; }
  if (!checkKey()) return;
  setDot(5, 'running');
  setResultLoading(5, 'Pulido final...');
  try {
    const result = await callAPI(getPrompt(5), 'Aplica pulido final al texto:\n\n"""\n' + step4Result + '\n"""');
    step5Result = result;
    step5Prompt = '=== SYSTEM ===\n' + getPrompt(5) + '\n\n=== USER ===\nAplica pulido final al texto:\n\n"""\n' + step4Result + '\n"""';
    histAdd(5, step5Result);
    setResultText(5, step5Result);
    setDot(5, 'done');
    document.getElementById('btn-step6').disabled = false;
    document.getElementById('copy-5').disabled = false;
    document.getElementById('show-prompt-5').disabled = false;
    showStatus('ok', 'Paso 5 completado');
  } catch(e) { setResultError(5, e.message); setDot(5, ''); }
}

// =====================================================
// PASO 6
// =====================================================
async function runStep6() {
  if (!step5Result) { showStatus('err', 'Ejecuta Paso 5 primero'); return; }
  if (step6Result) { renderReport6(step6Result); switchTab(6); return; }
  if (!checkKey()) return;
  const original = document.getElementById('input-text').value.trim();
  if (!original) { showStatus('err', 'No hay texto original'); return; }
  setDot(6, 'running');
  document.getElementById('result-6').innerHTML = '<span class="empty-msg">⋯ Analizando diferencias...</span>';
  try {
    const userMsg = `TEXTO ORIGINAL:\n"""\n${original}\n"""\n\nTEXTO EDITADO:\n"""\n${step5Result}\n"""`;
    const result = await callAPI(getPrompt(6), userMsg);
    step6Result = result;
    step6Prompt = '=== SYSTEM ===\n' + getPrompt(6) + '\n\n=== USER ===\n' + userMsg;
    histAdd(6, step6Result);
    renderReport6(step6Result);
    setDot(6, 'done');
    document.getElementById('show-prompt-6').disabled = false;
    document.getElementById('copy-report-6').disabled = false;
    showStatus('ok', 'Paso 6 completado');
  } catch(e) { document.getElementById('result-6').innerHTML = '<span class="empty-msg" style="color:#c45a3a;">✗ ' + e.message + '</span>'; setDot(6, ''); }
}

// =====================================================
// EJECUCIÓN EN CADENA
// =====================================================
async function runAll() {
  await runStep1();
  if (step1Result) await runStep2();
  if (step2Result) await runStep3();
  if (step2Result) await runStep4();
  if (step4Result) await runStep5();
  if (step5Result) await runStep6();
}

// =====================================================
// FILE INPUT
// =====================================================
document.getElementById('file-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('input-text').value = ev.target.result.substring(0, 20000);
    updateCount();
  };
  reader.readAsText(file, 'UTF-8');
  e.target.value = '';
});
document.getElementById('input-text').addEventListener('input', updateCount);

// =====================================================
// INICIALIZACIÓN
// =====================================================
loadActivePrompts();
updateCount();
updateNavButtons();
setApi(activeApi);
if (activeApi === 'gemini' && !GEMINI_API_KEY) setTimeout(openGeminiModal, 500);
if (activeApi === 'groq' && !GROQ_API_KEY) setTimeout(openGroqModal, 500);
</script>
</body>
</html>