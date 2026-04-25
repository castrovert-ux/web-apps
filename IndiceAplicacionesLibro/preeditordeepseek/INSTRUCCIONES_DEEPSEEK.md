# Preeditor Castroverde — Integración DeepSeek

## ✅ Cambios realizados

El archivo `preeditor_deepseek.html` incluye:

- **API DeepSeek** en lugar de Groq
- **System prompts depurados** (Narrativo + Descriptivo) sin contradicciones
- **Validación de clave** actualizada: busca `sk-` en lugar de `gsk_`
- **Textos del modal** ajustados a DeepSeek

## 🚀 Pasos para implementarlo

### 1. Obtén una clave DeepSeek (gratis)

1. Ve a https://platform.deepseek.com/
2. Regístrate (es instantáneo)
3. Ve a "API Keys" y copia tu clave (comienza con `sk-`)

### 2. Reemplaza el archivo en tu repositorio

```bash
# En tu repo GitHub de web-apps/IndiceAplicacionesLibro/preeditor/
# Reemplaza el index.html actual con el nuevo preeditor_deepseek.html
# (O copia el contenido y pégalo)
```

### 3. Abre la herramienta y configura

1. Abre https://castrovert-ux.github.io/web-apps/IndiceAplicacionesLibro/preeditor/
2. Haz click en el icono de clave (🔑) en la esquina superior derecha
3. Pega tu clave DeepSeek (comienza por `sk-`)
4. Haz click en "Guardar"

## 💰 Costes

- **DeepSeek-chat**: ~$0.0007 por 1K tokens (entrada) + $0.0028 por 1K tokens (salida)
- **Ejemplo real**: 500 tokens entrada + 500 tokens salida = ~$0.002 (~0.2 centavos)
- **1000 fragmentos**: ~$2 totales (muy económico)

## 🎯 Flujo de uso

1. **Preedita fragmento** en la herramienta (marcas: 🔒, ⭐, ⚖️)
2. **Selecciona modo** (📖 Narrativo o 📋 Descriptivo)
3. **Genera prompt** → se copia automáticamente
4. **Haz click "✦ Enviar a DeepSeek"** (o copia manualmente a deepseek.com)
5. **Espera resultado** → se muestra automático
6. **Copia resultado** → listo para tu documento

## 📝 System Prompts incluidos

### Narrativo (Voz cercana, ritmo)
- Enfoque: voz de referencia primero
- Estilo: frases cortas, datos integrados, ritmo alternado
- Mejor para: párrafos que quieras que suenen "vivos" y cercanos

### Descriptivo (Claridad sobria, rigor)
- Enfoque: claridad absoluta primero
- Estilo: narración continua, explicativo, sin carga literaria
- Mejor para: bloques históricos, datos, explicaciones técnicas

## ⚙️ Personalización

En la herramienta, haz click en **"✎ Ajustes"** para editar los system prompts en cualquier momento.

## 🆘 Si algo no funciona

1. **Clave rechazada**: verifica que empiece por `sk-` (no `gsk_`)
2. **Error de API**: revisa que tienes saldo en https://platform.deepseek.com/
3. **Resultado vacío**: comprueba el prompt generado (haz click en "Copiar prompt")

## 💡 Consejo

Para los primeros 5 fragmentos, prueba con modo **Descriptivo** (es más conservador). Una vez veas que funciona bien, ajusta los prompts según tus necesidades.

---

¿Preguntas? Estoy aquí. 🚀
