#!/usr/bin/env python3
"""
actualizar_preguntas.py
------------------------
Sustituye automáticamente las preguntas "por defecto" incrustadas en el
archivo HTML de la Prueba de Nivel (dentro de la función
getDefaultQuestions()) por las preguntas contenidas en un archivo JSON.

Uso:
    python actualizar_preguntas.py index.html preguntas.json
    python actualizar_preguntas.py index.html preguntas.json -o index_nuevo.html
    python actualizar_preguntas.py index.html preguntas.json --in-place

Si no se indica -o ni --in-place, se crea un archivo nuevo llamado
"<nombre_original>_actualizado.html" en la misma carpeta.
"""

import argparse
import json
import sys
from pathlib import Path

MARKER = "function getDefaultQuestions() {"


def encontrar_array_preguntas(html_text: str):
    """
    Localiza el array JSON que devuelve getDefaultQuestions() dentro del HTML
    y devuelve (indice_inicio, indice_fin) del array (incluyendo los
    corchetes [ ]), usando el propio parser de JSON para encontrar el final
    exacto sin depender de contar llaves/corchetes a mano.
    """
    pos_funcion = html_text.find(MARKER)
    if pos_funcion == -1:
        raise ValueError(
            f'No se ha encontrado "{MARKER}" en el HTML. '
            "¿Es el archivo index.html correcto de la Prueba de Nivel?"
        )

    pos_corchete = html_text.find("[", pos_funcion)
    if pos_corchete == -1:
        raise ValueError("No se ha encontrado el array de preguntas tras getDefaultQuestions().")

    decoder = json.JSONDecoder()
    try:
        _, fin_relativo = decoder.raw_decode(html_text[pos_corchete:])
    except json.JSONDecodeError as e:
        raise ValueError(f"El array de preguntas existente en el HTML no es JSON válido: {e}")

    pos_fin = pos_corchete + fin_relativo
    return pos_corchete, pos_fin


def cargar_preguntas_json(ruta_json: Path):
    with open(ruta_json, "r", encoding="utf-8") as f:
        preguntas = json.load(f)

    if not isinstance(preguntas, list) or not preguntas:
        raise ValueError("El archivo JSON debe contener un array (lista) de preguntas, no vacío.")

    for i, q in enumerate(preguntas):
        if not isinstance(q, dict):
            raise ValueError(f"El elemento {i} del JSON no es un objeto de pregunta válido.")
        for campo in ("id", "text", "options"):
            if campo not in q:
                raise ValueError(f"La pregunta {i} (id={q.get('id', '?')}) no tiene el campo obligatorio '{campo}'.")
        if not isinstance(q["options"], dict) or not q["options"]:
            raise ValueError(f"La pregunta {q.get('id')} tiene 'options' vacío o con formato incorrecto.")

    return preguntas


def actualizar_html(html_text: str, preguntas: list) -> str:
    inicio, fin = encontrar_array_preguntas(html_text)
    nuevo_array = json.dumps(preguntas, ensure_ascii=False, indent=2)
    # Reindentar para que quede alineado con el resto del bloque "return [...]"
    nuevo_array = nuevo_array.replace("\n", "\n  ")
    return html_text[:inicio] + nuevo_array + html_text[fin:]


def main():
    parser = argparse.ArgumentParser(description="Actualiza las preguntas por defecto del HTML de la Prueba de Nivel a partir de un JSON.")
    parser.add_argument("html", type=Path, help="Ruta al index.html original")
    parser.add_argument("json", type=Path, help="Ruta al archivo JSON con las nuevas preguntas")
    grupo_salida = parser.add_mutually_exclusive_group()
    grupo_salida.add_argument("-o", "--output", type=Path, help="Ruta del HTML de salida")
    grupo_salida.add_argument("--in-place", action="store_true", help="Sobrescribe el propio index.html (se hace copia .bak antes)")
    args = parser.parse_args()

    if not args.html.exists():
        sys.exit(f"Error: no existe el archivo HTML '{args.html}'")
    if not args.json.exists():
        sys.exit(f"Error: no existe el archivo JSON '{args.json}'")

    html_text = args.html.read_text(encoding="utf-8")

    try:
        preguntas = cargar_preguntas_json(args.json)
        nuevo_html = actualizar_html(html_text, preguntas)
    except ValueError as e:
        sys.exit(f"Error: {e}")

    if args.in_place:
        backup = args.html.with_suffix(args.html.suffix + ".bak")
        backup.write_text(html_text, encoding="utf-8")
        args.html.write_text(nuevo_html, encoding="utf-8")
        print(f"✔ {args.html} actualizado ({len(preguntas)} preguntas). Copia de seguridad: {backup}")
    else:
        salida = args.output or args.html.with_name(args.html.stem + "_actualizado" + args.html.suffix)
        salida.write_text(nuevo_html, encoding="utf-8")
        print(f"✔ Generado {salida} con {len(preguntas)} preguntas.")


if __name__ == "__main__":
    main()
