# Elite Form

## 0. ROL Y CONTEXTO OBLIGATORIO

Actúa como un Arquitecto de Software Senior especializado en PWAs vanilla JavaScript (sin frameworks, sin build step) y en diseño UI/UX de alto rendimiento, con foco particular en **compatibilidad y ergonomía en Android** (navegador y modo PWA instalada). Vas a intervenir la base de código existente de **"Corazón de Élite"**, una PWA local-first de entrenamiento, objetivos, máximos, planificación y calendario, construida como un único archivo `index.html` con un objeto global `NG` que centraliza estado, renderizado y lógica (patrón de módulo IIFE, sin dependencias externas salvo Web Audio API nativa).

Antes de escribir una sola línea de código, **lee y comprende íntegramente la estructura actual**: el objeto `NG.state`, el objeto `DEFAULT_USER`, el sistema de persistencia (`NG.storage.load/merge/save` sobre `localStorage` con la clave `ng_user_v2`), el router de vistas (`NG.go`, `NG.renderByView`), los módulos de dominio (`NG.profile`, `NG.calculators`, `NG.routines`, `NG.plans`, `NG.calendar`, `NG.focus`, `NG.render`, `NG.logic`, `NG.audio`, `NG.format`, `NG.fatigue`, `NG.backup`, `NG.pwa`, `NG.ui`), y las variables CSS definidas en `:root`.

### REGLA DE CERO REGRESIONES (innegociable)

1. **No debes romper, eliminar, renombrar sin migración, ni degradar ninguna funcionalidad existente.** Esto incluye, sin limitarse a: onboarding inicial, gestión de perfil y biometría, gestión de deportes/disciplinas custom, calculadoras de 1RM y tiempo máximo, CRUD completo de rutinas, CRUD completo de ciclos/planificación, calendario en vistas mes/semana/día con detalle de día, el motor de ejecución (`NG.focus`), el sistema de reanudación de entrenamiento interrumpido (`activeWorkoutState`), el sistema de audio sintetizado, exportación/importación de backup, modo batería, y toggle de música.
2. **Toda migración de datos debe ser retrocompatible**, siguiendo el mismo patrón ya usado por `NG.storage.merge()` y sus funciones auxiliares (`NG.logic.maximaFromOldMetrics`, `NG.logic.planFromOld`, `NG.logic.normalizeRoutine`): valores por defecto seguros y una función `normalize*` que rellene cualquier campo nuevo si no existe en datos guardados previamente. Un usuario con datos guardados en una versión anterior debe poder abrir la nueva versión sin perder ni un solo registro y sin errores en consola.
3. Antes de dar por completada la tarea, valida mentalmente (o mediante pruebas) que estos flujos siguen intactos de punta a punta: crear/editar una rutina, iniciar y completar un entrenamiento, pausar y salir a mitad de un entrenamiento y volver a entrar a otro, guardar y recuperar un progreso incompleto, registrar un máximo y verlo reflejado en Progreso, crear un ciclo y verlo en el calendario, exportar e importar el backup JSON **específicamente en un navegador Android y en la PWA instalada en Android**.
4. Si una funcionalidad nueva exige modificar una función existente, **extiéndela o envuélvela, no la reescribas desde cero** salvo que sea estrictamente necesario. Documenta con comentarios `// [V2.9]` cada bloque nuevo o modificado para que el diff sea auditable.

---

## 1. CORRECCIÓN CRÍTICA: EXPORTAR/IMPORTAR DATOS EN ANDROID

**Diagnóstico del problema actual:** `NG.backup.export()` genera el archivo usando un URI `data:application/json;charset=utf-8,...` asignado como `href` de un `<a download>` sintético, y lo dispara con `.click()`. Este patrón es notoriamente poco fiable en navegadores Android (Chrome Android y, sobre todo, dentro del `WebView` de una PWA instalada vía `manifest.json`): muchas veces el navegador no reconoce la intención de descarga y no ofrece ningún diálogo, tal como reporta el usuario. Debes corregir esto de raíz:

- **Reemplaza el URI `data:` por un `Blob` + `URL.createObjectURL()`.** Construye el archivo con `new Blob([dataStr], { type: 'application/json' })`, genera la URL con `URL.createObjectURL(blob)`, asígnala al `href` del ancla temporal, dispara el click, y **libera la URL** con `URL.revokeObjectURL()` después de un `setTimeout` breve. Este patrón es sustancialmente más compatible con Android que el URI `data:`.
- **Añade como mecanismo primario en móviles la Web Share API con archivos**, que es la forma más confiable de "exportar" en Android (abre la hoja nativa de compartir/guardar del sistema, permitiendo guardar en Drive, enviar por WhatsApp, etc.): si `navigator.canShare && navigator.canShare({ files: [file] })` es verdadero, construye un `File` a partir del `Blob` y llama a `navigator.share({ files: [file], title: 'Respaldo Corazón de Élite', text: 'Backup de datos' })`. Si la Web Share API con archivos no está disponible, haz *fallback* al método de descarga por `Blob`/ancla descrito arriba.
- Envuelve toda la lógica en un único `try/catch` robusto que nunca deje al usuario sin feedback: si ambos mecanismos fallan, muestra un `NG.toast()` claro indicando el problema, nunca falles en silencio.
- **Revisa el `<input type="file">` de importación** (actualmente `#import-file-input`, disparado por `trigger-import`): asegúrate de que su atributo `accept` incluya tanto el MIME type como la extensión (`accept="application/json,.json"`), ya que algunos selectores de archivos de Android solo respetan uno de los dos criterios y de lo contrario el archivo `.json` puede aparecer atenuado/no seleccionable en la lista de "Documentos" o "Descargas" del sistema.
- Prueba explícitamente el ciclo completo exportar → guardar en el sistema de archivos de Android (o compartir) → importar ese mismo archivo, tanto en el navegador como en la PWA instalada (modo standalone), y confirma que `NG.storage.merge()` sigue aceptando el JSON exportado sin cambios adicionales de formato.

---

## 2. LOGO: GATO MUSCULOSO MORADO Y ROSADO

El logo actual es un SVG inline de un gato sentado con degradado blanco→rosa pastel (`<div class="cat-logo logo-image">`, definido dos veces en el código: en la pantalla de menú, alrededor de la sección `#s-menu`, y en la pantalla de inicio, dentro de `#s-home`; en ambos casos con el mismo `<svg viewBox="0 0 200 200">` y clase `.logo-cat-img`).

- **Rediseña este SVG inline** para representar un **gato musculoso** (postura erguida o de flexión, hombros/brazos marcados, silueta más atlética que la actual figura sentada) manteniendo el mismo `viewBox="0 0 200 200"` y las mismas dimensiones/posición dentro de `.cat-logo`/`.logo-image` para no romper el layout circundante (`.logo-heart`, animaciones `logo-breathe`, `heart-float`).
- **Cambia el degradado de relleno** del cuerpo (actualmente `linearGradient` de blanco a rosa pastel `#ffd5f7`) por un degradado **morado a rosado** (usa los tonos ya definidos en `:root`: `--violet` (`#a855ff`) o `--purple` (`#6426ff`) como inicio del degradado, y `--pink` (`#ff39ce`) o `--hot` (`#ff3b8d`) como fin), conservando el trazo (`stroke`) en `--pink` para mantener el borde de neón ya existente.
- Aplica el mismo rediseño en **ambas instancias** del logo (menú y pantalla de inicio) para que sean idénticas, tal como lo son hoy.
- Mantén el SVG **inline y vectorial** (no reemplaces por una imagen rasterizada externa): esto preserva el patrón actual del proyecto de no depender de assets binarios adicionales, y permite que el logo siga escalando nítido en cualquier densidad de pantalla.
- Si tienes capacidad de generar/actualizar también los íconos de la PWA (`./icons/icon-512.png`, referenciados en `manifest.json` y en `<link rel="icon">`), aplica la misma dirección de arte (gato musculoso morado-rosado sobre fondo oscuro) para mantener consistencia entre el ícono de instalación y el logo dentro de la app; si no puedes generar binarios, dejá al menos preparado el SVG para que pueda exportarse a PNG posteriormente.

---

## 3. TÍTULO "INICIO": REPOSICIONAMIENTO Y ESTILO

Actualmente la pantalla de inicio (`#s-home`) usa el mismo componente `.page-head` (con `<h2>Inicio</h2>` seguido de un `<p>` de subtítulo) que comparten todas las demás pantallas internas (Crear, Objetivos, Progreso, Calculadoras, etc.). **No modifiques la clase `.page-head` global** — eso afectaría a todas las demás pantallas y violaría la Regla de Cero Regresiones. En su lugar:

- Crea un tratamiento visual **específico y exclusivo** para el encabezado de `#s-home` (por ejemplo, una clase adicional `.page-head.home-title` o un selector anidado `#s-home .page-head`), sin tocar el estilo base de `.page-head` usado por el resto de las pantallas.
- Reposiciona este título para que quede **centrado horizontalmente en la parte superior de la pantalla** de inicio (puede lograrse con `text-align: center` y `justify-items: center` en el contenedor, sin necesidad de convertirlo en un elemento `position: fixed` que se superponga a `.top-controls`).
- El texto debe decir **únicamente "Inicio"**, sin el subtítulo descriptivo que existe hoy ("Elige una zona de trabajo."). Si ese texto de ayuda se considera útil, muévelo a otro lugar (por ejemplo, como `aria-label`/`title` no visual, o elimínalo, ya que la app debe priorizar limpieza visual).
- Dale colores llamativos coherentes con la temática cyberpunk/retrowave ya existente: reutiliza el mismo `text-shadow` de neón que usa `.page-head h2` (`var(--glow-pink)`) o combínalo con un degradado de texto (`background: linear-gradient(...)` + `background-clip: text`) usando `--pink`/`--violet`/`--cyan`, consistente con el resto de la identidad visual.

---

## 4. MÓDULO DE CREACIÓN DE RUTINAS — TIPOS DE CARGA (reemplaza el diseño de "entrada dual" de la versión anterior)

Esta sección **reemplaza** la propuesta anterior de campos separados "Peso (kg)" + "Tiempo (TUT)" fijos. El diseño correcto es el siguiente, más flexible:

**Elimina el campo genérico "Valor carga"** (`#ex-load-value`, con su etiqueta actual `<label for="ex-load-value">Valor carga</label>`). En su lugar:

1. Mantén (o crea si no existe de forma independiente) una **casilla persistente "Peso (kg)"**, siempre visible en el formulario de ejercicio, opcional, de entrada manual directa — esta es la casilla de peso "que ya existe" a la que no hay que duplicar.
2. Reemplaza el único selector `#ex-load-type` por **dos selectores independientes de "Tipo de carga"** (Tipo de carga 1 y Tipo de carga 2), cada uno con las mismas opciones actuales (`% del 1RM`, `Peso absoluto`, `TUT (seg)`, `% del tiempo máximo`, `Peso corporal`) más una opción `Ninguno` por defecto en el segundo selector, de modo que ambos sean combinables libremente. Esto permite, por ejemplo, combinar `TUT (seg)` en el primer selector con `Peso absoluto` en el segundo para un ejercicio como "Correr", indicando que se ejecuta durante X segundos con X kilos de carga adicional.
3. Cada selector debe desplegar dinámicamente, **justo debajo o al lado suyo**, una casilla numérica **con la etiqueta correspondiente al tipo elegido** en vez del genérico "Valor carga":
   - `% del 1RM` → casilla con etiqueta "% del 1RM" (número entre 0 y 100+).
   - `Peso absoluto` → **no despliega ninguna casilla nueva**; este tipo simplemente indica que la carga de ese slot se toma directamente de la casilla persistente "Peso (kg)" descrita en el punto 1.
   - `TUT (seg)` → casilla con etiqueta "Segundos (TUT)" para ingresar la duración directamente.
   - `% del tiempo máximo` → casilla con etiqueta "% del tiempo máximo".
   - `Peso corporal` → **no despliega ninguna casilla**; en su lugar, muestra automáticamente (de solo lectura, junto al selector) el peso corporal ya guardado en `NG.state.user.profile.weight`, tomándolo directamente del perfil sin que el usuario deba reingresarlo. Si el perfil no tiene peso cargado, muestra un aviso breve invitando a completarlo en Perfil.
4. Vincula el evento `change` de ambos selectores (extiende el listener de `document.addEventListener('change', ...)` ya existente, que hoy maneja `#ex-load-type`) para mostrar/ocultar dinámicamente las casillas correspondientes sin recargar el formulario.

**Modelo de datos:** en el objeto de cada ejercicio, sustituye los campos planos `loadType`/`loadValue` por `weightKg` (número u opcional, la casilla persistente de peso) y `loadTypes: [{ type, value }, { type, value }]` (array de hasta dos entradas; `type` puede ser `null`/`'none'` para el segundo slot si no se usa). En `NG.logic.normalizeRoutine()`, **migra automáticamente** cualquier ejercicio guardado en el formato anterior (`loadType`/`loadValue` planos) a `loadTypes: [{ type: loadType, value: loadValue }, { type: null, value: 0 }]` más `weightKg: (loadType === 'absolute_kg' ? loadValue : 0)`, para no perder ni un ejercicio ya guardado.

**Motor de ejecución:** en `NG.focus.render()` (donde hoy se calcula `calcLabel` combinando `ex.loadType`/`ex.loadValue` contra los máximos guardados vía `NG.logic.findMaximumValue`), recorre ahora el array `loadTypes` de hasta dos entradas y compón una descripción combinada legible (por ejemplo: "40s con 5 kg", u "80 kg (80% de tu 1RM de 100 kg)" si solo hay un tipo activo), integrando también el valor de `weightKg` cuando corresponda. Mantén el mismo mecanismo ya usado para `percent_1rm`/`percent_time` contra `NG.logic.findMaximumValue`.

---

## 5. MOTOR DE EJECUCIÓN (MODO ENFOQUE): CONTROLES Y AUTO-GUARDADO

### 5.1 Botones inferiores del modo enfoque

Hoy `.focus-controls` tiene tres controles: `#focus-primary` ("Completar fase"), `#focus-toggle` ("Pausar"/"Reanudar") y un botón "Saltar" (`data-action="skip-focus-phase"`, que llama a `NG.focus.skipPhase()` → `this.autoAdvance()`, es decir, salta solo la fase actual del temporizador). Debes:

- **Renombrar "Saltar" a "Saltar ejercicio"** y cambiar su comportamiento: en vez de invocar `autoAdvance()` (que solo avanza la fase de temporizador actual), debe avanzar directamente al **siguiente ejercicio** en la secuencia de ejecución (el siguiente paso dentro de `routine.blocks`, respetando el modelo de bloques/circuitos). **Importante:** si el ejercicio actual pertenece a un circuito, "Saltar ejercicio" debe avanzar únicamente al siguiente ejercicio dentro de ese mismo circuito (o a la siguiente ronda si era el último ejercicio de la ronda), **nunca** saltar el circuito completo ni pasar directamente al bloque siguiente salvo que efectivamente ya no queden ejercicios ni rondas pendientes en el circuito actual.
- **Agrega un botón "Regresar"**, que retrocede exactamente un paso en la misma secuencia de ejecución (a la serie o fase inmediatamente anterior), permitiendo corregir un avance accidental. Implementa esto manteniendo una pequeña pila de historial de pasos en el estado del foco (por ejemplo `NG.state.focus.stepHistory`, un array donde cada transición de fase relevante empuja un snapshot mínimo — fase, índice de ejercicio, serie completada — antes de aplicarse), de modo que "Regresar" simplemente haga `pop()` de esa pila y restaure el snapshot anterior, reutilizando `setPhase()`/`render()` para reflejarlo visualmente.
- **Agrega un botón "Rutina"**, que abre una vista/modal (reutiliza el patrón de overlay ya usado por `#exit-modal`/`#calendar-day-modal`: `<section class="overlay" hidden>`) mostrando la totalidad de la rutina actual como lista — todos los bloques/circuitos y ejercicios en orden, marcando visualmente cuáles ya se completaron (reutiliza la lógica de `f.completedSets` y el patrón visual de `#focus-dots`) — **sin salir del entrenamiento activo**. Al cerrar este modal, el usuario debe volver exactamente al mismo punto de ejecución en el que estaba, sin perder el temporizador ni el estado de pausa.
- Con cinco controles en total (Completar fase, Pausar, Saltar ejercicio, Regresar, Rutina), reorganiza `.focus-controls` para mantener la limpieza visual exigida: conserva `#focus-primary` como la acción principal, de ancho completo y máxima jerarquía visual, y agrupa las cuatro acciones secundarias (Pausar, Saltar ejercicio, Regresar, Rutina) en una fila de botones `ghost` más compactos (ícono + texto corto, o solo ícono con `title` accesible) debajo, evitando que la pantalla de ejecución se sienta saturada.

### 5.2 Auto-guardado al cambiar de aplicación (segundo plano/recarga)

Actualmente el sistema de recuperación (`NG.state.user.activeWorkoutState`, mostrado al reingresar vía `NG.focus.checkActiveWorkoutState()`) solo se llena cuando el usuario elige explícitamente "Guardar progreso" en `#exit-modal` (función `NG.focus.finish(true)`), lo que además cierra el modo enfoque y agrega una entrada al historial. Esto no cubre el caso de que Android descargue/recargue la PWA al cambiar de app.

- Extrae la construcción del snapshot de `activeWorkoutState` (el objeto `{ routine, phase, seconds, duration, exerciseIndex, completedSets }` que hoy se arma dentro de `finish()`) a una función reutilizable, por ejemplo `NG.focus.buildSnapshot()`.
- Añade un listener a `document.addEventListener('visibilitychange', ...)` y también a `window.addEventListener('pagehide', ...)`: cuando `document.visibilityState === 'hidden'` (o se dispare `pagehide`) **y** `NG.state.focus.active` sea verdadero, guarda silenciosamente el snapshot actual en `NG.state.user.activeWorkoutState` y llama a `NG.storage.save()` — **sin** invocar `finish()`, sin agregar entrada al historial, sin ocultar `#focus-mode` ni alterar el estado `active`/`paused` en memoria (esto es solo una copia de seguridad por si el proceso muere).
- Como red de seguridad adicional (algunos `WebView` de Android no disparan estos eventos de forma confiable antes de ser eliminados por el sistema), guarda también este snapshot de forma periódica (por ejemplo, cada vez que transcurre una fase, o cada 10-15 segundos mientras `NG.state.focus.active` sea verdadero) reutilizando el mismo `buildSnapshot()`.
- Al recargar la app (`NG.init()` → `checkActiveWorkoutState()`, ya invocado al entrar a la vista `entrenar`), el flujo existente de "Reanudar"/"Descartar" (`#resume-workout-modal`) debe funcionar sin cambios adicionales para este nuevo caso, ya que reutiliza el mismo campo `activeWorkoutState`.
- Si el entrenamiento finaliza normalmente (`finish(false)`) o se descarta explícitamente (`discard()`), asegúrate de que `activeWorkoutState` se limpie (`= null`) para que este auto-guardado periódico no reviva una sesión ya cerrada.

### 5.3 Ajuste global de intensidad desde el porcentaje de disponibilidad

El botón "%" visible únicamente en la sección Entrenar (`#availability-btn`, visible solo cuando `NG.state.view === 'entrenar'`, que abre `NG.fatigue.open()`) calcula hoy un valor `NG.state.readiness.intensity` (por ejemplo, 65) tras responder el cuestionario de sueño/dolor/carga laboral (y fase menstrual si corresponde), mostrado en `#fatigue-result`.

- Tras calcular el resultado en `NG.fatigue.calculate()`, agrega dentro de `#fatigue-result` un selector de rutina (poblado igual que `#day-routine-picker`, con `NG.state.user.routines`) y un botón "Comenzar con este %".
- Al presionar ese botón, debe iniciarse el entrenamiento de la rutina seleccionada (reutilizando `NG.focus.start()`, extendido para aceptar un segundo parámetro de opciones, por ejemplo `NG.focus.start(routine, { intensityOverride: NG.state.readiness.intensity })`), guardando ese porcentaje en el estado del foco (`NG.state.focus.intensityOverride`, persistido también en el snapshot de `activeWorkoutState` para que sobreviva a una reanudación).
- En `NG.focus.render()`, cuando exista un `intensityOverride` activo, **todo cálculo de carga debe escalarse por ese porcentaje**: tanto el peso absoluto (`weightKg`) como el resultado de aplicar `% del 1RM`/`% del tiempo máximo` contra los máximos guardados deben multiplicarse adicionalmente por `intensityOverride / 100` antes de mostrarse. Ejemplo concreto pedido: si el usuario tenía un máximo de 100 kg en un ejercicio y el resultado de disponibilidad fue 65%, la app debe mostrarle 65 kg para ese ejercicio (y proporcionalmente para el resto de los ejercicios de la rutina), sin que el usuario deba recalcular nada manualmente.
- Muestra de forma visible durante todo el entrenamiento (por ejemplo, en `#focus-meta`) que existe un ajuste de intensidad activo y su porcentaje, para que el usuario no lo olvide a mitad de la sesión.

---

## 6. MÉTRICAS, RÉCORDS Y GRÁFICOS

### 6.1 Historial de valores (base de datos para los gráficos)

El modelo actual de récords (`NG.state.user.maxima`, cada uno `{ id, name, kind, value, updatedAt }`) solo guarda el valor vigente, sobrescrito en cada `NG.logic.upsertMaximum()` o edición manual en `NG.render.maxima()`. Añade un array `history: [{ value, date }]` dentro de cada registro, donde cada actualización **agregue** una entrada nueva en vez de solo sobrescribir `value`. En la función de normalización de `maxima` dentro de `NG.storage.merge()` (créala si no existe, análoga a `normalizeRoutine`), si un registro cargado no tiene `history`, créalo retroactivamente con una entrada usando el `value`/`updatedAt` existentes.

### 6.2 Gráfico como botón dentro de cada ejercicio (reemplaza el diseño anterior de gráfico siempre visible)

En `NG.render.maxima()`, la tabla actual (`#max-table`) muestra por cada récord: nombre, tipo, valor editable, columnas de porcentaje (10/50/75/90/100%) y acciones "Guardar"/"Borrar". **No muestres el gráfico siempre expandido**: agrega, junto a los botones "Guardar"/"Borrar" de cada fila, un tercer botón **"Ver gráfico"**. Al presionarlo, despliega (dentro de la misma fila, expandiéndola, o en un modal reutilizando el patrón `.overlay`) un gráfico de línea construido con **Chart.js** (cárgalo vía CDN solo cuando se necesite, para no penalizar el arranque general de la app) usando el `history` de ese récord específico: eje X = fechas, eje Y = valor, formateado con `NG.format.seconds()`/`NG.format.maxValue()` según el `kind` del récord. Un segundo click en el mismo botón (o un botón "Cerrar gráfico") debe colapsar/ocultar el gráfico nuevamente. Estiliza el gráfico coherente con la paleta cyberpunk (línea en `--pink`/`--cyan`, grid en `--line`, texto en `--muted`/`--white`, fondo transparente).

### 6.3 Lógica de reducción (mejora = bajar el número)

Añade un campo opcional `improvementDirection: 'lower' | 'higher'` al modelo de `maxima` (seleccionable por el usuario al crear el récord, útil para pruebas de velocidad/sprints tipo "100 metros lisos"). El gráfico y cualquier indicador de "mejor marca" deben interpretar, para `improvementDirection: 'lower'`, que una **disminución** del valor es una mejora (el mínimo del `history` es el mejor registro, no el máximo), reflejándolo también en el color/indicador visual de tendencia dentro del gráfico.

### 6.4 Renombrar sección "Progreso" a "Progreso de Objetivo"

Cambia únicamente el **texto visible** de esta sección — el botón en la pantalla de inicio (`<span class="module-title">Progreso</span>` dentro del bloque `data-go="progreso"`) y el encabezado `<h2>Progreso</h2>` dentro de `#s-progreso` — a **"Progreso de Objetivo"**. **No cambies** el identificador de vista interno (`data-go="progreso"`, `id="s-progreso"`, las funciones `NG.render.progress()`/`renderByView`), para no romper el enrutamiento ni ninguna referencia interna existente.

---

## 7. NUEVA SECCIÓN "LOGROS" EN LA PANTALLA DE INICIO

Agrega, dentro de `#s-home` (por ejemplo como un nuevo bloque al inicio de `.module-column`, antes o junto al bloque "I. Entrenamiento y Sesiones"), una sección **"Logros"** basada en racha de entrenamientos consecutivos.

- **Cálculo de racha:** implementa una función, por ejemplo `NG.logic.currentStreak()`, que recorra `NG.state.user.history` (cada entrada ya tiene `date` e `incomplete`) y calcule cuántos días **consecutivos** (sin huecos) tienen al menos una sesión con `incomplete: false`, contando hacia atrás desde hoy o desde el último día entrenado. Si se rompe la secuencia (un día sin entrenamiento completado), la racha vuelve a 0 desde ese punto.
- **Persistencia de hitos ya mostrados:** guarda en `NG.state.user` un objeto nuevo, por ejemplo `achievements: { currentStreak, bestStreak, lastTrainedDate, milestonesShown: { bronze: false, silver: false, gold: false } }`, actualizado cada vez que se recalcula la racha (por ejemplo, al completar un entrenamiento en `NG.focus.finish(false)`, y también al abrir la app). Usa `milestonesShown` para no repetir la animación de medalla cada vez que se abre la app, solo la primera vez que se alcanza cada hito (10, 30, 100 días); si la racha se rompe y luego se vuelve a alcanzar el mismo hito, debe poder mostrarse de nuevo (resetea el flag correspondiente cuando la racha vuelve a 0).
- **Medallas por hito:** al alcanzar 10 días consecutivos, muestra una medalla de **bronce**; a los 30 días, una medalla de **plata**; a los 100 días, una medalla de **oro**. Cada hito, al mostrarse por primera vez (idealmente al iniciar la app, vía `NG.init()`/`NG.go('home')`, verificando si corresponde mostrar un hito pendiente), debe disparar:
  - Confeti, reutilizando `NG.ui.confetti()` ya existente.
  - Una canción de victoria sintetizada con Web Audio API, siguiendo el mismo enfoque ya usado en `NG.audio.fanfare()` (secuencia de osciladores con envolventes de ganancia). Crea tres variantes progresivas reutilizando ese mismo patrón: `fanfareBronze()` (breve, sencilla), `fanfareSilver()` (un poco más larga/vistosa) y `fanfareGold()` (la más elaborada, "fuerte" y triunfal — más voces/oscilador simultáneos, secuencia más larga), todas construidas sobre el mismo mecanismo de `ctx.createOscillator()`/`ctx.createGain()` ya presente en el módulo `NG.audio`, no un sistema de audio nuevo.
  - Una tarjeta/medalla visual (reutiliza el patrón de `.modal-card`/overlay) anunciando el logro alcanzado.
- **Indicador de racha activa ("fuego"):** mientras `currentStreak >= 1`, la sección "Logros" en la pantalla de inicio debe mostrar un efecto visual de fuego alrededor de su contenedor (por ejemplo, un `box-shadow`/`filter` animado en tonos `--hot`/`--yellow`/`--red` con una animación CSS de parpadeo/pulso, o partículas simples tipo las ya usadas en `.meteor-item`), que desaparece inmediatamente si la racha vuelve a 0.
- El bloque "Logros" debe mostrar en todo momento, de forma compacta, el número de días de racha actual y (opcionalmente) la mejor racha histórica (`bestStreak`).

---

## 8. CALENDARIO: DÍA DE MENSTRUACIÓN EN ROJO

Hoy, `NG.logic.dayInfo()` ya distingue la fase menstrual con un tag de kind `'menstrual-fire'` (estilizado en CSS con `.tag.menstrual-fire`, con fondo/glow rojo-naranja), pero es solo una pequeña etiqueta dentro de la celda del día — no la celda completa. Debes hacer que **la celda entera del día se vea claramente roja**, al mismo nivel de prominencia que la celda "hoy" (`.day-cell.today`, que hoy usa borde y glow cian):

- En `NG.render.createCalendarCell()` (y en el bloque equivalente de la vista "día" dentro de `NG.render.calendar()`), cuando `NG.state.user.profile.sex === 'female'` y `NG.logic.menstrualPhase(date) === 'Menstrual'`, añade una clase adicional a la celda, por ejemplo `cell.classList.add('menstrual')`.
- Define en CSS `.day-cell.menstrual` con un tratamiento visual rojo prominente, análogo en fuerza visual a `.day-cell.today` (por ejemplo `border-color: var(--red)`, `box-shadow: var(--glow-red)`, fondo `rgba(255, 47, 85, 0.10)`), de modo que sea identificable de un vistazo al navegar el mes/semana, sin depender de leer la pequeña etiqueta de texto.
- Conserva el tag `menstrual-fire` existente dentro de la celda (no lo elimines), ya que sigue aportando el detalle textual de la fase.
- Si el día es simultáneamente "hoy" y "menstrual", decide una combinación visual coherente (por ejemplo, un borde combinado o priorizando el rojo con un acento cian menor) en vez de que ambos estilos compitan de forma confusa.

---

## 9. RENDIMIENTO, ESTABILIDAD Y OPTIMIZACIÓN GENERAL

Aplica estos criterios de forma transversal a **todo** lo implementado en este documento, no como una sección aislada:

- Evita renders completos (`innerHTML = ''` + reconstrucción total) en bucles de alta frecuencia como el temporizador de `NG.focus.startTimer()` (cada segundo); actualiza solo los nodos de texto/estilo que efectivamente cambian en cada tick, en vez de reconstruir el DOM del modo enfoque entero cada segundo.
- Los nuevos listeners (`visibilitychange`, `pagehide`, los de los selectores dobles de tipo de carga, los de los nuevos botones del modo enfoque) deben registrarse una sola vez (en `bind()` o equivalente), nunca dentro de una función de render que se ejecute repetidamente, para evitar fugas de memoria por listeners duplicados.
- Cualquier intervalo/temporizador nuevo (por ejemplo, el auto-guardado periódico de la sección 5.2) debe limpiarse correctamente (`clearInterval`/`clearTimeout`) cuando el entrenamiento termina, se descarta, o el usuario navega fuera del modo enfoque, siguiendo el mismo cuidado que ya aplica `NG.focus.stopTimer()`.
- Carga Chart.js de forma diferida (solo cuando se abre por primera vez un gráfico en la tabla de máximos), no en el arranque global de la app.
- Verifica que las animaciones nuevas (fuego de racha, medallas, degradados de texto del título "Inicio") respeten el modo batería ya existente (`body.battery-mode`, que ya desactiva animaciones vía `animation: none !important`), para que un usuario con ese modo activado no vea ninguna de estas animaciones nuevas tampoco.
- El resultado final debe sentirse igual de fluido en un dispositivo Android de gama media que la versión actual: nada de lo agregado debe introducir jank perceptible, layout thrashing, ni recálculos de estilo innecesarios en bucles de temporizador.

---

## 10. CHECKLIST DE ACEPTACIÓN Y ÉXITO DE COMPILACIÓN

Antes de dar por terminada la tarea, confirma explícitamente lo siguiente:

1. La app compila y carga sin errores en consola, incluyendo el registro del Service Worker.
2. Un usuario con datos previos en `localStorage` (sin `loadTypes`, sin `history` en `maxima`, sin `achievements`) abre la app y ve todos sus datos migrados automáticamente sin pérdida.
3. Exportar e importar datos funciona de punta a punta en un navegador Android real y en la PWA instalada en Android (no solo en desktop).
4. Todos los flujos listados en la Regla de Cero Regresiones (sección 0, punto 3) funcionan sin errores.
5. En el formulario de creación de rutina, el campo "Valor carga" ya no existe; los dos selectores de "Tipo de carga" despliegan/ocultan casillas dinámicamente según lo especificado, y "Peso corporal" se autocompleta desde el perfil.
6. En el modo enfoque aparecen los cinco controles correctos ("Completar fase", "Pausar/Reanudar", "Saltar ejercicio", "Regresar", "Rutina"), cada uno con el comportamiento descrito, sin saturar visualmente la pantalla.
7. Al cambiar de aplicación en Android durante un entrenamiento activo y volver a abrir la PWA, el entrenamiento se ofrece para reanudar sin pérdida de progreso.
8. El flujo de disponibilidad (%) permite seleccionar una rutina y arranca el entrenamiento con todas las cargas ajustadas proporcionalmente al porcentaje calculado.
9. El logo del gato es musculoso y usa degradado morado-rosado en ambas ubicaciones (menú e inicio).
10. El título "Inicio" está centrado arriba, dice solo "Inicio", y usa colores llamativos de la paleta existente.
11. La tabla de máximos muestra un botón "Ver gráfico" por fila (no gráficos siempre expandidos), y los récords de tipo "menor es mejor" invierten correctamente la lógica de "mejor marca".
12. La sección "Progreso" ahora se lee "Progreso de Objetivo" en toda la UI visible, sin romper el enrutamiento interno.
13. La sección "Logros" en Inicio calcula rachas correctamente, muestra medallas de bronce/plata/oro solo la primera vez que se alcanzan, con confeti y música de victoria progresivamente más elaborada, y un efecto de fuego mientras la racha esté activa, reseteándose a 0 si se rompe.
14. Los días de fase menstrual se ven como celdas completas en rojo en el calendario, no solo con una etiqueta pequeña.
15. La experiencia general se siente estable, fluida y optimizada, sin regresiones de rendimiento perceptibles respecto a la versión anterior.

Procede con la implementación completa siguiendo estrictamente todas las directrices anteriores.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/754ee738-5bd7-4e04-b250-767d1978feca).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
