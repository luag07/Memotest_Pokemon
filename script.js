const cantidadParejas = 10;
const segundosPorTurno = 20;

let cartas = [];
let primeraCarta = null;
let segundaCarta = null;
let bloqueo = false;
let cantidadAcertadas = 0;
let turnoJugador = 1;
let puntos = { 1: [], 2: [] };
let intervalo;
let tiempoRestante = segundosPorTurno;

async function obtenerPokemonesAleatorios(cantidad) {
  const ids = new Set();
  while (ids.size < cantidad) {
    ids.add(Math.floor(Math.random() * 898) + 1);
  }

  const respuestas = await Promise.all(
    Array.from(ids).map(id =>
      fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json())
    )
  );

  return respuestas.map(p => ({
    nombre: p.name,
    imagen: p.sprites.front_default
  }));
}

function iniciarTemporizador() {
  clearInterval(intervalo);
  tiempoRestante = segundosPorTurno;
  document.getElementById('tiempo').textContent = tiempoRestante;

  intervalo = setInterval(() => {
    tiempoRestante--;
    document.getElementById('tiempo').textContent = tiempoRestante;
    if (tiempoRestante <= 0) {
      clearInterval(intervalo);
      cambiarTurno();
    }
  }, 1000);
}

function cambiarTurno() {
  turnoJugador = turnoJugador === 1 ? 2 : 1;
  document.getElementById('temporizador').innerHTML =
    `Turno de Jugador ${turnoJugador} - Tiempo: <span id="tiempo">${segundosPorTurno}</span>s`;
  iniciarTemporizador();
}

function armarTablero(pokemones) {
  cartas = [];
  pokemones.forEach(p => {
    cartas.push({ ...p });
    cartas.push({ ...p });
  });

  cartas.sort(() => Math.random() - 0.5);

  const tablero = document.getElementById('tablero');
  tablero.innerHTML = '';

  cartas.forEach((pokemon, indice) => {
    const carta = document.createElement('div');
    carta.className = 'carta';
    carta.dataset.indice = indice;
    carta.addEventListener('click', () => girarCarta(carta));
    tablero.appendChild(carta);
  });
}

function girarCarta(carta) {
  if (bloqueo || carta.classList.contains('acertada') || carta === primeraCarta || carta.classList.contains('volteada')) return;

  const indice = carta.dataset.indice;
  const pokemon = cartas[indice];

  carta.style.backgroundImage = `url(${pokemon.imagen})`;
  carta.classList.add('volteada');
  carta.textContent = '';

  if (!primeraCarta) {
    primeraCarta = carta;
  } else if (!segundaCarta) {
    segundaCarta = carta;
    bloqueo = true;

    setTimeout(verificarCoincidencia, 800);
  }
}

function verificarCoincidencia() {
  const i1 = primeraCarta.dataset.indice;
  const i2 = segundaCarta.dataset.indice;

  if (cartas[i1].nombre === cartas[i2].nombre) {
    primeraCarta.classList.add('acertada');
    segundaCarta.classList.add('acertada');

    puntos[turnoJugador].push(cartas[i1].nombre);
    document.getElementById(`lista${turnoJugador}`).innerHTML =
      puntos[turnoJugador].map(n => `<li>${n}</li>`).join('');

    cantidadAcertadas += 2;

    if (cantidadAcertadas === cartas.length) {
      clearInterval(intervalo);
      setTimeout(() =>
        alert(`¡Fin del juego!\nJugador 1: ${puntos[1].length} parejas\nJugador 2: ${puntos[2].length} parejas`)
      , 200);
    }

    [primeraCarta, segundaCarta] = [null, null];
    bloqueo = false;
  } else {
    setTimeout(() => {
      [primeraCarta, segundaCarta].forEach(c => {
        c.classList.remove('volteada');
        c.style.backgroundImage = '';
        c.textContent = '';
      });
      [primeraCarta, segundaCarta] = [null, null];
      cambiarTurno();
      bloqueo = false;
    }, 500);
  }
}

(async function iniciarJuego() {
  const pokemones = await obtenerPokemonesAleatorios(cantidadParejas);
  armarTablero(pokemones);
  iniciarTemporizador();
})();
