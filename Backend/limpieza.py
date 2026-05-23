import pandas as pd


def limpiar_datos(df):
    df = df.copy()

    columnas_clave = ["id_prestamo", "libro", "usuario", "estado"]
    existentes = [c for c in columnas_clave if c in df.columns]
    df = df.dropna(subset=existentes)
    df = df.drop_duplicates(subset=["id_prestamo"])

    df.columns = df.columns.str.strip().str.lower()

    for col in ["libro", "autor", "categoria", "usuario", "estado"]:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()

    if "cantidadpaginas" in df.columns:
        df["paginas"] = pd.to_numeric(df["cantidadpaginas"], errors="coerce").fillna(0).astype(int)

    if "ranking_libro" in df.columns:
        df["ranking"] = pd.to_numeric(df["ranking_libro"], errors="coerce")

    if "fecha_matricula" in df.columns:
        df["fecha_matricula"] = pd.to_datetime(df["fecha_matricula"], errors="coerce")

    print("Datos de biblioteca limpiados correctamente")
    return df
