// --- RADARES DE INSPECCIÓN (Para ver en la consola F12) ---
console.log("🚀 El cerebro de BALIANT Checkout está DESPIERTO.");

// 1. Agarramos las partes del HTML
const listaRemeras = document.getElementById('lista-remeras');
const txtSubtotal = document.getElementById('txt-subtotal');
const txtEnvio = document.getElementById('txt-envio');
const txtTotal = document.getElementById('txt-total');

const selectProvincia = document.getElementById('cliente-provincia');
const cajaLogistica = document.getElementById('caja-logistica');
const selectMetodo = document.getElementById('metodo-envio');
const btnPagarMP = document.getElementById('btn-pagar-mp');

const cajaPassword = document.getElementById('caja-password-registro');
const inputPassword = document.getElementById('registro-password');

// --- LÓGICA DEL MODAL DE CONTRASEÑA ---
const checkCrearCuenta = document.getElementById('crear-cuenta-check');
const modalCuenta = document.getElementById('modal-crear-cuenta');
const btnCerrarModalCuenta = document.getElementById('btn-cerrar-modal-cuenta');
const btnConfirmarCuenta = document.getElementById('btn-confirmar-cuenta');
const inputModalPassword = document.getElementById('input-modal-password');
const hiddenPassword = document.getElementById('registro-password-hidden');

// 2. LEEMOS LA MEMORIA
const carrito = JSON.parse(localStorage.getItem('carritoBaliant')) || [];
console.log("🛒 Remeras encontradas en la memoria:", carrito);

let subtotalRopa = 0;
let costoEnvio = 0;
// Variables globales para el descuento
let porcentajeDescuento = 0;
let codigoCuponAplicado = "";

// 3. DIBUJAMOS LA ROPA
listaRemeras.innerHTML = ''; 
if (carrito.length === 0) {
    console.log("⚠️ El carrito vino vacío desde la otra página.");
    listaRemeras.innerHTML = '<p style="color: #aaa;">Tu carrito está vacío.</p>';
    btnPagarMP.disabled = true;
} else {
    carrito.forEach(item => {
        subtotalRopa += (Number(item.precio) * Number(item.cantidad));
        listaRemeras.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; gap: 15px;">
                <span style="color: #ccc; line-height: 1.4;">${item.cantidad}x ${item.nombre}</span>
                <span style="font-weight: bold; white-space: nowrap;">$${(item.precio * item.cantidad).toLocaleString('es-AR')}</span>
            </div>
        `;
    });
    console.log("💰 Subtotal calculado de la ropa: $" + subtotalRopa);
}

function aplicarCupon() {
    const input = document.getElementById('input-cupon').value.trim().toUpperCase();
    const mensaje = document.getElementById('mensaje-cupon');

    // 🏆 ACÁ DEFINÍS TUS CUPONES (Código : Porcentaje de descuento)
    const cuponesValidos = {
        "LANZAMIENTO": 15,    // 15% OFF
        "BALIANT2026": 20,    // 20% OFF
        "VIP": 30             // 30% OFF
    };

    if (cuponesValidos[input]) {
        // Cupón correcto
        porcentajeDescuento = cuponesValidos[input];
        codigoCuponAplicado = input;
        
        mensaje.style.display = "block";
        mensaje.style.color = "#25d366";
        mensaje.innerText = `¡Cupón válido! Tenés un ${porcentajeDescuento}% de descuento.`;
        
        // Bloqueamos la caja para que no lo toquen más
        document.getElementById('input-cupon').disabled = true;
        
        actualizarPantalla(); // Recalculamos la plata
    } else {
        // Cupón trucho o mal escrito
        porcentajeDescuento = 0;
        codigoCuponAplicado = "";
        
        mensaje.style.display = "block";
        mensaje.style.color = "#ff4444";
        mensaje.innerText = "Ese código no existe o ya expiró.";
        actualizarPantalla();
    }
}

function actualizarPantalla() {
    txtSubtotal.innerText = `$${subtotalRopa.toLocaleString('es-AR')}`;
    
    // 1. Calculamos el descuento sobre LA ROPA (no sobre el envío)
    let plataDescontada = 0;
    if (porcentajeDescuento > 0) {
        plataDescontada = (subtotalRopa * porcentajeDescuento) / 100;
        document.getElementById('renglon-descuento').style.display = 'flex';
        document.getElementById('txt-descuento').innerText = `-$${plataDescontada.toLocaleString('es-AR')}`;
    } else {
        document.getElementById('renglon-descuento').style.display = 'none';
    }

    // 2. Textos del envío
    if (costoEnvio === 0 && selectProvincia.value === 'CABA') {
        txtEnvio.innerText = 'Moto Gratis';
    } else if (costoEnvio === 0) {
        txtEnvio.innerText = 'Seleccioná provincia';
    } else {
        txtEnvio.innerText = `$${costoEnvio.toLocaleString('es-AR')}`;
    }

    // 3. LA SUMA FINAL (Ropa - Descuento + Envío)
    const sumaTotal = (subtotalRopa - plataDescontada) + costoEnvio;
    txtTotal.innerText = `$${sumaTotal.toLocaleString('es-AR')}`;
}

// 5. ESCUCHAMOS LA PROVINCIA
selectProvincia.addEventListener('change', (evento) => {
    const provinciaElegida = evento.target.value;

    if (provinciaElegida === 'CABA') {
        cajaLogistica.style.display = 'none';
        costoEnvio = 0;
    } 
    else if (provinciaElegida === 'GBA') {
        cajaLogistica.style.display = 'block';
        selectMetodo.innerHTML = `
            <option value="6000">Correo Argentino - $6.000</option>
            <option value="7500">Andreani - $7.500</option>
        `;
        costoEnvio = 6000; 
    } 
    // ¡ACÁ ESTÁ LA MAGIA! Si elige Córdoba (CBA), Catamarca (CT) o cualquier otra...
    else if (provinciaElegida !== "") {
        cajaLogistica.style.display = 'block';
        selectMetodo.innerHTML = `
            <option value="8000">Correo Argentino Nacional - $8.000</option>
            <option value="9500">Andreani Express - $9.500</option>
        `;
        costoEnvio = 8000; 
    }
    actualizarPantalla();
});

// 6. ESCUCHAMOS EL MÉTODO DE ENVÍO
selectMetodo.addEventListener('change', (evento) => {
    costoEnvio = parseInt(evento.target.value);
    console.log("🚚 El cliente cambió el correo. Nuevo costo: $" + costoEnvio);
    actualizarPantalla();
});

// 7. CONEXIÓN FINAL A MERCADO PAGO
btnPagarMP.addEventListener('click', async (evento) => {
    evento.preventDefault(); // Evita que la página se recargue por error

    // 1. Capturamos lo que el cliente escribió (Asegurate que los IDs coincidan con tu HTML)
    const nombre = document.getElementById('cliente-nombre') ? document.getElementById('cliente-nombre').value.trim() : "";
    const email = document.getElementById('cliente-email') ? document.getElementById('cliente-email').value.trim() : "";
    // 🔥 ACA CAPTURAMOS EL TELÉFONO (Verificá que el id="input-telefono" sea el mismo en tu HTML)
    const telefono = document.getElementById('input-telefono') ? document.getElementById('input-telefono').value.trim() : ""; 
    const provincia = selectProvincia.value;
    const direccion = document.getElementById('cliente-direccion') ? document.getElementById('cliente-direccion').value.trim() : "";
    const cp = document.getElementById('cliente-cp') ? document.getElementById('cliente-cp').value.trim() : "";

    // 2. Validamos que no deje nada en blanco (Ahora incluye el teléfono)
    if (!nombre || !email || !telefono || !provincia || !direccion || !cp) {
        mostrarToastError("¡Falta información! Por favor completá todos tus datos (incluyendo teléfono).");
        return;
    }

    // 🔥 2.5 Validamos si quiere crear cuenta y capturamos la clave del modal
    const quiereCrearCuenta = checkCrearCuenta.checked;
    let passwordFinal = null;

    if (quiereCrearCuenta) {
        passwordFinal = document.getElementById('registro-password-hidden').value.trim();
        if (passwordFinal.length < 6) {
            mostrarToastError("Falta la contraseña. Tildá de nuevo la opción para ingresarla.");
            // Destildamos porque hubo un error
            checkCrearCuenta.checked = false; 
            return;
        }
    }

    // 3. Armamos el paquete sumando la ropa + el envío
    const itemsParaPagar = [...carrito];
    
    if (costoEnvio > 0) {
        itemsParaPagar.push({
            nombre: "Costo de Envío",
            precio: costoEnvio,
            cantidad: 1
        });
    }

    // 4. ARMAMOS EL SÚPER PAQUETE (Ropa + Datos del cliente + Creación de Cuenta)
    const paqueteFinal = {
        items: itemsParaPagar,
        porcentajeDescuento: porcentajeDescuento, // 🔥 LE AVISAMOS AL BACKEND DEL CUPÓN
        comprador: {
            nombre: nombre,
            email: email,
            telefono: telefono, 
            provincia: provincia,
            direccion: direccion,
            cp: cp,
            crearCuenta: quiereCrearCuenta, // 🔥 Le avisa al backend si hay que hacer cuenta
            password: passwordFinal         // 🔥 Viaja la clave (o null si destildó la caja)
        }
    };

    try {
        btnPagarMP.innerText = "Preparando pago...";
        btnPagarMP.disabled = true;

        const respuesta = await fetch('https://baliant-backend.onrender.com/crear-preferencia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paqueteFinal) // Mandamos el paquete definitivo
        });

        const datos = await respuesta.json();

        if (datos.linkPago) {
            window.location.href = datos.linkPago; 
        } else {
            mostrarToastError("Error generando el link de pago.");
            btnPagarMP.innerText = "PAGAR CON MERCADO PAGO";
            btnPagarMP.disabled = false;
        }
    } catch (error) {
        mostrarToastError("No pudimos conectar con el servidor.");
        btnPagarMP.innerText = "PAGAR CON MERCADO PAGO";
        btnPagarMP.disabled = false;
    }
});

// --- CREADOR DEL TOAST DE ERROR ELEGANTE ---
function mostrarToastError(mensaje) {
    let toastViejo = document.getElementById('toast-error');
    if (toastViejo) toastViejo.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-error';
    toast.className = 'toast-baliant';
    toast.innerHTML = `<i class="fa-solid fa-circle-exclamation" style="color: #ff4444; font-size: 1.2rem;"></i> ${mensaje}`;
    
    document.body.appendChild(toast);

    // Animación de entrada
    setTimeout(() => toast.classList.add('mostrar'), 10);

    // Lo ocultamos después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('mostrar');
        setTimeout(() => toast.remove(), 400); 
    }, 3000);
}


// 1. Cuando tilda o destilda la casilla
checkCrearCuenta.addEventListener('change', function() {
    if (this.checked) {
        // Abre el modal flotante
        modalCuenta.classList.add('mostrar-modal');
        inputModalPassword.focus();
    } else {
        // Si destilda, borramos los datos por seguridad
        hiddenPassword.value = '';
        inputModalPassword.value = '';
    }
});

// 2. Cuando toca "GUARDAR Y CONTINUAR" en el modal
btnConfirmarCuenta.addEventListener('click', () => {
    const pass = inputModalPassword.value.trim();
    if (pass.length < 6) {
        mostrarToastError("La contraseña debe tener al menos 6 caracteres.");
        return;
    }
    // Guardamos la clave en el input invisible del formulario
    hiddenPassword.value = pass;
    // Cerramos el modal
    modalCuenta.classList.remove('mostrar-modal');
});

// 3. Cuando cierra el modal con la X (se arrepintió)
btnCerrarModalCuenta.addEventListener('click', () => {
    modalCuenta.classList.remove('mostrar-modal');
    // Si no había guardado ninguna clave validada, destildamos la casilla
    if (!hiddenPassword.value) {
        checkCrearCuenta.checked = false;
    }
});

// ==========================================
// 🔥 AUTOCOMPLETADO DE USUARIO LOGUEADO
// ==========================================
function cargarDatosUsuario() {
    const usuarioGuardado = JSON.parse(localStorage.getItem('usuarioBaliant'));

    if (usuarioGuardado) {
        console.log("👤 Usuario logueado detectado. Autocompletando caja...");
        
        // 1. Rellenamos los inputs de texto
        document.getElementById('cliente-nombre').value = usuarioGuardado.nombre || '';
        document.getElementById('cliente-email').value = usuarioGuardado.email || '';
        document.getElementById('input-telefono').value = usuarioGuardado.telefono || '';
        document.getElementById('cliente-direccion').value = usuarioGuardado.direccion || '';
        document.getElementById('cliente-cp').value = usuarioGuardado.codigo_postal || '';
        
        // 2. Seleccionamos la provincia guardada
        const selectProv = document.getElementById('cliente-provincia');
        if (usuarioGuardado.provincia) {
            selectProv.value = usuarioGuardado.provincia;
            // 🔥 TRUCO PRO: Disparamos el evento "change" para que aparezcan las opciones de envío de esa provincia
            selectProv.dispatchEvent(new Event('change'));
        }

        // 3. Escondemos la sección de "Crear cuenta" porque ya tiene una
        const seccionCuenta = document.getElementById('seccion-crear-cuenta');
        if (seccionCuenta) {
            seccionCuenta.style.display = 'none';
        }

        // 4. Por seguridad, destildamos la casilla oculta para que el backend no intente crearla de nuevo
        document.getElementById('crear-cuenta-check').checked = false;
    }
}

// Arrancamos la primera vista
cargarDatosUsuario(); // Primero cargamos los datos si los hay
actualizarPantalla(); // Después actualizamos los totales