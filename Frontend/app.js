const COLORES = {
    cyan: '#33C1D1',
    orange: '#D35400',
    navy: '#1A2B3C',
    palette: ['#33C1D1', '#D35400', '#1A2B3C', '#5dd4e0', '#e67e22', '#243a52', '#7ec8d4', '#f39c12'],
};

document.addEventListener('DOMContentLoaded', () => {
    const jsonPath = 'biblioteca_prestamos.json';
    let datosGlobales = [];
    let resumenGlobal = {};
    let agregadosGlobal = {};
    let ordenAscendente = true;
    let columnaActual = 'libro';

    const cuerpoTabla = document.getElementById('cuerpo-tabla');
    const notaMuestra = document.getElementById('nota-muestra');
    const inputBuscador = document.getElementById('buscador');
    const selectCategoria = document.getElementById('filtro-categoria');
    const selectEstado = document.getElementById('filtro-estado');

    const columnasOrdenables = {
        'th-libro': 'libro',
        'th-autor': 'autor',
        'th-categoria': 'categoria',
        'th-usuario': 'usuario',
        'th-fecha': 'fecha_matricula',
        'th-paginas': 'paginas',
        'th-estado': 'estado',
    };

    Object.entries(columnasOrdenables).forEach(([idTh, prop]) => {
        const th = document.getElementById(idTh);
        if (th) th.addEventListener('click', () => ejecutarOrdenamiento(prop));
    });

    fetch(jsonPath)
        .then(response => {
            if (!response.ok) throw new Error('No se pudo cargar biblioteca_prestamos.json. Ejecute main.py primero.');
            return response.json();
        })
        .then(data => {
            resumenGlobal = data.resumen || {};
            agregadosGlobal = data.agregados || {};
            if (notaMuestra && data.nota) notaMuestra.textContent = data.nota;

            datosGlobales = (data.registros || []).map(item => ({
                id: item.id,
                libro: item.libro || '',
                autor: item.autor || '',
                categoria: item.categoria || 'Sin categoría',
                usuario: item.usuario || '',
                fecha_matricula: item.fecha_matricula || '',
                estado: item.estado || '',
                paginas: Number(item.paginas) || 0,
            }));

            poblarFiltros(datosGlobales);
            actualizarKpisResumen();
            filtrarYProcesar();
        })
        .catch(err => {
            console.error(err);
            cuerpoTabla.innerHTML = `<tr><td colspan="7" style="color:${COLORES.orange};text-align:center;font-weight:bold;">Error: ${err.message}</td></tr>`;
        });

    if (inputBuscador) inputBuscador.addEventListener('input', filtrarYProcesar);
    if (selectCategoria) selectCategoria.addEventListener('change', filtrarYProcesar);
    if (selectEstado) selectEstado.addEventListener('change', filtrarYProcesar);

    function poblarFiltros(datos) {
        const categorias = Object.keys(agregadosGlobal.por_categoria || {})
            .length
            ? Object.keys(agregadosGlobal.por_categoria)
            : [...new Set(datos.map(d => d.categoria))];
        const estados = Object.keys(agregadosGlobal.por_estado || {})
            .length
            ? Object.keys(agregadosGlobal.por_estado)
            : [...new Set(datos.map(d => d.estado))];

        categorias.sort().forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            selectCategoria.appendChild(opt);
        });

        estados.sort().forEach(est => {
            const opt = document.createElement('option');
            opt.value = est;
            opt.textContent = est;
            selectEstado.appendChild(opt);
        });
    }

    function actualizarKpisResumen() {
        document.getElementById('kpi-prestamos').textContent =
            (resumenGlobal.total_prestamos ?? datosGlobales.length).toLocaleString();
        document.getElementById('kpi-libros').textContent =
            (resumenGlobal.total_libros_catalogo ?? 0).toLocaleString();
        document.getElementById('kpi-usuarios').textContent =
            (resumenGlobal.total_usuarios ?? 0).toLocaleString();
        document.getElementById('kpi-activos').textContent =
            (resumenGlobal.prestamos_activos ?? 0).toLocaleString();
    }

    function filtrarYProcesar() {
        const busqueda = (inputBuscador?.value || '').toLowerCase().trim();
        const categoriaSel = selectCategoria?.value || 'TODAS';
        const estadoSel = selectEstado?.value || 'TODOS';

        let datosFiltrados = datosGlobales.filter(item => {
            const texto = `${item.libro} ${item.autor} ${item.usuario} ${item.fecha_matricula}`.toLowerCase();
            const coincideBusqueda = !busqueda || texto.includes(busqueda);
            const coincideCategoria = categoriaSel === 'TODAS' || item.categoria === categoriaSel;
            const coincideEstado = estadoSel === 'TODOS' || item.estado === estadoSel;
            return coincideBusqueda && coincideCategoria && coincideEstado;
        });

        datosFiltrados = aplicarOrdenamiento(datosFiltrados);
        actualizarDashboard(datosFiltrados);
    }

    function ejecutarOrdenamiento(propiedad) {
        if (columnaActual === propiedad) {
            ordenAscendente = !ordenAscendente;
        } else {
            columnaActual = propiedad;
            ordenAscendente = true;
        }
        filtrarYProcesar();
    }

    function aplicarOrdenamiento(datos) {
        return [...datos].sort((a, b) => {
            const valA = a[columnaActual];
            const valB = b[columnaActual];
            if (typeof valA === 'number') {
                return ordenAscendente ? valA - valB : valB - valA;
            }
            return ordenAscendente
                ? String(valA).localeCompare(String(valB))
                : String(valB).localeCompare(String(valA));
        });
    }

    function claseBadge(estado) {
        const e = (estado || '').toLowerCase();
        if (e.includes('devuelto')) return 'badge devuelto';
        if (e.includes('activo')) return 'badge activo';
        return 'badge';
    }

    function actualizarDashboard(datos) {
        const mapaCategorias = {};
        const mapaLibros = {};

        let htmlFilas = '';
        datos.forEach(reg => {
            mapaCategorias[reg.categoria] = (mapaCategorias[reg.categoria] || 0) + 1;
            mapaLibros[reg.libro] = (mapaLibros[reg.libro] || 0) + 1;

            htmlFilas += `
                <tr>
                    <td><strong>${reg.libro}</strong></td>
                    <td>${reg.autor}</td>
                    <td>${reg.categoria}</td>
                    <td>${reg.usuario}</td>
                    <td>${reg.fecha_matricula}</td>
                    <td>${reg.paginas}</td>
                    <td><span class="${claseBadge(reg.estado)}">${reg.estado}</span></td>
                </tr>
            `;
        });

        cuerpoTabla.innerHTML = htmlFilas
            || `<tr><td colspan="7" style="text-align:center;color:${COLORES.textMuted || '#4a5f73'};padding:20px;">No hay préstamos que coincidan con el filtro.</td></tr>`;

        generarGraficos(mapaCategorias, mapaLibros);
    }

    function generarGraficos(mapaLocalCat, mapaLocalLibros) {
        const usarAgregados = !inputBuscador?.value
            && selectCategoria?.value === 'TODAS'
            && selectEstado?.value === 'TODOS';

        const mapaCategorias = usarAgregados && agregadosGlobal.por_categoria
            ? agregadosGlobal.por_categoria
            : mapaLocalCat;

        const mapaLibros = usarAgregados && agregadosGlobal.top_libros
            ? agregadosGlobal.top_libros
            : Object.fromEntries(
                Object.entries(mapaLocalLibros).sort((a, b) => b[1] - a[1]).slice(0, 8)
            );

        const categorias = Object.keys(mapaCategorias);
        const valoresCat = categorias.map(c => mapaCategorias[c]);

        if (categorias.length === 0) {
            document.getElementById('grafico-barras').innerHTML = '<p style="text-align:center;padding:50px;color:#4a5f73;">Sin datos para graficar</p>';
            document.getElementById('grafico-torta').innerHTML = '<p style="text-align:center;padding:50px;color:#4a5f73;">Sin datos para graficar</p>';
            return;
        }

        Plotly.newPlot('grafico-barras', [{
            x: categorias,
            y: valoresCat,
            type: 'bar',
            marker: { color: COLORES.cyan },
            name: 'Préstamos',
        }], {
            title: { text: 'Préstamos por categoría', font: { color: COLORES.navy } },
            paper_bgcolor: '#FFFFFF',
            plot_bgcolor: '#FFFFFF',
            margin: { b: 100 },
            xaxis: { tickangle: -25, automargin: true, color: COLORES.navy },
            yaxis: { title: 'Cantidad', color: COLORES.navy },
        }, { responsive: true });

        const libros = Object.keys(mapaLibros);
        const valoresLibros = libros.map(l => mapaLibros[l]);

        Plotly.newPlot('grafico-torta', [{
            values: valoresLibros,
            labels: libros,
            type: 'pie',
            hole: 0.35,
            textinfo: 'percent+label',
            marker: { colors: COLORES.palette },
        }], {
            title: { text: 'Libros más prestados', font: { color: COLORES.navy } },
            paper_bgcolor: '#FFFFFF',
            margin: { l: 20, r: 20, b: 20, t: 50 },
        }, { responsive: true });
    }
});
