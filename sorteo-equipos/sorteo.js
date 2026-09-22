(() => {
  'use strict';

  const campoParticipantes = document.getElementById('participantes');
  const contador = document.getElementById('contador');
  const errorParticipantes = document.getElementById('error-participantes');
  const estadoDatos = document.getElementById('estado-datos');
  const claveParticipantes = 'aula-virtual.sorteo-equipos.participantes';

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
})();
