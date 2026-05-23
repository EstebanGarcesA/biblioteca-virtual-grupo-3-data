def analizar_datos(df, meta=None):
    meta = meta or {}

    print("\nCantidad de préstamos:")
    print(df.shape)

    print("\nTipos de datos:")
    print(df.dtypes)

    if "categoria" in df.columns:
        print("\nPréstamos por categoría:")
        print(df["categoria"].value_counts().head(10))

    if "estado" in df.columns:
        print("\nPréstamos por estado:")
        print(df["estado"].value_counts())

    activos = int((df["estado"].str.lower() == "activo").sum()) if "estado" in df.columns else 0
    devueltos = int((df["estado"].str.lower() == "devuelto").sum()) if "estado" in df.columns else 0

    promedio_paginas = 0.0
    if "paginas" in df.columns and len(df) > 0:
        promedio_paginas = float(round(df["paginas"].mean(), 1))

    return {
        "filas": int(df.shape[0]),
        "columnas": int(df.shape[1]),
        "total_prestamos": int(df.shape[0]),
        "total_libros_catalogo": meta.get("total_libros_catalogo", 0),
        "total_usuarios": meta.get("total_usuarios", 0),
        "libros_prestados": meta.get("libros_unicos_prestados", 0),
        "usuarios_con_prestamo": meta.get("usuarios_con_prestamo", 0),
        "prestamos_activos": activos,
        "prestamos_devueltos": devueltos,
        "promedio_paginas": promedio_paginas,
    }


def calcular_agregados(df):
    por_categoria = (
        df["categoria"].value_counts().sort_values(ascending=False).to_dict()
        if "categoria" in df.columns
        else {}
    )
    por_estado = (
        df["estado"].value_counts().to_dict()
        if "estado" in df.columns
        else {}
    )
    top_libros = (
        df.groupby("libro").size().sort_values(ascending=False).head(10).to_dict()
        if "libro" in df.columns
        else {}
    )
    return {
        "por_categoria": por_categoria,
        "por_estado": por_estado,
        "top_libros": top_libros,
    }
