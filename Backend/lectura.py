import os

import pandas as pd

DATA_DIR = "Data"
RUTA_PRESTAMOS = os.path.join(DATA_DIR, "dataset_analitico_final.csv")
RUTA_LIBROS = os.path.join(DATA_DIR, "books.csv")
RUTA_USUARIOS = os.path.join(DATA_DIR, "BD cesde.xlsx")


def leer_csv(ruta):
    try:
        df = pd.read_csv(ruta)
        print(f"Archivo cargado: {ruta}")
        print(df.head())
        return df
    except Exception as e:
        print("Error leyendo archivo:", e)
        return None


def _leer_catalogo_libros():
    try:
        return pd.read_csv(
            RUTA_LIBROS,
            on_bad_lines="skip",
            engine="python",
            encoding="utf-8",
        )
    except Exception:
        return pd.read_csv(RUTA_LIBROS, on_bad_lines="skip", encoding="latin-1")


def _leer_usuarios_cesde():
    return pd.read_excel(RUTA_USUARIOS, sheet_name=0)


def cargar_biblioteca():
    """Carga los 3 archivos de Data y prepara el dataset unificado."""
    prestamos = pd.read_csv(RUTA_PRESTAMOS)
    libros = _leer_catalogo_libros()
    usuarios = _leer_usuarios_cesde()

    prestamos.columns = prestamos.columns.str.strip().str.lower()

    prestamos["usuario"] = (
        prestamos["nombre"].fillna("").astype(str).str.replace("|", "", regex=False).str.strip()
        + " "
        + prestamos["apellido"].fillna("").astype(str).str.strip()
    ).str.strip()

    prestamos["libro"] = prestamos["nombrelibro"].astype(str).str.strip()
    prestamos["autor"] = prestamos["autor"].astype(str).str.strip()
    prestamos["categoria"] = prestamos["categoria"].fillna("Sin categoría").astype(str).str.strip()
    prestamos["estado"] = prestamos["estado_prestamo"].astype(str).str.strip()
    prestamos["fecha_matricula"] = pd.to_datetime(
        prestamos["fecha_matricula"], errors="coerce"
    )

    meta = {
        "total_libros_catalogo": int(len(libros)),
        "total_usuarios": int(len(usuarios)),
        "total_prestamos_fuente": int(len(prestamos)),
        "libros_unicos_prestados": int(prestamos["id_libro"].nunique()),
        "usuarios_con_prestamo": int(prestamos["numerodocumento"].nunique()),
    }

    print("Biblioteca cargada correctamente")
    print(
        f"Préstamos: {meta['total_prestamos_fuente']} | "
        f"Catálogo books.csv: {meta['total_libros_catalogo']} | "
        f"Usuarios CESDE: {meta['total_usuarios']}"
    )
    print(prestamos.head())

    return prestamos, meta, libros, usuarios
