/* =======================================================================
   RULETA DEL AULA VIRTUAL
   HTML + CSS + JavaScript puro (sin librerías externas)
   Practica Calificada 3 - Desarrollo de Aplicaciones Web
   ======================================================================= */

/* ---------- Referencias a elementos del DOM ---------- */
const lienzoRuleta = document.getElementById("lienzoRuleta");
const contextoDibujo = lienzoRuleta.getContext("2d");
const zonaRuleta = document.getElementById("zonaRuleta");
const contenedorRuleta = document.getElementById("contenedorRuleta");
const botonCentroGirar = document.getElementById("botonCentroGirar");
const botonIniciar = document.getElementById("botonIniciar");
const botonReiniciar = document.getElementById("botonReiniciar");
const botonTitulo = document.getElementById("botonTitulo");
const botonEditar = document.getElementById("botonEditar");
const botonEsconder = document.getElementById("botonEsconder");
const areaElementos = document.getElementById("areaElementos");
const capaResaltado = document.getElementById("capaResaltado");
const textoRespuesta = document.getElementById("textoRespuesta");
const campoTituloLista = document.getElementById("campoTituloLista");
const mensajeEstado = document.getElementById("mensajeEstado");

/* ---------- Constantes ---------- */
const CLAVE_ALMACENAMIENTO_ELEMENTOS = "ruletaAulaVirtual_elementos";
const CLAVE_ALMACENAMIENTO_TITULO = "ruletaAulaVirtual_titulo";
const CLAVE_ALMACENAMIENTO_OCULTOS = "ruletaAulaVirtual_ocultos";

const coloresBasicos = ["#e05656", "#4f8fe0", "#f4c542", "#4fbf7a", "#b56ce0"]; // 5 colores básicos

const LISTA_ELEMENTOS_POR_DEFECTO = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];

/* ---------- Estado de la aplicación ---------- */
let conjuntoElementosOcultos = new Set(); // nombres de elementos ocultos (no entran al sorteo)
let ultimoElementoSeleccionado = null; // texto del último elemento que salió sorteado
let rotacionActualGrados = 0; // rotación acumulada del lienzo (para animar sin saltos)
let laRuletaEstaGirando = false;
let modoEdicionActivo = false;

/* =======================================================================
   PERSISTENCIA EN LOCAL STORAGE  (F5)
   ======================================================================= */
function guardarDatosEnLocalStorage() {
  localStorage.setItem(CLAVE_ALMACENAMIENTO_ELEMENTOS, areaElementos.value);
  localStorage.setItem(CLAVE_ALMACENAMIENTO_TITULO, campoTituloLista.value);
  localStorage.setItem(
    CLAVE_ALMACENAMIENTO_OCULTOS,
    JSON.stringify([...conjuntoElementosOcultos]),
  );
}

function cargarDatosGuardados() {
  const elementosGuardados = localStorage.getItem(
    CLAVE_ALMACENAMIENTO_ELEMENTOS,
  );
  const tituloGuardado = localStorage.getItem(CLAVE_ALMACENAMIENTO_TITULO);
  const ocultosGuardados = localStorage.getItem(CLAVE_ALMACENAMIENTO_OCULTOS);

  areaElementos.value =
    elementosGuardados !== null
      ? elementosGuardados
      : LISTA_ELEMENTOS_POR_DEFECTO.join("\n");

  if (tituloGuardado) campoTituloLista.value = tituloGuardado;

  if (ocultosGuardados) {
    try {
      conjuntoElementosOcultos = new Set(JSON.parse(ocultosGuardados));
    } catch (error) {
      conjuntoElementosOcultos = new Set();
    }
  }
}

/* =======================================================================
   OBTENER ELEMENTOS DESDE EL TEXTAREA  (F3)
   ======================================================================= */
function obtenerTodosLosElementos() {
  return areaElementos.value
    .split("\n")
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0);
}

function obtenerElementosVisibles() {
  return obtenerTodosLosElementos().filter(
    (el) => !conjuntoElementosOcultos.has(el),
  );
}

/* =======================================================================
   DIBUJO DE LA RULETA  (F1, F2)
   ======================================================================= */
function dibujarRuleta() {
  const elementos = obtenerTodosLosElementos();
  const centroX = lienzoRuleta.width / 2;
  const centroY = lienzoRuleta.height / 2;
  const radio = Math.min(centroX, centroY) - 6;

  contextoDibujo.clearRect(0, 0, lienzoRuleta.width, lienzoRuleta.height);

  if (elementos.length === 0) {
    contextoDibujo.beginPath();
    contextoDibujo.arc(centroX, centroY, radio, 0, Math.PI * 2);
    contextoDibujo.fillStyle = "#2b2f3d";
    contextoDibujo.fill();
    return;
  }

  const anguloPorSector = (Math.PI * 2) / elementos.length;
  const anguloInicialBase = -Math.PI / 2; // el sector 0 empieza arriba (bajo el puntero)

  elementos.forEach((textoElemento, indice) => {
    const anguloInicio = anguloInicialBase + indice * anguloPorSector;
    const anguloFin = anguloInicio + anguloPorSector;
    const estaOculto = conjuntoElementosOcultos.has(textoElemento);

    // Sector
    contextoDibujo.beginPath();
    contextoDibujo.moveTo(centroX, centroY);
    contextoDibujo.arc(centroX, centroY, radio, anguloInicio, anguloFin);
    contextoDibujo.closePath();
    contextoDibujo.fillStyle = estaOculto
      ? "#3a3f4f"
      : coloresBasicos[indice % coloresBasicos.length];
    contextoDibujo.fill();
    contextoDibujo.strokeStyle = "#12141c";
    contextoDibujo.lineWidth = 2;
    contextoDibujo.stroke();

    // Texto del elemento, orientado radialmente
    contextoDibujo.save();
    contextoDibujo.translate(centroX, centroY);
    contextoDibujo.rotate(anguloInicio + anguloPorSector / 2);
    contextoDibujo.textAlign = "right";
    contextoDibujo.textBaseline = "middle";
    contextoDibujo.fillStyle = estaOculto ? "#8a8f9e" : "#ffffff";
    contextoDibujo.font = "600 20px 'Segoe UI', sans-serif";
    const textoRecortado =
      textoElemento.length > 16
        ? textoElemento.slice(0, 15) + "…"
        : textoElemento;
    contextoDibujo.fillText(textoRecortado, radio - 16, 0);
    contextoDibujo.restore();
  });

  // Centro decorativo
  contextoDibujo.beginPath();
  contextoDibujo.arc(centroX, centroY, 46, 0, Math.PI * 2);
  contextoDibujo.fillStyle = "#12141c";
  contextoDibujo.fill();
}

/* =======================================================================
   GIRO ALEATORIO DE LA RULETA  (F3 del punto a)
   ======================================================================= */
function girarRuleta() {
  if (laRuletaEstaGirando) return;

  const elementosVisibles = obtenerElementosVisibles();
  if (elementosVisibles.length === 0) {
    mostrarMensajeEstado("No hay elementos disponibles para girar.");
    return;
  }

  const elementosTotales = obtenerTodosLosElementos();
  const indiceGanadorVisible = Math.floor(
    Math.random() * elementosVisibles.length,
  );
  const elementoGanador = elementosVisibles[indiceGanadorVisible];

  // El sorteo respeta la posición real del elemento dentro de TODOS los sectores dibujados
  const indiceGanadorReal = elementosTotales.indexOf(elementoGanador);
  const anguloPorSector = 360 / elementosTotales.length;
  const anguloCentroSector =
    indiceGanadorReal * anguloPorSector + anguloPorSector / 2;

  const vueltasExtra = 5 + Math.floor(Math.random() * 3); // 5 a 7 vueltas completas
  const objetivoModulo = (((360 - anguloCentroSector) % 360) + 360) % 360;
  const rotacionActualModulo = ((rotacionActualGrados % 360) + 360) % 360;
  const incrementoHastaObjetivo =
    (objetivoModulo - rotacionActualModulo + 360) % 360;

  const nuevaRotacion =
    rotacionActualGrados + incrementoHastaObjetivo + 360 * vueltasExtra;

  laRuletaEstaGirando = true;
  deshabilitarControlesDuranteGiro(true);
  textoRespuesta.textContent = "Girando…";

  lienzoRuleta.style.transform = `rotate(${nuevaRotacion}deg)`;

  const finalizarGiro = () => {
    lienzoRuleta.removeEventListener("transitionend", finalizarGiro);
    rotacionActualGrados = nuevaRotacion;
    laRuletaEstaGirando = false;
    deshabilitarControlesDuranteGiro(false);

    ultimoElementoSeleccionado = elementoGanador;
    textoRespuesta.textContent = elementoGanador;
    mostrarMensajeEstado(
      `Elemento seleccionado: "${elementoGanador}". Pulsa S para ocultarlo.`,
    );
  };
  lienzoRuleta.addEventListener("transitionend", finalizarGiro);
}

function deshabilitarControlesDuranteGiro(deshabilitar) {
  botonIniciar.disabled = deshabilitar;
  botonCentroGirar.disabled = deshabilitar;
}

/* =======================================================================
   EDICIÓN DEL TEXTAREA  (F4, F6, F7 del punto b)
   ======================================================================= */
function activarModoEdicion() {
  modoEdicionActivo = true;
  areaElementos.removeAttribute("readonly");
  areaElementos.focus();
  botonEditar.classList.add("activo");
  mostrarMensajeEstado(
    "Modo edición activado: puedes escribir texto o números.",
  );
}

function desactivarModoEdicion() {
  modoEdicionActivo = false;
  areaElementos.setAttribute("readonly", "true");
  botonEditar.classList.remove("activo");
}

function alternarModoEdicion() {
  modoEdicionActivo ? desactivarModoEdicion() : activarModoEdicion();
}

function actualizarRuletaDesdeTextarea() {
  dibujarRuleta();
  actualizarCapaResaltado();
  guardarDatosEnLocalStorage();
}

/* Capa visual detrás del textarea que resalta en gris las líneas ocultas (F7) */
function actualizarCapaResaltado() {
  const lineas = areaElementos.value.split("\n");
  const html = lineas
    .map((linea) => {
      const textoLimpio = linea.trim();
      const estaOculto =
        textoLimpio.length > 0 && conjuntoElementosOcultos.has(textoLimpio);
      const lineaEscapada = escaparHtml(linea) || "&nbsp;";
      return estaOculto
        ? `<span class="linea-oculta">${lineaEscapada}</span>`
        : `<span>${lineaEscapada}</span>`;
    })
    .join("\n");
  capaResaltado.innerHTML = html;
}

function sincronizarScrollCapaResaltado() {
  capaResaltado.scrollTop = areaElementos.scrollTop;
  capaResaltado.scrollLeft = areaElementos.scrollLeft;
}

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

/* =======================================================================
   OCULTAR ELEMENTO SELECCIONADO  (F7)
   ======================================================================= */
function ocultarElementoSeleccionado() {
  if (!ultimoElementoSeleccionado) {
    mostrarMensajeEstado(
      "Primero gira la ruleta para tener un elemento seleccionado.",
    );
    return;
  }
  conjuntoElementosOcultos.add(ultimoElementoSeleccionado);
  actualizarRuletaDesdeTextarea();
  mostrarMensajeEstado(
    `"${ultimoElementoSeleccionado}" fue ocultado y no entrará al siguiente sorteo.`,
  );
}

/* =======================================================================
   REINICIAR  (F8)
   ======================================================================= */
function reiniciarRuleta() {
  conjuntoElementosOcultos.clear();
  ultimoElementoSeleccionado = null;
  textoRespuesta.textContent = "—";
  rotacionActualGrados = rotacionActualGrados % 360;
  lienzoRuleta.style.transition = "none";
  lienzoRuleta.style.transform = `rotate(${rotacionActualGrados}deg)`;
  // Forzar reflow para restaurar la transición suave en el próximo giro
  void lienzoRuleta.offsetWidth;
  lienzoRuleta.style.transition = "";
  actualizarRuletaDesdeTextarea();
  mostrarMensajeEstado(
    "Ruleta reiniciada. Todos los elementos ocultos vuelven a estar disponibles.",
  );
}

/* =======================================================================
   PANTALLA COMPLETA  (F9)
   ======================================================================= */
function alternarPantallaCompleta() {
  if (!document.fullscreenElement) {
    contenedorRuleta.requestFullscreen().catch(() => {
      mostrarMensajeEstado(
        "El navegador no permitió activar pantalla completa.",
      );
    });
  } else {
    document.exitFullscreen();
  }
}

/* =======================================================================
   UTILIDADES
   ======================================================================= */
let temporizadorMensaje = null;
function mostrarMensajeEstado(texto) {
  mensajeEstado.textContent = texto;
  clearTimeout(temporizadorMensaje);
  temporizadorMensaje = setTimeout(() => {
    mensajeEstado.textContent = "";
  }, 4000);
}

/* =======================================================================
   EVENTOS
   ======================================================================= */
lienzoRuleta.addEventListener("click", girarRuleta);
botonCentroGirar.addEventListener("click", girarRuleta);
botonIniciar.addEventListener("click", girarRuleta);
botonReiniciar.addEventListener("click", reiniciarRuleta);

botonEditar.addEventListener("click", alternarModoEdicion);
areaElementos.addEventListener("click", () => {
  if (!modoEdicionActivo) activarModoEdicion();
});
areaElementos.addEventListener("input", actualizarRuletaDesdeTextarea);
areaElementos.addEventListener("scroll", sincronizarScrollCapaResaltado);

botonEsconder.addEventListener("click", ocultarElementoSeleccionado);

botonTitulo.addEventListener("click", () => {
  const nuevoTitulo = prompt("Título de la lista:", campoTituloLista.value);
  if (nuevoTitulo !== null && nuevoTitulo.trim() !== "") {
    campoTituloLista.value = nuevoTitulo.trim();
    guardarDatosEnLocalStorage();
  }
});
campoTituloLista.addEventListener("input", guardarDatosEnLocalStorage);

document.addEventListener("keydown", (evento) => {
  // Evitar disparar atajos mientras el usuario escribe en el textarea o el título
  const escribiendoEnCampo =
    document.activeElement === campoTituloLista ||
    (document.activeElement === areaElementos && modoEdicionActivo);
  if (escribiendoEnCampo) return;

  switch (evento.key.toLowerCase()) {
    case " ":
      evento.preventDefault();
      girarRuleta();
      break;
    case "s":
      ocultarElementoSeleccionado();
      break;
    case "r":
      reiniciarRuleta();
      break;
    case "e":
      alternarModoEdicion();
      break;
    case "f":
      alternarPantallaCompleta();
      break;
  }
});

/* =======================================================================
   INICIALIZACIÓN
   ======================================================================= */
function inicializarAplicacion() {
  cargarDatosGuardados();
  desactivarModoEdicion();
  actualizarRuletaDesdeTextarea();
}

inicializarAplicacion();
