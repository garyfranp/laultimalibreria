const SUPABASE_URL = ' https://duwmdfvrabvmwlmeamce.supabase.co'; // Ejemplo: https://xyz.supabase.co
const SUPABASE_KEY = 'sb_publishable_6BKGi7ezPw5KRY7JLGEFLA_sMxpuBZc';
const BUCKET_NAME = 'portadas';

//let inventario = JSON.parse(localStorage.getItem('LUL_inv')) || [];
let ventas = JSON.parse(localStorage.getItem('LUL_ven')) || [];
//let mesPasado = localStorage.getItem('LUL_last') || 0;
let mesPasado = 0;
let temp = null;





// Al inicio del script
let inventario = [];

// Función que arranca todo
window.onload = async () => {
    // 1. Intentamos cargar de la nube
    await cargarInventarioDesdeNube();
    await cargarVentasDesdeNube();
    await cargarUltimoReporte();
    render();
};






function preCalcular() {
    const c = parseFloat(document.getElementById('costo').value) || 0;
    const ein = parseFloat(document.getElementById('envio_in').value) || 0;
    const marg = (parseFloat(document.getElementById('margen').value) || 40) / 100;
    //const com = (parseFloat(document.getElementById('comision').value) || 0) / 100;
    const com = 3.5 / 100;
    const est = (parseInt(document.getElementById('estado').value) || 5) / 10;
    
    let mult = 1.0;
    // Factores de Rareza y Mercado
    if(document.getElementById('popular').checked) mult += 0.1;
    if(document.getElementById('raro').checked) mult += 0.2;
    // Si quieres penalizar/subir por importación
    // if(document.getElementById('importado').checked) mult += 0.1; 

    //Factores Físicos Bibliográficos 15% pasta dura y 10% sobrecubierta
    //if(document.getElementById('pasta').value === 'Dura') mult += 0.15;
    //if(document.getElementById('sobrecubierta').checked) mult += 0.10;


    const invTotal = c + ein;
    const sugerido = Math.ceil((invTotal / (1 - marg - com)) * mult * est);
    const minimo = Math.ceil(invTotal / (1 - com));
    
    const inputSugerido = document.getElementById('vSugeridoInput');
    inputSugerido.value = sugerido;

    //document.getElementById('vSugerido').innerText = `$${sugerido}`;
    document.getElementById('vMinimo').innerText = `$${minimo}`;
    document.getElementById('preViewArea').style.display = 'block';

    temp = {
        id: null,
        titulo: document.getElementById('titulo').value,
        autor: document.getElementById('autor').value,
        editorial: document.getElementById('editorial').value,
        isbn: document.getElementById('isbn').value.trim(),
        genero: document.getElementById('genero').value,
        coleccion: document.getElementById('coleccion').value.trim() || 'Sin Colección',
        anio: document.getElementById('anio').value,
        paginas: document.getElementById('paginas').value,
        estado: document.getElementById('estado').value,
        pasta: document.getElementById('pasta').value,
        condicion: document.getElementById('condicion').value,
        edicion: document.getElementById('edicion').value,
        sobrecubierta: document.getElementById('sobrecubierta').checked,
        comentarios: document.getElementById('comentarios').value,
        importado: document.getElementById('importado').checked,
        popular: document.getElementById('popular').checked,
        raro: document.getElementById('raro').checked,
        costo: c, envio: ein, 
        margen: parseFloat(document.getElementById('margen').value),
        comision_plat: 14,//parseFloat(document.getElementById('comision').value),
        comision_tc: 3.5,//arseFloat(document.getElementById('comision_tc').value),
        sugerido: document.getElementById('vSugeridoInput').value,
        minimo: minimo,
        fecha: new Date().toISOString(),
        status: 'Disponible',
        apartado_por: null,
        foto_url: null
        //foto: currentBase64
    };
    //temp.foto = currentBase64;
}
/*
function guardarEnInventario() {
    if(!temp.titulo) return alert("Falta título");
    inventario.push(temp);
    save(); render();
    document.getElementById('preViewArea').style.display = 'none';
    limpiarForm();
}

function vender(id) {
    const idx = inventario.findIndex(l => l.id === id);
    const l = inventario[idx];
    const pReal = prompt(`Venta final ${l.titulo}:`, l.sugerido);
    if(!pReal) return;
    
    const met = prompt("E - Efectivo / T - Transferencia / C - Tarjeta", "E").toUpperCase();
    let metodoTxt = met === 'C' ? 'Tarjeta' : (met === 'T' ? 'Transf.' : 'Efectivo');
    
    const comPlat = pReal * (l.comision_plat / 100);
    const comBanco = (met === 'C') ? pReal * (l.comision_tc / 100) : 0;
    const neta = pReal - (l.costo + l.envio) - (comPlat + comBanco);

    ventas.push({
        titulo: l.titulo, p_venta: parseFloat(pReal), neta: neta,
        comisionTotal: comPlat + comBanco, metodo: metodoTxt,
        fecha: new Date().toLocaleDateString('es-MX'),
        dias: Math.max(1, Math.ceil((new Date() - new Date(l.fecha)) / (1000*60*60*24)))
    });
    
    //inventario.splice(idx, 1);
    l.status = 'Vendido';
    save(); render();
}
*/

function render() {
    /*
    const filtro = document.getElementById('filtro').value.toLowerCase();
    const tbody = document.querySelector("#tablaInv tbody");
    

    tbody.innerHTML = inventario.filter(l => l.titulo.toLowerCase().includes(filtro) || l.autor.toLowerCase().includes(filtro)).map(l => `
        <tr>
            <td><b>${l.titulo}</b><br><small>${l.autor}</small></td>
            <td>
                <img src="${l.foto || 'placeholder.png'}" style="width: 40px; height: 55px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;">
            </td>
            <td>
                <span class="badge">${l.editorial || 'S.E.'}</span>
                <span class="badge">${l.pasta}</span>
                <span class="badge">${l.condicion}</span>
                ${l.raro ? '<span class="badge" style="background:#fff3cd">💎 Raro</span>' : ''}
                <span class="badge" style="background:#e3f2fd">${l.genero}</span>
                <span class="badge" style="background:#f3e5f5">${l.coleccion || 'Sin Colección'}</span>
                <br>
                <small style="color:#888">ISBN: ${l.isbn || 'N/A'}</small>
            </td>
            <td>$${l.costo + l.envio}</td>
            <td style="font-weight:bold">$${l.sugerido}</td>
            <td style="color:var(--err)">$${l.minimo}</td>
            <td style="white-space:nowrap">
                ${l.status === 'Apartado' 
                        ? `<button onclick="liberar(${l.id})" style="background:#f39c12; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer">🔓 Liberar</button>`
                        : `<button onclick="apartar(${l.id})" style="background:#3498db; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer">📌 Apartar</button>`
                    }
                <button onclick="vender(${l.id})" style="border:none; background:var(--s); color:white; padding:5px 10px; border-radius:4px; cursor:pointer">💰 Vender</button>
                <button onclick="borrarLibro(${l.id})" style="border:none; background:none; cursor:pointer">❌</button>
            </td>
        </tr>`).join('');
            */
        
            const filtro = document.getElementById('filtro').value.toLowerCase();
            const tbody = document.querySelector("#tablaInv tbody");

            tbody.innerHTML = inventario
                .filter(l => {
                    // 1. Filtro de búsqueda (Título o Autor)
                    const coincideBusqueda = l.titulo.toLowerCase().includes(filtro) || l.autor.toLowerCase().includes(filtro);
                    // 2. Filtro de estado (Ocultar vendidos del inventario activo)
                    const estaActivo = l.status !== 'Vendido';
                    
                    return coincideBusqueda && estaActivo;
                })
                .map(l => {
                    // Determinamos el color de fondo si está apartado para que resalte
                    const bgFila = l.status === 'Apartado' ? 'style="background-color: #f0f7ff;"' : '';

                    return `
                        <tr ${bgFila}>
                            <td>
                                <b>${l.titulo}</b><br>
                                <small>${l.autor}</small>
                                ${l.status === 'Apartado' ? `<br><span class="badge" style="background:#3498db; color:white;">📌 Apartado para: ${l.apartado_por}</span>` : ''}
                            </td>
                            <td>
                                ${l.foto 
                                    ? `<img src="${l.foto}" style="width: 40px; height: 55px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;">`
                                    : `<div style="width: 40px; height: 55px; background: #eee; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #999; text-align: center; border: 1px solid #ddd;">Sin foto</div>`
                                }
                            </td>
                            <td>
                                <span class="badge">${l.editorial || 'S.E.'}</span>
                                <span class="badge">${l.pasta}</span>
                                <span class="badge">${l.condicion}</span>
                                ${l.raro ? '<span class="badge" style="background:#fff3cd">💎 Raro</span>' : ''}
                                <span class="badge" style="background:#e3f2fd">${l.genero}</span>
                                <span class="badge" style="background:#f3e5f5">${l.coleccion}</span>
                                <br>
                                <small style="color:#888">ISBN: ${l.isbn || 'N/A'}</small>
                            </td>
                            <td>$${l.costo + l.envio}</td>
                            <td style="font-weight:bold">$${l.sugerido}</td>
                            <td style="color:var(--err)">$${l.minimo}</td>
                            <td style="white-space:nowrap">
                                ${l.status === 'Apartado' 
                                    ? `<button onclick="liberar(${l.id})" title="Liberar" style="background:#f39c12; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer">🔓</button>`
                                    : `<button onclick="apartar(${l.id})" title="Apartar" style="background:#3498db; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer">📌</button>`
                                }
                                <button onclick="vender(${l.id})" title="Vender" style="border:none; background:var(--s); color:white; padding:5px 8px; border-radius:4px; cursor:pointer">💰</button>
                                <button onclick="borrarLibro(${l.id})" title="Eliminar" style="border:none; background:none; cursor:pointer">❌</button>
                            </td>
                        </tr>`;
                }).join('');





        //----------------------termina render de inventario       
    const vbody = document.querySelector("#tablaVentas tbody");
    vbody.innerHTML = ventas.map(v => `
        <tr>
            <td>${v.fecha}</td><td>${v.titulo.substring(0,15)}..</td><td>$${v.p_venta}</td>
            <td style="color:var(--s); font-weight:bold">$${v.neta.toFixed(0)}</td>
            <td style="color:var(--err)">$${v.comisionTotal.toFixed(1)}</td>
            <td><span class="badge">${v.metodo}</span></td><td>${v.dias}d</td>
        </tr>`).reverse().join('');
    actualizarDashboard();
    //document.getElementById('statEstante').innerText = inventario.length;
    //const librosEnEstante = inventario.filter(l => l.status !== 'Vendido').length;
    //document.getElementById('statEstante').innerText = librosEnEstante;


    //document.getElementById('statGanancia').innerText = `$${ventas.reduce((acc, v) => acc + v.neta, 0).toFixed(0)}`;
    //document.getElementById('statComisiones').innerText = `$${ventas.reduce((acc, v) => acc + v.comisionTotal, 0).toFixed(0)}`;
    //document.getElementById('statMesPasado').innerText = `$${mesPasado}`;
}


/*
function cierreMensual() {
    if(confirm("¿Cerrar mes? Se archivará la ganancia y se limpiará el historial de ventas.")){
        const gan = ventas.reduce((acc, v) => acc + v.neta, 0);
        localStorage.setItem('LUL_last', gan.toFixed(0));
        ventas = []; save(); location.reload();
    }
}
*/
/*
function exportarCSV(tipo) {
    let csv = tipo === 'inventario' ? "Titulo,Autor,Sugerido\n"+inventario.map(l=>`"${l.titulo}","${l.autor}",${l.sugerido}`).join("\n") 
                                    : "Titulo,Venta,Neta,Metodo\n"+ventas.map(v=>`"${v.titulo}",${v.p_venta},${v.neta},${v.metodo}`).join("\n");
    const b = new Blob(["\ufeff"+csv], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`${tipo}_LUL.csv`; a.click();
}
*/
function limpiarForm() {
    ['titulo', 'autor', 'editorial', 'paginas', 'anio', 'costo', 'envio_in', 'estado', 'comentarios', 'isbn', 'coleccion'].forEach(id => document.getElementById(id).value = "");
    ['importado', 'popular', 'raro', 'sobrecubierta'].forEach(id => document.getElementById(id).checked = false);

    document.getElementById('genero').value = "Sin Categoría";

        // 3. LIMPIAR FOTO (Miniatura del formulario)
    document.getElementById('img-render').src = "";
    document.getElementById('img-render').style.display = 'none';
    document.getElementById('placeholder-text').style.display = 'block';
    
    // 4. Resetear el input file y la variable global
    document.getElementById('foto-input').value = ""; // Limpia el archivo seleccionado
    currentBase64 = ""; // Vacía la memoria de la imagen actual
}

function save() {
    //localStorage.setItem('LUL_inv', JSON.stringify(inventario));
    localStorage.setItem('LUL_ven', JSON.stringify(ventas));
    localStorage.setItem('libreria_backup', JSON.stringify(inventario));
}

function cambiarEntorno() {
    const env = document.getElementById('envSelector').value;
    document.getElementById('viewport').className = env === 'iphone' ? 'iphone-view' : '';
}





function previewImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            //document.getElementById('img-render').src = e.target.result;
            const img = document.getElementById('img-render');
            img.src = e.target.result;
            img.style.display = 'block';
            document.getElementById('placeholder-text').style.display = 'none';
            //document.getElementById('img-render').style.display = 'block';
            //document.getElementById('placeholder-text').style.display = 'none';
            //currentBase64 = e.target.result; // Guardamos la imagen temporalmente
        }
        reader.readAsDataURL(file);
    }
}


// 1. Función para Apartar un ejemplar
/*
    function apartar(id) {
        const idx = inventario.findIndex(l => l.id === id);
        const cliente = prompt("¿A quién se le aparta este ejemplar?", inventario[idx].apartado_por || "");
        
        if (cliente !== null) {
            inventario[idx].status = 'Apartado';
            inventario[idx].apartado_por = cliente;
            save();
            render();
        }
    }

    // 2. Función para Liberar (volver a poner disponible)
    function liberar(id) {
        if(confirm("¿Deseas quitar el apartado y poner disponible nuevamente?")) {
            const idx = inventario.findIndex(l => l.id === id);
            inventario[idx].status = 'Disponible';
            inventario[idx].apartado_por = null;
            save();
            render();
        }
    }

*/






render();




async function guardarEnInventario() {
    // 1. Validación básica
    if(!temp.titulo) return alert("Falta título");

    let precio_final_editado = document.getElementById('vSugeridoInput').value,
    temp.sugerido = precio_final_editado;
    
    const loader = document.getElementById('loadingStatus');
    const loadText = document.getElementById('loadingText');
    const btnGuardar = document.querySelector("button[onclick='guardarEnInventario()']");
    // 1. Mostrar indicador y bloquear botón
    loader.style.display = 'flex';
    btnGuardar.disabled = true;
    btnGuardar.style.opacity = '0.5';
    
    try {
        const fileInput = document.getElementById('foto-input');
        const archivo = fileInput.files[0];
        
        // 1. Subida de imagen (si existe)
        if (archivo) {
            loadText.innerText = "Subiendo portada...";
            temp.foto_url = await subirFoto(archivo);
        }
        // 2. Registro en Supabase
        loadText.innerText = "Sincronizando con la nube...";
        await enviarFichaASupabase(temp);

        // 3. Cerrar el área de previsualización
        document.getElementById('preViewArea').style.display = 'none';

    } catch (error) {
        console.error("Error crítico en el proceso de guardado:", error);
        alert("Hubo un problema al conectar con el servidor.");
    } finally {
        limpiar_vista_loading();
    }
}







async function subirFoto(file) {
    if (!file) return null;

    // Creamos un nombre de archivo único para evitar duplicados
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_portada.${ext}`;
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${fileName}`;

    try {
        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY,
                'Content-Type': file.type
            },
            body: file
        });

        if (response.ok) {
            // Retornamos la URL pública para guardarla en la base de datos
            return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;
        } else {
            const error = await response.json();
            console.error("Error en Storage:", error);
            return null;
        }
    } catch (err) {
        console.error("Error de conexión:", err);
        return null;
    }
}



async function enviarFichaASupabase(datosLibro) {
    const tableUrl = `${SUPABASE_URL}/rest/v1/inventario`;
    try {
        const response = await fetch(tableUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation' // Nos devuelve el objeto creado (incluyendo el ID)
            },
            body: JSON.stringify({
                titulo: datosLibro.titulo,
                autor: datosLibro.autor,
                editorial: datosLibro.editorial,
                isbn: datosLibro.isbn,
                genero: datosLibro.genero,
                coleccion: datosLibro.coleccion,
                paginas: parseInt(datosLibro.paginas),
                estado_fisico: parseInt(datosLibro.estado),
                costo_inversion: parseFloat(datosLibro.costo + datosLibro.envio),
                precio_sugerido: parseFloat(datosLibro.sugerido),
                foto_url: datosLibro.foto_url,
                status: 'Disponible',
                detalles: {
                    pasta: datosLibro.pasta,
                    sobrecubierta: datosLibro.sobrecubierta,
                    edicion: datosLibro.edicion,
                    condicion: datosLibro.condicion,
                    importado: datosLibro.importado,
                    raro: datosLibro.raro,
                    popular: datosLibro.popular,
                    anio: datosLibro.anio,
                    comentarios: datosLibro.comentarios
                }
            })
        });

        if (response.ok) {
            const resultado = await response.json();
            const itemNube = resultado[0];
            // CREAMOS EL OBJETO FORMATEADO (Igual que en cargarInventarioDesdeNube)
            const libroFormateado = {
                id: itemNube.id,
                titulo: itemNube.titulo,
                autor: itemNube.autor,
                editorial: itemNube.editorial,
                isbn: itemNube.isbn,
                genero: itemNube.genero,
                coleccion: itemNube.coleccion,
                paginas: itemNube.paginas,
                estado: itemNube.estado_fisico,
                costo: itemNube.costo_inversion, 
                envio: 0, 
                sugerido: itemNube.precio_sugerido,
                // Usamos tu función de protección que ya está en el código
                minimo: calcular_precio_venta_minimo(itemNube.costo_inversion, itemNube.precio_sugerido),
                foto: itemNube.foto_url, // <--- Aquí es donde se arregla la imagen
                status: itemNube.status,
                fecha: itemNube.created_at,
                pasta: itemNube.detalles?.pasta || 'Rústica',
                condicion: itemNube.detalles?.condicion || 'Usado',
                raro: itemNube.detalles?.raro || false,
                popular: itemNube.detalles?.popular || false,
                sobrecubierta: itemNube.detalles?.sobrecubierta || false,
                comentarios: itemNube.detalles?.comentarios || ""
            };


            inventario.push(libroFormateado);            
            save(); // Mantenemos el backup local por seguridad
            render();
            limpiarForm();
            alert("Libro registrado exitosamente en Supabase");
            limpiar_vista_loading();
            
        } else {
            const error = await response.json();
            console.error("Error al guardar registro:", error);
        }
    } catch (err) {
        console.error("Error de red:", err);
    }
}

function limpiar_vista_loading() {
    const loader = document.getElementById('loadingStatus');
    const btnGuardar = document.querySelector("button[onclick='guardarEnInventario()']");
    if (loader) loader.style.display = 'none';
    if (btnGuardar) {
        btnGuardar.disabled = false;
        btnGuardar.style.opacity = '1';
    }
}


async function cargarInventarioDesdeNube() {
    const tableUrl = `${SUPABASE_URL}/rest/v1/inventario?select=*`;

    try {
        const response = await fetch(tableUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const datos = await response.json();
            
            // Mapeamos los datos para que coincidan con tu lógica local
            // Especialmente extrayendo lo que guardamos en el JSONB 'detalles'
            inventario = datos.map(item => ({
                id: item.id,
                titulo: item.titulo,
                autor: item.autor,
                editorial: item.editorial,
                isbn: item.isbn,
                genero: item.genero,
                coleccion: item.coleccion,
                paginas: item.paginas,
                estado: item.estado_fisico,
                costo: item.costo_inversion, // Nota: aquí podrías necesitar restar el envío si quieres desglosarlo
                envio: 0, comision_plat: 14, // <--- Inyectamos el valor fijo (ej. 14%)
                comision_tc: 3.5,
                sugerido: item.precio_sugerido,
                minimo: calcular_precio_venta_minimo(item.costo_inversion,item.precio_sugerido),
                foto: item.foto_url,
                status: item.status,
                fecha: item.created_at,
                // Extraemos del JSONB detalles
                pasta: item.detalles?.pasta || 'Rústica',
                condicion: item.detalles?.condicion || 'Usado',
                raro: item.detalles?.raro || false,
                popular: item.detalles?.popular || false,
                sobrecubierta: item.detalles?.sobrecubierta || false,
                comentarios: item.detalles?.comentarios || ""
            }));

            console.log("Inventario sincronizado con la nube");
            render(); // Dibujamos la tabla con los datos frescos
        }
    } catch (err) {
        console.error("Error al sincronizar:", err);
    }
}


function calcular_precio_venta_minimo( costo, precio_sugerido ) {
    let costoInversion = parseFloat(costo);
    let precioSugerido = parseFloat(precio_sugerido);
    // 1. Calculamos el mínimo deseado (80% del sugerido)
    let minCalculado = precioSugerido * 0.8;
    // 2. Definimos el "Suelo de Seguridad" (Costo + 10% de ganancia mínima)
    const sueloSeguridad = costoInversion * 1.1;
    // 3. Aplicamos la protección: si el mínimo baja del suelo, se queda en el suelo
    if (minCalculado < sueloSeguridad) { minCalculado = sueloSeguridad; }
    return minCalculado;
}

async function borrarLibro(id) {
    const libro = inventario.find(l => l.id === id);
    if (!libro) return;

    if (confirm(`¿Eliminar permanentemente "${libro.titulo}" y su portada?`)) {
        try {
            // 1. ELIMINAR IMAGEN DEL STORAGE (si existe)
            if (libro.foto && libro.foto.includes(BUCKET_NAME)) {
                // Extraemos el nombre del archivo de la URL (lo que va después de /public/portadas/)
                const nombreArchivo = libro.foto.split(`${BUCKET_NAME}/`).pop();
                const storageUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${nombreArchivo}`;

                const resStorage = await fetch(storageUrl, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'apikey': SUPABASE_KEY
                    }
                });

                if (resStorage.ok) {
                    console.log("Archivo de imagen eliminado del Storage.");
                }
            }

            // 2. ELIMINAR REGISTRO DE LA TABLA
            const tableUrl = `${SUPABASE_URL}/rest/v1/inventario?id=eq.${id}`;
            const resTable = await fetch(tableUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'apikey': SUPABASE_KEY
                }
            });

            if (resTable.ok) {
                inventario = inventario.filter(l => l.id !== id);
                save(); 
                render();
                console.log("Registro eliminado con éxito.");
            }

        } catch (err) {
            console.error("Error en el proceso de borrado:", err);
            alert("Error al conectar con Supabase.");
        }
    }
}

/*
async function apartar(id) {
    const idx = inventario.findIndex(l => l.id === id);
    if (idx === -1) return;

    const cliente = prompt("¿A quién se le aparta este ejemplar?", inventario[idx].apartado_por || "");
    
    if (cliente !== null && cliente.trim() !== "") {
        const url = `${SUPABASE_URL}/rest/v1/inventario?id=eq.${id}`;

        try {
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    status: 'Apartado',
                    apartado_por: cliente
                })
            });

            if (response.ok) {
                // Actualización local solo si la nube confirma
                inventario[idx].status = 'Apartado';
                inventario[idx].apartado_por = cliente;
                
                save(); // Actualizamos el backup del localStorage
                render();
                console.log(`Libro ${id} apartado para ${cliente}`);
            } else {
                alert("Error al sincronizar el apartado con la nube.");
            }
        } catch (err) {
            console.error("Error de conexión:", err);
        }
    }
}
*/

async function apartar(id) {
    const idx = inventario.findIndex(l => l.id === id);
    const cliente = prompt("¿A quién se le aparta?", inventario[idx].apartado_por || "");

    if (cliente) {
        // Llamamos a la función central enviando el dato extra
        const exito = await actualizarEstadoEnNube(id, 'Apartado', { apartado_por: cliente });

        if (exito) {
            inventario[idx].status = 'Apartado';
            inventario[idx].apartado_por = cliente;
            save(); render();
        }
    }
}


/*
async function liberar(id) {
    if(confirm("¿Deseas quitar el apartado y poner disponible nuevamente?")) {
        const url = `${SUPABASE_URL}/rest/v1/inventario?id=eq.${id}`;

        try {
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'Disponible',
                    apartado_por: null
                })
            });

            if (response.ok) {
                const idx = inventario.findIndex(l => l.id === id);
                inventario[idx].status = 'Disponible';
                inventario[idx].apartado_por = null;
                
                save();
                render();
            }
        } catch (err) {
            console.error("Error al liberar:", err);
        }
    }
}*/


async function liberar(id) {
    if(confirm("¿Poner disponible nuevamente?")) {
        const exito = await actualizarEstadoEnNube(id, 'Disponible', { apartado_por: null });

        if (exito) {
            const idx = inventario.findIndex(l => l.id === id);
            inventario[idx].status = 'Disponible';
            inventario[idx].apartado_por = null;
            save(); render();
        }
    }
}

async function vender(id) {
    const idx = inventario.findIndex(l => l.id === id);
    if (idx === -1) return;
    const l = inventario[idx];

    // 1. Preguntar el Canal de Venta
    const canal = prompt("¿Venta por (P)lataforma o (D)irecta?", "D").toUpperCase();
    if (canal !== 'P' && canal !== 'D') return;

    // 2. Precio final y Método de pago
    const pReal = prompt(`Precio final para "${l.titulo}":`, l.sugerido);
    if (!pReal) return;
    
    const met = prompt("E - Efectivo / T - Transferencia / C - Tarjeta", "E").toUpperCase();
    let metodoTxt = met === 'C' ? 'Tarjeta' : (met === 'T' ? 'Transf.' : 'Efectivo');
    
    // 3. Cálculos Financieros usando TUS variables del mapeo
    const precioVenta = parseFloat(pReal) || 0;
    
    // Lógica de comisiones:
    // Si es Directa (D), la plataforma es 0. Si es (P), usa el 14 que ya inyectaste.
    const porcPlat = (canal === 'P') ? l.comision_plat : 0; 
    // La comisión de tarjeta (3.5) solo se aplica si el método es 'C'
    const porcTC = (met === 'C') ? l.comision_tc : 0;
    
    const comPlat = precioVenta * (porcPlat / 100);
    const comBanco = precioVenta * (porcTC / 100);
    
    const comisionTotal = comPlat + comBanco;
    const neta = precioVenta - l.costo - comisionTotal;

    // 4. Días en estante
    const fechaIngreso = new Date(l.fecha); 
    const diasEnEstante = Math.max(1, Math.ceil((new Date() - fechaIngreso) / (1000 * 60 * 60 * 24)));

    try {
        const resVenta = await fetch(`${SUPABASE_URL}/rest/v1/ventas`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                titulo: l.titulo,
                precio_venta: precioVenta,
                utilidad_neta: neta,
                comision_total: comisionTotal,
                metodo_pago: (canal === 'P' ? "Plat - " : "") + metodoTxt,
                dias_en_estante: diasEnEstante,
                libro_id: l.id
            })
        });

        if (resVenta.ok) {
            const exitoStatus = await actualizarEstadoEnNube(id, 'Vendido');

            if (exitoStatus) {
                l.status = 'Vendido';
                
                ventas.push({
                    titulo: l.titulo,
                    p_venta: precioVenta,
                    neta: neta,
                    comisionTotal: comisionTotal,
                    metodo: (canal === 'P' ? "Plat - " : "") + metodoTxt,
                    fecha: new Date().toLocaleDateString('es-MX'),
                    dias: diasEnEstante
                });

                actualizarDashboard();
                save();
                render();
                alert(`¡Venta registrada!\nUtilidad: $${neta.toFixed(2)}`);
            }
        } else {
            const errorDetalle = await resVenta.json();
            console.error("Error 400:", errorDetalle);
        }
    } catch (err) {
        console.error("Error crítico:", err);
    }
}



async function cargarVentasDesdeNube() {
    try {
        //const response = await fetch(`${SUPABASE_URL}/rest/v1/ventas?select=*&order=fecha.desc`, {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/ventas?reporte_id=is.null&order=fecha.desc`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY
            }
        });

        if (response.ok) {
            const datos = await response.json();
            ventas = datos.map(v => ({
                titulo: v.titulo,
                p_venta: v.precio_venta,
                neta: v.utilidad_neta,
                comisionTotal: v.comision_total,
                metodo: v.metodo_pago,
                fecha: new Date(v.fecha).toLocaleDateString('es-MX'),
                dias: v.dias_en_estante
            }));
            actualizarDashboard();
            render();
        }
    } catch (err) {
        console.error("Error al cargar ventas:", err);
    }
}





async function actualizarEstadoEnNube(id, nuevoEstado, extraData = {}) {
    const url = `${SUPABASE_URL}/rest/v1/inventario?id=eq.${id}`;
    
    // Construimos el cuerpo del mensaje. 
    // "extraData" sirve para enviar cosas como el nombre del cliente en apartados.
    const body = { status: nuevoEstado, ...extraData };

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(body)
        });

        return response.ok; // Devuelve true si se guardó bien
    } catch (err) {
        console.error("Error de conexión:", err);
        return false;
    }
}



function actualizarDashboard() {
    // 1. Libros en estante (Disponibles y Apartados)
    const librosEnEstante = inventario.filter(l => l.status !== 'Vendido').length;
    document.getElementById('statEstante').innerText = librosEnEstante;

    // 2. Ganancias y Comisiones Totales
    const totalNeta = ventas.reduce((acc, v) => acc + (parseFloat(v.neta) || 0), 0);
    const totalComisiones = ventas.reduce((acc, v) => acc + (parseFloat(v.comisionTotal) || 0), 0);

    document.getElementById('statGanancia').innerText = `$${totalNeta.toFixed(0)}`;
    document.getElementById('statComisiones').innerText = `$${totalComisiones.toFixed(0)}`;

    // 3. Cálculo dinámico de Mes Pasado
    /*
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();

    const ventasMesPasado = ventas.filter(v => {
        // Formato esperado DD/MM/YYYY
        const partes = v.fecha.split('/');
        if (partes.length !== 3) return false;
        const fechaVenta = new Date(partes[2], partes[1] - 1, partes[0]);
        
        const objetivoMes = mesActual === 0 ? 11 : mesActual - 1;
        const objetivoAño = mesActual === 0 ? añoActual - 1 : añoActual;
        
        return fechaVenta.getMonth() === objetivoMes && fechaVenta.getFullYear() === objetivoAño;
    });

    const gananciaMesPasado = ventasMesPasado.reduce((acc, v) => acc + (parseFloat(v.neta) || 0), 0);
    document.getElementById('statMesPasado').innerText = `$${gananciaMesPasado.toFixed(0)}`;
    */
    document.getElementById('statMesPasado').innerText = `$${parseFloat(mesPasado).toFixed(0)}`;
}



async function cierreMensual() {
    const ahora = new Date();
    // Formato MM-YYYY para México
    const periodo = `${(ahora.getMonth() + 1).toString().padStart(2, '0')}-${ahora.getFullYear()}`;

    if (!confirm(`¿Confirmas el cierre de ${periodo}? Se generará un reporte en la nube.`)) return;

    // 1. Consolidación de datos del arreglo local
    const totalVentas = ventas.reduce((acc, v) => acc + (parseFloat(v.p_venta) || 0), 0);
    const utilidadNeta = ventas.reduce((acc, v) => acc + (parseFloat(v.neta) || 0), 0);
    const totalComisiones = ventas.reduce((acc, v) => acc + (parseFloat(v.comisionTotal) || 0), 0);
    const cantidadLibros = ventas.length;

    // 2. Cálculo del Autor más vendido (Lógica extraída de tu inventario)
    const conteoAutores = {};
    ventas.forEach(v => {
        const libro = inventario.find(l => l.titulo === v.titulo);
        const autor = libro ? libro.autor : "Desconocido";
        conteoAutores[autor] = (conteoAutores[autor] || 0) + 1;
    });

    const autorTop = Object.keys(conteoAutores).reduce((a, b) => 
        conteoAutores[a] > conteoAutores[b] ? a : b, "N/A");

    try {
        // 3. Envío a Supabase
        const response = await fetch(`${SUPABASE_URL}/rest/v1/reportes_mensuales`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json',
                //'Prefer': 'return=minimal'
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                mes_año: periodo,
                total_ventas: totalVentas,
                utilidad_neta: utilidadNeta,
                comisiones_pagadas: totalComisiones,
                libros_vendidos: cantidadLibros
            })
        });

        if (response.ok) {
            const reporteCreado = await response.json();
            const nuevoReporteId = reporteCreado[0].id;
            // B. "SELLAR" las ventas actuales con este reporte_id
            // Hacemos un update masivo en Supabase para todas las ventas que no tienen reporte_id
            await fetch(`${SUPABASE_URL}/rest/v1/ventas?reporte_id=is.null`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'apikey': SUPABASE_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reporte_id: nuevoReporteId })
            });




            console.log(`Reporte guardado. El autor estrella fue: ${autorTop}`);
            alert(`Cierre de ${periodo} completado con éxito.\nUtilidad: $${utilidadNeta.toFixed(0)}`);
            
            // 4. Limpieza para el nuevo ciclo
            ventas = [];
            save(); // Actualiza localmente
            render(); // Refresca el Dashboard a ceros (excepto stock)
        } else {
            const err = await response.json();
            throw new Error(err.message);
        }
    } catch (error) {
        console.error("Error en el cierre:", error);
        alert("No se pudo guardar el reporte. Verifica la conexión o las políticas RLS.");
    }
}

// Cargar el último reporte mensual para alimentar el dashboard
async function cargarUltimoReporte() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/reportes_mensuales?select=utilidad_neta&order=id.desc&limit=1`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY
            }
        });
        const datos = await res.json();
        if (datos.length > 0) {
            // Guardamos el valor en la variable que usa tu dashboard para "Mes Pasado"
            mesPasado = datos[0].utilidad_neta;
            actualizarDashboard();
        }
    } catch (e) {
        console.error("No se pudo cargar el histórico del mes pasado");
    }
}

function exportarCSV(tipo) {
    let csv = "";
    let nombreArchivo = "";

    if (tipo === 'inventario') {
        csv = "Titulo,Autor,Editorial,Costo_Total,Precio_Sugerido,Estado\n";
        csv += inventario.map(l => 
            `"${l.titulo}","${l.autor}","${l.editorial}",${l.costo},${l.sugerido},"${l.status}"`
        ).join("\n");
        nombreArchivo = `Inventario_LUL_${new Date().toLocaleDateString('es-MX')}.csv`;
    } else {
        csv = "Fecha,Titulo,Precio_Venta,Utilidad_Neta,Comision,Metodo\n";
        csv += ventas.map(v => 
            `"${v.fecha}","${v.titulo}",${v.p_venta},${v.neta},${v.comisionTotal},"${v.metodo}"`
        ).join("\n");
        nombreArchivo = `Ventas_Mes_LUL.csv`;
    }

    // Añadimos el BOM (\ufeff) para que Excel reconozca los acentos y la eñe correctamente
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nombreArchivo;
    link.click();
}
