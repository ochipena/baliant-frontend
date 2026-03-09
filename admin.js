document.addEventListener('DOMContentLoaded', async () => {
    const tablaBody = document.getElementById('tabla-ventas-body');

    let adminPass = localStorage.getItem('baliant_llave_admin');

    if (!adminPass) {
        adminPass = prompt("🔒 ACCESO RESTRINGIDO\nIngresá la contraseña de administrador de BALIANT:");
        if (!adminPass) {
            document.body.innerHTML = "<h1 style='color:#ff4444; text-align:center; margin-top:100px;'>ACCESO BLOQUEADO</h1>";
            return;
        }
    }

    try {
        // 🔥 Apuntamos a tu IP local para que funcione desde cualquier compu/celu de tu casa
        const respuesta = await fetch('https://baliant-backend.onrender.com/api/ventas', {
            headers: { 'admin-pass': adminPass }
        });

        if (respuesta.status === 401) {
            localStorage.removeItem('baliant_llave_admin'); 
            alert("❌ Contraseña incorrecta. Acceso denegado.");
            window.location.reload(); 
            return;
        }

        localStorage.setItem('baliant_llave_admin', adminPass);
        const ventas = await respuesta.json();

        tablaBody.innerHTML = '';

        if (ventas.length === 0) {
            tablaBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px; color: #888;">No hay ventas registradas todavía.</td></tr>';
            return;
        }

        ventas.forEach(venta => {
            // ==========================================
            // 1. MAGIA: DESEMPAQUETAR LOS PRODUCTOS
            // ==========================================
            let listaProductosHTML = '<span style="color:#666; font-size:0.8rem;">Sin detalle</span>';
            
            if (venta.productos_vendidos) {
                try {
                    const productosArray = typeof venta.productos_vendidos === 'string' ? JSON.parse(venta.productos_vendidos) : venta.productos_vendidos;
                    
                    if (productosArray.length > 0) {
                        listaProductosHTML = productosArray.map(prod => {
                            const nombre = prod.title || prod.nombre || 'Producto';
                            const cant = prod.quantity || prod.cantidad || 1;
                            const talle = prod.description || prod.talle || '-';
                            
                            // Si es el costo de envío, no lo mostramos en la lista de ropa
                            if (nombre.includes("Costo de Envío")) return '';

                            return `<div class="badge-producto" style="background:#1a1a1a; padding:5px; border:1px solid #333; margin:2px; display:inline-block; border-radius:4px;">${cant}x ${nombre} <span style="color:#00e5ff; font-weight:bold;">Talle: ${talle}</span></div>`;
                        }).join('');
                    }
                } catch(e) { console.error("Error leyendo JSON", e); }
            }

            // ==========================================
            // 2. MAGIA: EL BOTÓN DE ENVIADO
            // ==========================================
            let botonAccion = '';
            if (venta.estado === 'approved') {
                botonAccion = `<button onclick="marcarComoEnviado('${venta.id_pago}')" style="background:#00e5ff; color:#000; border:none; padding:8px 15px; border-radius:6px; font-weight:bold; cursor:pointer;">Marcar Enviado</button>`;
            } else if (venta.estado === 'enviado') {
                botonAccion = `<button disabled style="background:#128C7E; color:#fff; border:none; padding:8px 15px; border-radius:6px; font-weight:bold; cursor:not-allowed;">Despachado ✅</button>`;
            } else {
                botonAccion = `<span style="color:#888;">${venta.estado}</span>`;
            }

            // 3. DIBUJAMOS LA FILA
            const fila = document.createElement('tr');
            fila.style.borderBottom = '1px solid #333';
            fila.innerHTML = `
                <td style="padding: 15px; color: #aaa; font-weight:bold;">#${venta.id_pago}</td>
                <td style="padding: 15px;">
                    <strong style="color:#fff;">${venta.nombre_cliente || 'Sin nombre'}</strong><br>
                    <span style="font-size: 0.8rem; color:#888;">📞 ${venta.telefono || '-'}</span>
                </td>
                <td style="padding: 15px;">
                    <span style="color:#ccc;">${venta.direccion || '-'}</span><br>
                    <span style="font-size: 0.8rem; color:#888;">${venta.provincia || '-'} (CP: ${venta.codigo_postal || '-'})</span>
                </td>
                <td style="padding: 15px;">${listaProductosHTML}</td>
                <td style="padding: 15px; font-weight: 900; color: #00e5ff;">$${Number(venta.total).toLocaleString('es-AR')}</td>
                <td style="padding: 15px; font-weight: bold; color: ${venta.estado === 'approved' ? '#00e5ff' : (venta.estado === 'enviado' ? '#128C7E' : '#ff4444')}; text-transform: uppercase;">
                    ${venta.estado}
                </td>
                <td style="padding: 15px;">${botonAccion}</td>
            `;
            
            fila.addEventListener('mouseenter', () => fila.style.backgroundColor = '#1a1a1a');
            fila.addEventListener('mouseleave', () => fila.style.backgroundColor = 'transparent');
            tablaBody.appendChild(fila);
        });

    } catch (error) {
        console.error('Error:', error);
        tablaBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px; color: #ff4444;">No hay conexión con el servidor.</td></tr>';
    }
});

// 🔥 FUNCIÓN QUE LE AVISA A NODE.JS QUE EL PAQUETE SE DESPACHÓ
async function marcarComoEnviado(idPago) {
    if(!confirm(`¿Estás seguro de marcar la orden #${idPago} como DESPACHADA?`)) return;

    const adminPass = localStorage.getItem('baliant_llave_admin');
    
    try {
        const respuesta = await fetch(`https://baliant-backend.onrender.com/api/ventas/${idPago}/enviar`, {
            method: 'PUT',
            headers: { 'admin-pass': adminPass }
        });

        if (respuesta.ok) {
            alert("✅ ¡Pedido marcado como enviado exitosamente!");
            window.location.reload(); 
        } else {
            alert("❌ Hubo un error al actualizar el estado.");
        }
    } catch (error) {
        alert("❌ Error de conexión al intentar actualizar.");
    }
}