# El Alma, el Escaparate y la Fábrica Automática
## Hasta la Luna · Evidencias del taller

[Landing](https://a-perfectstranger.github.io/arcos-eduardo-jueg-gr3/) · [Juego](https://a-perfectstranger.github.io/arcos-eduardo-jueg-gr3/mi-primer-juego/) · [Créditos](../CREDITS.md)

## Misión 1 · El alma
**Logline:** Un cadete sin cohete debe convertir cada salto en una pequeña hipótesis para cruzar bosques y estaciones orbitales y reunirse con quien dejó una luz encendida en la Luna.

**Hook:** La gravedad no entiende de promesas.

La meta emocional da sentido a la mecánica: aprender a leer distancias y controlar el impulso es lo que permite cumplir la promesa. El viaje no se detiene para imponer preguntas de memoria. Cada apoyo plantea un problema espacial y cada caída ofrece información para el siguiente intento.

### Aprendizaje y evidencias
La propuesta educativa trabaja estimación espacial, relaciones causa-efecto y pensamiento experimental. Son oportunidades de práctica, no una medición certificada de aprendizaje. La gravedad y las escalas están adaptadas a la jugabilidad; no se enseñan como constantes de un vuelo real.

| Acción observable | Aprendizaje propuesto | Evidencia en una sesión |
| --- | --- | --- |
| Estimar altura y distancia antes de cargar | Orientación espacial y anticipación | El jugador explica por qué elige una carga y una dirección. |
| Comparar carga parcial con carga completa | Relación entre impulso, altura y tiempo de vuelo | Predice cuál llega más alto y contrasta el resultado. |
| Repetir cambiando una variable | Formular y revisar una hipótesis | Mantiene el punto de despegue y cambia solo la carga. |
| Elegir una ruta y reconocer descansos | Planificación y lectura del entorno | Describe dos apoyos posibles y justifica una elección. |
| Detenerse cuando aparece frustración | Autorregulación | Usa la pausa y vuelve con un plan, sin penalización de tiempo. |

**Actividad de 15 minutos:** observar dos saltos, predecir tres resultados, probarlos y anotar «esperaba / ocurrió / cambiaría». Al final, explicar cómo cambió el plan. No se recolectan esos datos en línea ni se comparan notas entre jugadores.

## Misión 2 · Legal y ético
**Clasificación creativa:** «Para exploradores con paciencia y promesas de largo alcance. Gravedad insistente; violencia, ninguna.»

Orientación interna: público general, con ESRB E / PEGI 7 como referencias educativas. **Sin clasificación oficial ni uso de sellos oficiales.** Escenarios oscuros y caídas pueden generar tensión; no hay sangre, combate, apuestas, chat ni compras. Edad de contenido y dificultad motriz son asuntos distintos.

El [Muro de Honor](../index.html#honor) acredita motor, arte, sonido e inspiración. [CREDITS.md](../CREDITS.md) conserva la procedencia y separa MIT de los recursos propios. El proyecto usa sonido generado por Web Audio y arte propio; no presenta recursos ajenos como CC0.

Se respetan movimiento reducido, pausa, sonido opcional y controles de teclado/táctiles. El guardado es local. Se explica la intervención técnica de los proveedores de alojamiento y CDN, sin prometer privacidad absoluta.

## Misión 3 · El escaparate
La raíz contiene una landing de terminal espacial con narrativa, características, explicación educativa, capturas reales, controles, hogar indie, créditos y sección legal. El enlace **JUGAR** lleva a `./mi-primer-juego/`; no hay redirección automática.

Funciona sin JavaScript y sin fuentes, librerías o analítica externas. CSS adapta el contenido a móvil y respeta movimiento reducido. GitHub Pages conserva su configuración existente: **main / raíz**. Cada actualización de main inicia la publicación nativa.

## Misión 4 · Hogar indie
**Elegido: itch.io.** La [comparación y ficha preparada](ITCHIO.md) justifican la elección y contienen el texto del estudio y del juego.

**Estado real:** cuenta y página sin crear. El propietario confirmó que no tiene cuenta. La sesión no dispone de conexión a itch.io ni de un navegador operativo para realizar el registro y la verificación. No se inventa una URL ni se declara esta misión terminada.

## Misión legendaria · La fábrica
- [Verify CIMA](../.github/workflows/verify.yml) valida modelo, sintaxis, jugabilidad y landing en Chromium.
- GitHub Pages publica main desde la raíz; [Verify published CIMA](../.github/workflows/production.yml) compara hashes y prueba la landing y el juego publicados.
- [Publish itch.io](../.github/workflows/itchio.yml) se activa tras una verificación correcta de main, empaqueta el HTML5 y conserva un ZIP como artefacto. Publica con Butler cuando existen la cuenta, la ficha, las variables y el secret.
- El ZIP contiene `index.html` en la raíz, código, assets y créditos; no sube el repositorio, pruebas o claves.
- Sin configuración de itch.io, el workflow informa **publicación omitida**, conserva el paquete y no finge un despliegue.
- El flujo manual también espera la verificación correcta del commit de main.

La primera activación requiere crear el proyecto y marcar el canal como jugable en navegador. [Pasos](ITCHIO.md#activar-la-publicacion-automatica). No se garantiza publicación en dos minutos: depende de la cola, las pruebas, la instalación del navegador y el procesamiento de la plataforma.

## Entrega
El [mensaje preparado para Teams](ENTREGA_TEAMS.md) reúne enlaces y distingue lo publicado de lo pendiente. No se envía automáticamente a un canal.
