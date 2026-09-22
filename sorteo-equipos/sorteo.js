(() => {
  'use strict';

  const campoParticipantes = document.getElementById('participantes');
  const contador = document.getElementById('contador');
  const errorParticipantes = document.getElementById('error-participantes');
  const estadoDatos = document.getElementById('estado-datos');
  const claveParticipantes = 'aula-virtual.sorteo-equipos.participantes';
  const modoSorteo = document.getElementById('modo-sorteo');
  const cantidad = document.getElementById('cantidad');
  const configuracion = document.getElementById('configuracion');
  const resultados = document.getElementById('resultados');
  const tituloResultado = document.getElementById('titulo-resultado');
  const listaEquipos = document.getElementById('lista-equipos');
  const estadoSorteo = document.getElementById('estado-sorteo');
  let equipos = [];
  let temporizador;
  const botonesExportacion = [...document.querySelectorAll('.equipos-acciones button')];
  const estadoExportacion = document.getElementById('estado-exportacion');

  function textoEquipos(enColumnas) {
    if (!enColumnas) {
      return tituloResultado.textContent + '\n\n' + equipos.map((integrantes, indice) =>
        `Equipo ${indice + 1}\n${integrantes.join('\n')}`).join('\n\n');
    }
    const filas = [equipos.map((_, indice) => `Equipo ${indice + 1}`).join('\t')];
    const cantidadFilas = Math.max(...equipos.map(equipo => equipo.length));
    for (let fila = 0; fila < cantidadFilas; fila++) {
      filas.push(equipos.map(equipo => (equipo[fila] || '').replace(/\t/g, ' ')).join('\t'));
    }
    return filas.join('\n');
  }

  async function copiarEquipos(enColumnas) {
    const texto = textoEquipos(enColumnas);
    document.getElementById('copia-manual').hidden = true;
    try {
      await navigator.clipboard.writeText(texto);
      estadoExportacion.textContent = enColumnas
        ? 'Equipos copiados en columnas. Puedes pegarlos en una hoja de cálculo.'
        : 'Equipos copiados al portapapeles.';
    } catch {
      const campoCopia = document.getElementById('texto-copia');
      document.getElementById('copia-manual').hidden = false;
      campoCopia.value = texto;
      campoCopia.focus();
      campoCopia.select();
      estadoExportacion.textContent = 'El navegador no permitió copiar automáticamente. El texto está seleccionado para copiarlo manualmente.';
    }
  }

  function dividirTexto(contexto, texto, ancho) {
    const lineas = [];
    let linea = '';
    for (const caracter of texto) {
      if (linea && contexto.measureText(linea + caracter).width > ancho) {
        lineas.push(linea);
        linea = '';
      }
      linea += caracter;
    }
    lineas.push(linea);
    return lineas;
  }

  function descargarImagen() {
    try {
      const lienzo = document.createElement('canvas');
      const contexto = lienzo.getContext('2d');
      const columnas = Math.min(3, equipos.length);
      const anchoTarjeta = 360;
      lienzo.width = columnas * (anchoTarjeta + 24) + 24;
      contexto.font = 'bold 30px sans-serif';
      const lineasTitulo = dividirTexto(contexto, tituloResultado.textContent, lienzo.width - 48);
      contexto.font = '18px sans-serif';
      const tarjetas = equipos.map(integrantes => integrantes.map((nombre, indice) =>
        dividirTexto(contexto, `${indice + 1}. ${nombre}`, anchoTarjeta - 40)));
      const alturas = [];
      for (let indice = 0; indice < tarjetas.length; indice += columnas) {
        alturas.push(Math.max(...tarjetas.slice(indice, indice + columnas).map(lineas =>
          70 + lineas.reduce((total, nombre) => total + nombre.length * 26 + 10, 0))));
      }
      const inicioTarjetas = 40 + lineasTitulo.length * 38 + 45;
      lienzo.height = inicioTarjetas + alturas.reduce((total, altura) => total + altura + 24, 0);
      contexto.fillStyle = '#f3f6fb';
      contexto.fillRect(0, 0, lienzo.width, lienzo.height);
      contexto.fillStyle = '#203047';
      contexto.font = 'bold 30px sans-serif';
      lineasTitulo.forEach((linea, indice) => contexto.fillText(linea, 24, 40 + indice * 38));
      contexto.font = '16px sans-serif';
      contexto.fillText(`${leerParticipantes().length} participantes · ${equipos.length} equipos`, 24, inicioTarjetas - 24);
      let posicionY = inicioTarjetas;
      tarjetas.forEach((nombres, indice) => {
        const columna = indice % columnas;
        const fila = Math.floor(indice / columnas);
        const posicionX = 24 + columna * (anchoTarjeta + 24);
        contexto.fillStyle = '#ffffff';
        contexto.fillRect(posicionX, posicionY, anchoTarjeta, alturas[fila]);
        contexto.strokeStyle = '#bbc8da';
        contexto.strokeRect(posicionX, posicionY, anchoTarjeta, alturas[fila]);
        contexto.fillStyle = '#245bc0';
        contexto.fillRect(posicionX, posicionY, anchoTarjeta, 4);
        contexto.font = 'bold 22px sans-serif';
        contexto.fillText(`Equipo ${indice + 1}`, posicionX + 20, posicionY + 38);
        contexto.fillStyle = '#203047';
        contexto.font = '18px sans-serif';
        let alturaNombre = posicionY + 72;
        nombres.forEach(lineas => {
          lineas.forEach(linea => {
            contexto.fillText(linea, posicionX + 20, alturaNombre);
            alturaNombre += 26;
          });
          alturaNombre += 10;
        });
        if (columna === columnas - 1) posicionY += alturas[fila] + 24;
      });
      lienzo.toBlob(archivo => {
        if (!archivo) {
          estadoExportacion.textContent = 'No se pudo crear la imagen. Intenta descargarla nuevamente.';
          return;
        }
        const direccion = URL.createObjectURL(archivo);
        const enlace = document.createElement('a');
        enlace.href = direccion;
        enlace.download = 'equipos.jpg';
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(direccion), 1000);
        estadoExportacion.textContent = 'Imagen JPG preparada para descargar.';
      }, 'image/jpeg', 0.92);
    } catch {
      estadoExportacion.textContent = 'No se pudo crear la imagen. Intenta descargarla nuevamente.';
    }
  }

  document.getElementById('copiar').addEventListener('click', () => copiarEquipos(false));
  document.getElementById('copiar-columnas').addEventListener('click', () => copiarEquipos(true));
  document.getElementById('descargar').addEventListener('click', descargarImagen);

  function actualizarCantidades() {
    const anterior = Number(cantidad.value);
    const maximo = Math.min(100, Math.max(1, leerParticipantes().length));
    cantidad.replaceChildren();
    for (let numero = 1; numero <= maximo; numero++) {
      cantidad.add(new Option(String(numero), String(numero)));
    }
    cantidad.value = String(Math.min(anterior || 2, maximo));
    document.getElementById('etiqueta-cantidad').textContent =
      modoSorteo.value === 'cantidad-equipos' ? 'Cantidad de equipos' : 'Participantes por equipo';
  }

  function formarEquipos(participantes, modo, valor) {
    const mezclados = [...participantes];
    for (let indice = mezclados.length - 1; indice > 0; indice--) {
      const elegido = Math.floor(Math.random() * (indice + 1));
      [mezclados[indice], mezclados[elegido]] = [mezclados[elegido], mezclados[indice]];
    }
    if (modo === 'participantes-por-equipo') {
      const grupos = [];
      for (let indice = 0; indice < mezclados.length; indice += valor) {
        grupos.push(mezclados.slice(indice, indice + valor));
      }
      return grupos;
    }
    const grupos = Array.from({ length: valor }, () => []);
    mezclados.forEach((nombre, indice) => grupos[indice % valor].push(nombre));
    return grupos;
  }

  function mostrarEquipos() {
    botonesExportacion.forEach(boton => { boton.disabled = true; });
    estadoExportacion.textContent = '';
    document.getElementById('copia-manual').hidden = true;
    listaEquipos.replaceChildren();
    const pendientes = [];
    equipos.forEach((integrantes, indice) => {
      const tarjeta = document.createElement('article');
      tarjeta.className = 'equipos-tarjeta';
      const subtitulo = document.createElement('h3');
      subtitulo.textContent = `Equipo ${indice + 1}`;
      const lista = document.createElement('ol');
      tarjeta.append(subtitulo, lista);
      listaEquipos.append(tarjeta);
      integrantes.forEach(nombre => pendientes.push({ lista, nombre }));
    });
    let mostrados = 0;
    const revelar = () => {
      const siguiente = pendientes[mostrados];
      const elemento = document.createElement('li');
      elemento.textContent = siguiente.nombre;
      siguiente.lista.append(elemento);
      mostrados++;
      estadoSorteo.textContent = `Asignando participantes: ${mostrados} de ${pendientes.length}`;
      if (mostrados < pendientes.length) {
        temporizador = setTimeout(revelar, 120);
      } else {
        estadoSorteo.textContent = `${pendientes.length} participantes distribuidos en ${equipos.length} equipos.`;
        botonesExportacion.forEach(boton => { boton.disabled = false; });
      }
    };
    revelar();
  }

  document.getElementById('generar').addEventListener('click', () => {
    if (!validarParticipantes()) {
      campoParticipantes.focus();
      return;
    }
    const participantes = leerParticipantes();
    if (!participantes.length) {
      errorParticipantes.textContent = 'Ingresa al menos un participante para generar los equipos.';
      campoParticipantes.focus();
      return;
    }
    equipos = formarEquipos(participantes, modoSorteo.value, Number(cantidad.value));
    tituloResultado.textContent = document.getElementById('titulo-equipos').value.trim() || 'Equipos del aula';
    configuracion.hidden = true;
    resultados.hidden = false;
    tituloResultado.focus();
    mostrarEquipos();
  });

  document.getElementById('volver').addEventListener('click', () => {
    clearTimeout(temporizador);
    resultados.hidden = true;
    configuracion.hidden = false;
    campoParticipantes.focus();
  });
  modoSorteo.addEventListener('change', actualizarCantidades);

  function leerParticipantes() {
    return campoParticipantes.value.split(/\r?\n/).map(nombre => nombre.trim()).filter(Boolean);
  }

  function validarParticipantes() {
    const participantes = leerParticipantes();
    contador.textContent = `${participantes.length} / 100 participantes`;
    let mensaje = '';
    if (participantes.length > 100) {
      mensaje = 'Solo se permiten 100 participantes. Retira las líneas sobrantes.';
    } else if (participantes.some(nombre => Array.from(nombre).length > 50)) {
      mensaje = 'Cada participante puede tener hasta 50 caracteres. Revisa los nombres largos.';
    }
    errorParticipantes.textContent = mensaje;
    campoParticipantes.setAttribute('aria-invalid', String(Boolean(mensaje)));
    return !mensaje;
  }

  campoParticipantes.addEventListener('input', () => {
    validarParticipantes();
    actualizarCantidades();
    try {
      localStorage.setItem(claveParticipantes, campoParticipantes.value);
      estadoDatos.textContent = 'Lista guardada en este navegador.';
    } catch {
      estadoDatos.textContent = 'No se pudo guardar la lista. Puedes continuar con el sorteo.';
    }
  });

  try {
    campoParticipantes.value = localStorage.getItem(claveParticipantes) || '';
  } catch {
    estadoDatos.textContent = 'El almacenamiento del navegador no está disponible.';
  }
  validarParticipantes();
  actualizarCantidades();
})();
