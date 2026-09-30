#!/usr/bin/env python3
"""
Conversor DOCX <-> Markdown usando Pandoc.

Abre el gestor de archivos para elegir el fichero de origen (.docx o .md)
y de nuevo para elegir dónde guardar el resultado. La dirección de la
conversión se deduce de la extensión del fichero elegido.

Requisitos: Python 3 (con tkinter) y Pandoc instalado en el sistema.
"""

import os
import shutil
import subprocess
import sys
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

EXT_DOCX = {".docx"}
EXT_MD = {".md", ".markdown", ".txt"}

# Rutas habituales de Pandoc por si no está en el PATH.
RUTAS_PANDOC = [
    r"C:\Program Files\Pandoc\pandoc.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Pandoc\pandoc.exe"),
    "/usr/local/bin/pandoc",
    "/opt/homebrew/bin/pandoc",
    "/usr/bin/pandoc",
]


def buscar_pandoc():
    """Devuelve la ruta del ejecutable de Pandoc o None si no se encuentra."""
    encontrado = shutil.which("pandoc")
    if encontrado:
        return encontrado
    for ruta in RUTAS_PANDOC:
        if ruta and Path(ruta).is_file():
            return ruta
    return None


def ejecutar_pandoc(pandoc, args, cwd):
    """Ejecuta Pandoc sin abrir ventana de consola en Windows."""
    flags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
    return subprocess.run(
        [pandoc, *args],
        cwd=cwd,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        creationflags=flags,
    )


def convertir(pandoc, origen, destino, extraer_imagenes=True, plantilla=None):
    """Convierte origen -> destino. Lanza RuntimeError si Pandoc falla."""
    origen = Path(origen).resolve()
    destino = Path(destino).resolve()
    carpeta_destino = destino.parent

    if origen.suffix.lower() in EXT_DOCX:
        args = [str(origen), "-f", "docx", "-t", "gfm", "--wrap=none",
                "-o", str(destino)]
        if extraer_imagenes:
            # Ruta relativa para que los enlaces del .md queden relativos.
            args.append(f"--extract-media={destino.stem}_media")
    else:
        args = [str(origen), "-f", "markdown", "-t", "docx",
                f"--resource-path={origen.parent}", "-o", str(destino)]
        if plantilla:
            args.append(f"--reference-doc={plantilla}")

    resultado = ejecutar_pandoc(pandoc, args, cwd=carpeta_destino)
    if resultado.returncode != 0:
        raise RuntimeError(resultado.stderr.strip() or "Error desconocido de Pandoc")
    return resultado.stderr.strip()  # avisos, si los hay


class App(tk.Tk):
    def __init__(self, pandoc):
        super().__init__()
        self.pandoc = pandoc
        self.title("Conversor DOCX ⇄ Markdown")
        self.resizable(False, False)

        self.origen = tk.StringVar()
        self.destino = tk.StringVar()
        self.plantilla = tk.StringVar()
        self.extraer = tk.BooleanVar(value=True)
        self.abrir_al_terminar = tk.BooleanVar(value=False)
        self.estado = tk.StringVar(value="Elige un fichero .docx o .md para empezar.")

        marco = ttk.Frame(self, padding=14)
        marco.grid(sticky="nsew")

        ttk.Label(marco, text="Fichero de origen:").grid(row=0, column=0, sticky="w")
        ttk.Entry(marco, textvariable=self.origen, width=55).grid(row=1, column=0, padx=(0, 6))
        ttk.Button(marco, text="Abrir…", command=self.elegir_origen).grid(row=1, column=1)

        ttk.Label(marco, text="Guardar como:").grid(row=2, column=0, sticky="w", pady=(10, 0))
        ttk.Entry(marco, textvariable=self.destino, width=55).grid(row=3, column=0, padx=(0, 6))
        ttk.Button(marco, text="Guardar como…", command=self.elegir_destino).grid(row=3, column=1)

        opciones = ttk.LabelFrame(marco, text="Opciones", padding=8)
        opciones.grid(row=4, column=0, columnspan=2, sticky="ew", pady=(12, 0))
        ttk.Checkbutton(
            opciones, text="DOCX → MD: extraer imágenes a una carpeta junto al .md",
            variable=self.extraer,
        ).grid(row=0, column=0, columnspan=3, sticky="w")
        ttk.Label(opciones, text="MD → DOCX: plantilla de estilos (opcional):").grid(
            row=1, column=0, sticky="w", pady=(6, 0))
        ttk.Entry(opciones, textvariable=self.plantilla, width=30).grid(
            row=1, column=1, padx=6, pady=(6, 0))
        ttk.Button(opciones, text="…", width=3, command=self.elegir_plantilla).grid(
            row=1, column=2, pady=(6, 0))
        ttk.Checkbutton(
            opciones, text="Abrir el fichero resultante al terminar",
            variable=self.abrir_al_terminar,
        ).grid(row=2, column=0, columnspan=3, sticky="w", pady=(6, 0))

        self.boton = ttk.Button(marco, text="Convertir", command=self.convertir)
        self.boton.grid(row=5, column=0, columnspan=2, pady=(14, 6))

        ttk.Label(marco, textvariable=self.estado, foreground="#555",
                  wraplength=460).grid(row=6, column=0, columnspan=2, sticky="w")

    # --- Diálogos -------------------------------------------------------

    def elegir_origen(self):
        ruta = filedialog.askopenfilename(
            title="Abrir fichero",
            filetypes=[
                ("Word o Markdown", "*.docx *.md *.markdown"),
                ("Documento Word", "*.docx"),
                ("Markdown", "*.md *.markdown *.txt"),
                ("Todos los ficheros", "*.*"),
            ],
        )
        if not ruta:
            return
        self.origen.set(ruta)
        p = Path(ruta)
        nueva_ext = ".md" if p.suffix.lower() in EXT_DOCX else ".docx"
        self.destino.set(str(p.with_suffix(nueva_ext)))
        sentido = "DOCX → Markdown" if nueva_ext == ".md" else "Markdown → DOCX"
        self.estado.set(f"Conversión: {sentido}. Pulsa «Guardar como…» para cambiar el destino.")

    def elegir_destino(self):
        origen = self.origen.get()
        if not origen:
            messagebox.showinfo("Falta el origen", "Primero elige el fichero que quieres convertir.")
            return
        p = Path(origen)
        if p.suffix.lower() in EXT_DOCX:
            ext, tipos = ".md", [("Markdown", "*.md"), ("Todos los ficheros", "*.*")]
        else:
            ext, tipos = ".docx", [("Documento Word", "*.docx"), ("Todos los ficheros", "*.*")]
        actual = Path(self.destino.get() or p.with_suffix(ext))
        ruta = filedialog.asksaveasfilename(
            title="Guardar como",
            initialdir=str(actual.parent),
            initialfile=actual.name,
            defaultextension=ext,
            filetypes=tipos,
        )
        if ruta:
            self.destino.set(ruta)

    def elegir_plantilla(self):
        ruta = filedialog.askopenfilename(
            title="Plantilla de estilos (.docx)",
            filetypes=[("Documento Word", "*.docx")],
        )
        if ruta:
            self.plantilla.set(ruta)

    # --- Conversión -----------------------------------------------------

    def convertir(self):
        origen, destino = self.origen.get().strip(), self.destino.get().strip()
        if not origen or not Path(origen).is_file():
            messagebox.showerror("Error", "Elige un fichero de origen válido.")
            return
        ext = Path(origen).suffix.lower()
        if ext not in EXT_DOCX | EXT_MD:
            messagebox.showerror("Error", "Solo se admiten ficheros .docx o .md.")
            return
        if not destino:
            self.elegir_destino()
            destino = self.destino.get().strip()
            if not destino:
                return
        if Path(origen).resolve() == Path(destino).resolve():
            messagebox.showerror("Error", "El destino no puede ser el mismo fichero que el origen.")
            return

        plantilla = self.plantilla.get().strip() or None
        self.boton.state(["disabled"])
        self.estado.set("Convirtiendo…")
        self.update_idletasks()
        try:
            avisos = convertir(self.pandoc, origen, destino, self.extraer.get(), plantilla)
        except Exception as e:
            self.estado.set("La conversión ha fallado.")
            messagebox.showerror("Error de Pandoc", str(e))
            return
        finally:
            self.boton.state(["!disabled"])

        self.estado.set(f"Guardado en: {destino}")
        mensaje = f"Conversión terminada:\n{destino}"
        if avisos:
            mensaje += f"\n\nAvisos de Pandoc:\n{avisos[:800]}"
        messagebox.showinfo("Listo", mensaje)
        if self.abrir_al_terminar.get():
            abrir_con_sistema(destino)


def abrir_con_sistema(ruta):
    """Abre un fichero con la aplicación predeterminada del sistema."""
    try:
        if sys.platform == "win32":
            os.startfile(ruta)  # type: ignore[attr-defined]
        elif sys.platform == "darwin":
            subprocess.Popen(["open", ruta])
        else:
            subprocess.Popen(["xdg-open", ruta])
    except OSError as e:
        messagebox.showwarning("Aviso", f"No se pudo abrir el fichero:\n{e}")


def main():
    pandoc = buscar_pandoc()
    if not pandoc:
        raiz = tk.Tk()
        raiz.withdraw()
        messagebox.showerror(
            "Pandoc no encontrado",
            "No se ha encontrado Pandoc. Comprueba que está instalado y en el PATH:\n"
            "https://pandoc.org/installing.html",
        )
        sys.exit(1)
    App(pandoc).mainloop()


if __name__ == "__main__":
    main()
