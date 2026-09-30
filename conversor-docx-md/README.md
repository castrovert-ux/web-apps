# Conversor DOCX ⇄ Markdown

Pequeña aplicación de escritorio en Python (tkinter) que convierte ficheros
Word (`.docx`) a Markdown (`.md`) y al revés usando **Pandoc**.

## Requisitos

- Python 3 con tkinter (viene incluido en Windows y macOS; en Linux:
  `sudo apt install python3-tk`).
- [Pandoc](https://pandoc.org/installing.html) instalado y en el PATH.

No hace falta instalar ninguna librería de Python adicional.

## Uso

```bash
python conversor.py
```

1. Pulsa **Abrir…** y elige un `.docx` o un `.md` en el gestor de archivos.
   La dirección de la conversión se deduce de la extensión.
2. Se propone guardar en la misma carpeta con la otra extensión; pulsa
   **Guardar como…** para elegir otra ubicación o nombre.
3. Pulsa **Convertir**.

### Opciones

- **Extraer imágenes (DOCX → MD):** las imágenes del Word se guardan en una
  carpeta `<nombre>_media` junto al `.md`, con enlaces relativos.
- **Plantilla de estilos (MD → DOCX):** un `.docx` cuyos estilos (fuentes,
  títulos, márgenes…) se aplicarán al documento generado.
- **Abrir al terminar:** abre el resultado con la aplicación predeterminada.

En Windows puedes renombrar el fichero a `conversor.pyw` para lanzarlo con
doble clic sin que aparezca la ventana de consola.
