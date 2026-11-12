# Un hogar para Hasta la Luna
## Elección informada

| Plataforma | Encaje con este juego | Decisión |
| --- | --- | --- |
| [itch.io](https://itch.io/docs/creators/html5) | Ejecución HTML5 en iframe, página de proyecto, diarios y distribución por Butler | Elegida: la carpeta actual de Phaser se publica sin convertirla a ejecutable. |
| [Game Jolt](https://gamejolt.com/help) | Herramientas de comunidad, publicaciones y vínculos entre juegos y comunidades | Buena alternativa si el foco pasa a ser la conversación y el fandom. |
| [Newgrounds](https://www.newgrounds.com/wiki/help-information/content-submission/games-and-movies) | Acepta HTML5 en ZIP y dispone de un portal de obras de creadores | Alternativa para el descubrimiento dentro de su portal. |

Fuentes primarias consultadas el 11 de noviembre de 2026: documentación de cada plataforma; [comunidades de Game Jolt](https://ssr.gamejolt.net/help-docs/start/communities), [primera página en itch.io](https://itch.io/docs/creators/getting-started), [instalación de Butler](https://itch.io/docs/butler/installing.html), [publicación con Butler](https://itch.io/docs/butler/pushing.html), [autenticación para CI](https://itch.io/docs/butler/login.html). Se revisó la acción propuesta por el taller: [josephbmanley/butler-publish-itchio-action](https://github.com/josephbmanley/butler-publish-itchio-action), que actualmente redirige a **yeslayla/butler-publish-itchio-action**. El flujo implementado usa Butler desde su distribución oficial, con el comando visible en el YAML.

## Estado
No hay cuenta ni página de itch.io creada o verificada en esta sesión. El titular confirmó que no tiene cuenta. No existen una URL de juego confirmada ni credenciales disponibles para publicar allí. La preparación del YAML y del paquete no equivale a publicación.

## Ficha lista para usar
**Estudio propuesto:** Órbita Cero. Es un nombre de trabajo, no una cuenta registrada ni una marca verificada. El nombre de usuario se elige según disponibilidad al registrarse.

**Bio:** Hacemos pequeños mundos para grandes promesas. Juegos de navegador donde observar, experimentar y volver a intentarlo es parte de la aventura.

**Título:** Hasta la Luna  
**Slug sugerido:** hasta-la-luna  
**Tipo:** HTML Game  
**Estado de desarrollo:** In development  
**Género:** Platformer  
**Idioma:** Español  
**Etiquetas sugeridas:** Pixel Art, Precision Platformer, Singleplayer, Space, Educational  
**Descripción corta:** La gravedad no entiende de promesas. Carga, apunta y cruza cinco zonas para reunirte con quien te espera en la Luna.

### Descripción del juego
Un cadete sin cohete debe convertir cada salto en una pequeña hipótesis para cruzar bosques y estaciones orbitales y reunirse con quien dejó una luz encendida en la Luna.

- Entrena con 25 saltos antes de equipar el traje espacial.
- Elige entre dos rutas de 120 ascensos, con mundos reproducibles por semilla.
- Encuentra aves, viajeros, fogatas y robots en escenarios originales de pixel art.
- Usa teclado o controles táctiles. Guarda el viaje en este navegador.
- Sin daño, combate ni checkpoints: una caída puede devolverte a zonas anteriores.

**Controles:** ← / → o A / D para dirección; mantener Espacio para cargar y soltar para saltar; Esc para pausa. En móvil, flechas y SALTAR.

**Accesibilidad:** sonido opcional, pausa, guardado local y movimiento reducido.  
**Contenido:** escenarios oscuros y tensión por caídas; sin sangre, apuestas o compras. La orientación de edad del equipo no es una clasificación oficial.  
**Créditos:** añadir los créditos de [CREDITS.md](../CREDITS.md), incluida la licencia MIT de Phaser y la procedencia de las ilustraciones asistidas por IA.

## Crear la cuenta y el borrador
1. [Registrar una cuenta gratuita](https://itch.io/register) bajo control del titular, con su correo y contraseña. Completar las verificaciones que pida itch.io.
2. Definir el nombre visible del estudio, por ejemplo Órbita Cero.
3. [Crear un proyecto](https://itch.io/game/new). Pegar la ficha anterior y elegir HTML Game.
4. Guardar como **Draft**. No inventar ni prometer un enlace público antes de confirmar el proyecto.
5. Usar capturas del bosque y de la estación orbital desde `mi-primer-juego/assets/readme/`. Preparar una portada según las proporciones que pida el formulario.
6. Elegir controles móviles, pantalla completa y arranque por clic según la vista previa. Comprobar la presentación antes de hacer pública la ficha.

## Activar la publicacion automatica
En GitHub → repositorio → Settings → Secrets and variables → Actions:

| Tipo | Nombre | Valor |
| --- | --- | --- |
| Variable | ITCHIO_USER | Usuario real de la cuenta, en minúsculas |
| Variable | ITCHIO_GAME | Slug real del proyecto, por ejemplo hasta-la-luna |
| Secret | BUTLER_API_KEY | Clave de publicación de la cuenta itch.io; nunca se pega en código, issues, commits o chat |

Obtener la clave siguiendo [la guía de autenticación de Butler](https://itch.io/docs/butler/login.html) y la [página de API keys](https://itch.io/user/settings/api-keys). Configurarla directamente en GitHub; no enviarla a esta conversación.

Después:
1. Ejecutar Verify CIMA para main si el commit actual todavía no tiene una verificación correcta.
2. El éxito inicia Publish itch.io automáticamente. También puede ejecutarse manualmente para main; el workflow verifica antes el resultado de Verify CIMA para ese commit.
3. Revisar el artefacto `hasta-la-luna-html5` y el paso de Butler.
4. Tras el primer push, abrir Edit game en itch.io y marcar el archivo/canal `html5` como **This file will be played in the browser**. El nombre del canal por sí solo no activa esa opción.
5. Probar juego y guardado en el iframe; después cambiar Draft a Public cuando el titular quiera abrir la ficha.
6. Sustituir el estado pendiente de la landing y de la entrega por la URL que realmente devuelva itch.io.

La verificación del modelo y del navegador es obligatoria antes de publicar. El uso de una clave válida y las opciones del iframe solo pueden verificarse con la cuenta real.

## Comunidad
Usar el diario de desarrollo para publicar cambios verificables y las semillas para compartir desafíos. Regla: comentar decisiones y estrategias sin insultos, datos personales o presión por récords. Si se habilitan comentarios en itch.io, moderarlos desde la cuenta del estudio; el juego no incorpora chat ni recoge datos de participantes.
