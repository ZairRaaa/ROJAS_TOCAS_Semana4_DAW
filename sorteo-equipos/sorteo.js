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
