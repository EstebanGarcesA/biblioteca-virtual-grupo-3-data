import json
import os

import pandas as pd

LIMITE_REGISTROS_WEB = 800


def _preparar_registros(df):
    export_df = pd.DataFrame({
        "id": df["id_prestamo"],
        "libro": df["libro"],
        "autor": df["autor"],
        "categoria": df["categoria"],
        "usuario": df["usuario"],
        "estado": df["estado"],
        "paginas": df["paginas"] if "paginas" in df.columns else 0,
        "ranking": df["ranking"] if "ranking" in df.columns else None,
        "fecha_matricula": df["fecha_matricula"].dt.strftime("%Y-%m-%d")
        if "fecha_matricula" in df.columns
        else "",
    })
    if "ranking" in export_df.columns:
        export_df["ranking"] = export_df["ranking"].round(1)
    return export_df


def exportar_csv(df, ruta_salida, resumen=None, agregados=None):
    print("Generando archivos de salida de la biblioteca...")

    carpeta = os.path.dirname(ruta_salida)
    if carpeta and not os.path.exists(carpeta):
        os.makedirs(carpeta, exist_ok=True)

    export_df = _preparar_registros(df)
    export_df.to_csv(ruta_salida, index=False, encoding="utf-8")
    print(f"CSV guardado en: {ruta_salida}")

    registros_web = export_df.sort_values("id", ascending=False).head(LIMITE_REGISTROS_WEB)

    ruta_json_frontend = os.path.join("Frontend", "biblioteca_prestamos.json")
    payload = {
        "resumen": resumen or {},
        "agregados": agregados or {},
        "registros": registros_web.to_dict(orient="records"),
        "nota": f"Muestra de {len(registros_web)} préstamos recientes (dataset completo: {len(export_df)})",
    }

    with open(ruta_json_frontend, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"JSON para web guardado en: {ruta_json_frontend}")
