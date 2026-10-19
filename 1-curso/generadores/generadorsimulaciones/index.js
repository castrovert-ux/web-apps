    "===== TEMA (contenido del documento) =====\n" + (() => {
      const r = trimTopic(it.text);
      if (r.trimmed) toast("⚠️ Tema muy largo: se ha recortado a " + Math.round(MAX_TOPIC/1000) + " KB.");
      return r.text;
    })() + "\n===== FIN DEL TEMA =====\n\n" +