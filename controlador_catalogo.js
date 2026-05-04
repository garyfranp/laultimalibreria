const SUPABASE_URL = 'https://duwmdfvrabvmwlmeamce.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6BKGi7ezPw5KRY7JLGEFLA_sMxpuBZc';

let librosPublicos = [];

window.onload = async () => {
    await cargarLibrosParaPublico();
};

async function cargarLibrosParaPublico() {
    // Traemos TODAS las columnas disponibles
    const url = `${SUPABASE_URL}/rest/v1/inventario?status=neq.Vendido&select=*`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            librosPublicos = await response.json();
            renderizar(librosPublicos);
        }
    } catch (err) {
        console.error("Error al cargar el catálogo:", err);
    }
}

function aplicarFiltros() {
    const busqueda = document.getElementById('buscador').value.toLowerCase();
    const genero = document.getElementById('filtro-genero').value;

    const filtrados = librosPublicos.filter(l => {
        const coincideNombre = l.titulo.toLowerCase().includes(busqueda) || l.autor.toLowerCase().includes(busqueda);
        const coincideGenero = genero === "" || l.genero === genero;
        return coincideNombre && coincideGenero;
    });
    renderizar(filtrados);
}

function renderizar(lista) {
    const grid = document.getElementById('grid-libros');
    grid.innerHTML = lista.map(l => `
        <div class="libro-card" onclick="abrirModal(${JSON.stringify(l).replace(/"/g, '&quot;')})">
            <div class="marco-foto">
                <img src="${l.foto_url}" class="foto-libro">
                <div class="etiqueta ${l.status === 'Disponible' ? 'dispo' : 'apartado'}">
                    ${l.status}
                </div>
                
            </div>
            <div class="datos-libro">
                <p class="txt-titulo">${l.titulo}</p>
                <p class="txt-titulo">${l.autor}</p>
                <p class="txt-precio">$${l.precio_sugerido}</p>
            </div>
        </div>
    `).join('');
}


function abrirModal(libro) {
    const contenedor = document.getElementById('contenido-dinamico-modal');
    // Cálculo de métricas de valor
    const paginas = parseInt(libro.paginas) || 0;
    const precio = parseFloat(libro.precio_sugerido) || 0;
    
    // Evitamos división por cero si el libro no tiene páginas registradas
    const precioPorPagina = paginas > 0 ? (precio / paginas).toFixed(2) : 0;
    
    // Parseamos el JSON de los detalles internos
    let infoExtra = {};
    try {
        infoExtra = typeof libro.detalles === 'string' ? JSON.parse(libro.detalles) : libro.detalles;
    } catch (e) {
        console.error("Error al leer detalles técnicos", e);
    }

    // Construimos la Ficha Técnica con los datos de primer nivel
    const fichaPrincipal = `
        <ul class="ficha-tecnica">
            <li><strong>Editorial:</strong> ${libro.editorial || 'N/A'}</li>
            <li><strong>Colección:</strong> ${libro.coleccion || 'N/A'}</li>
            <li><strong>Páginas:</strong> ${libro.paginas || 'N/A'}</li>
            <li><strong>Estado Físico:</strong> ${libro.estado_fisico}/10</li>
            <li><strong>ISBN:</strong> ${libro.isbn || 'N/A'}</li>
        </ul>
    `;

    // Construimos la sección de "Estado del Ejemplar" (del JSON anidado)
    const fichaDetallada = `
        <div class="estado-ejemplar">
            <p><strong>Condición:</strong> ${infoExtra.condicion || 'N/A'}</p>
            <p><strong>Año:</strong> ${infoExtra.anio || 'N/A'}</p>
            <p><strong>Importado:</strong> ${infoExtra.importado ? '⭐ Sí' : 'No'}</p>
            <p><strong>Pasta:</strong> ${infoExtra.pasta || 'N/A'}</p>
            <p><strong>Sobrecubierta:</strong> ${infoExtra.sobrecubierta ? 'Sí' : 'No'}</p>
            <p><strong>Edición:</strong> ${infoExtra.edicion || 'N/A'}</p>
            <p><strong>Raro:</strong> ${infoExtra.raro ? '⭐ Sí' : 'No'}</p>
            <p class="comentarios-vendedor">
                <strong>Notas del librero:</strong><br>
                ${infoExtra.comentarios || 'Sin comentarios adicionales.'}
            </p>
        </div>
    `;

    contenedor.innerHTML = `
        <div class="detalle-layout">
            <div class="detalle-img">
                <img src="${libro.foto_url}" alt="${libro.titulo}">
                ${infoExtra.popular ? '<span class="badge-popular">🔥 Popular</span>' : ''}
                <div class="metrica-valor">
                    <small>Valor de lectura:</small>
                    <p><strong>$${precioPorPagina}</strong> / página</p>
                </div>
            </div>
            <div class="detalle-info">
                <h2>${libro.titulo}</h2>
                <p class="autor-modal">Por: ${libro.autor}</p>
                
                <div class="tags-container">
                    <span class="genero-tag">${libro.genero}</span>
                    <span class="status-tag ${libro.status === 'Disponible' ? 'st-dispo' : 'st-apart'}">${libro.status}</span>
                </div>
                
                <p class="precio-modal">$${libro.precio_sugerido}</p>
                
                <h4>Ficha Bibliográfica</h4>
                ${fichaPrincipal}

                <h4>Descripción del Ejemplar</h4>
                ${fichaDetallada}

                <button class="btn-interes" onclick="contactarVendedor('${libro.titulo}')">Me interesa este ejemplar</button>
            </div>
        </div>
    `;
    document.getElementById('modal-detalle').style.display = "flex";
}

function cerrarModal() {
    document.getElementById('modal-detalle').style.display = "none";
}

function contactarVendedor(titulo) {
    const mensaje = `Hola, me interesa el libro: ${titulo}`; 
    window.open(`https://wa.me/529221361042/?text=${encodeURIComponent(mensaje)}`, '_blank');
}
