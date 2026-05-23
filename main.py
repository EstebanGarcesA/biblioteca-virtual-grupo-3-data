from Backend.lectura import cargar_biblioteca
from Backend.limpieza import limpiar_datos
from Backend.analisis import analizar_datos, calcular_agregados
from Backend.exportar import exportar_csv

df, meta, _libros, _usuarios = cargar_biblioteca()
df = limpiar_datos(df)
resultado = analizar_datos(df, meta)
agregados = calcular_agregados(df)
exportar_csv(df, "Output/biblioteca_prestamos.csv", resumen=resultado, agregados=agregados)

print("\n--- Resumen biblioteca virtual ---")
print(resultado)
