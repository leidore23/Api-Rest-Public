# Usuarios y publicaciones — JSONPlaceholder

Aplicación en React + TypeScript sobre la API pública
[JSONPlaceholder](https://jsonplaceholder.typicode.com): lista de usuarios con
búsqueda por nombre, publicaciones del usuario seleccionado y gestión completa
de ambas colecciones mediante formularios validados.

Prueba técnica de Frontend.

---

## Tabla de contenidos

- [Qué hace](#qué-hace)
- [Alcance](#alcance)
- [Cómo ejecutarlo](#cómo-ejecutarlo)
- [Scripts](#scripts)
- [Stack](#stack)
- [Estructura](#estructura)
- [Decisiones técnicas](#decisiones-técnicas)
- [Lo que descubrí de la API](#lo-que-descubrí-de-la-api)
- [Tests](#tests)
- [Accesibilidad](#accesibilidad)
- [Qué haría con más tiempo](#qué-haría-con-más-tiempo)
- [Cómo usé la IA](#cómo-usé-la-ia)
- [Tiempo invertido](#tiempo-invertido)

---

## Qué hace

**Usuarios**

- Listado de los diez usuarios de la API.
- Búsqueda por nombre, filtrada en cliente, insensible a mayúsculas y tildes.
- Crear, editar y borrar usuarios, con formulario validado.
- Borrado con confirmación en línea.

**Publicaciones**

- Publicaciones del usuario seleccionado.
- Crear, editar y borrar publicaciones, con formulario validado.
- Lo creado aparece al principio de la lista.

**Transversal**

- Estados de carga y de error visibles e independientes por sección: un fallo
  al cargar publicaciones no afecta a la lista de usuarios.
- Botón de reintentar en cada error.
- Los cambios locales sobreviven a recargar la página (`localStorage`).
- Tema claro y oscuro, que respeta la preferencia del sistema operativo.
- Diseño adaptable: una columna en móvil, dos a partir de 900 px.

---

## Alcance

El enunciado pedía: lista de usuarios con búsqueda, ver publicaciones del
usuario elegido, crear una publicación con formulario validado, estados de
carga y error, al menos tres tests y este README.

**Todo eso está.** Además se añadió, de forma deliberada:

- CRUD completo de publicaciones (editar y borrar, no sólo crear).
- CRUD completo de usuarios.
- Persistencia en `localStorage`.
- Tema claro y oscuro.

Lo señalo explícitamente para que quede claro que no es una mala lectura del
enunciado: es alcance añadido a conciencia, sabiendo que lo pedido era menos.

---

## Cómo ejecutarlo

**Requisitos**

- Node.js 20 o superior
- npm 10 o superior

**Instalación y arranque**

```bash
git clone https://github.com/leidore23/Api-Rest-Public.git
cd Api-Rest-Public
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173`.

**Tests**

```bash
npm test
```

**Build de producción**

```bash
npm run build
npm run preview
```

> Si durante el desarrollo la página aparece en blanco tras muchos cambios en
> caliente, reinicia `npm run dev`. Vite puede dejar la caché de HMR en un
> estado inconsistente cuando cambia la forma de los `export` de un módulo.

---

## Scripts

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Comprobación de tipos (`tsc -b`) y build de producción |
| `npm run preview` | Sirve localmente el build de producción |
| `npm test` | Ejecuta la suite de tests una vez |
| `npm run test:watch` | Tests en modo watch |
| `npm run lint` | Linter (oxlint) |

---

## Stack

| Pieza | Elección | Por qué |
| --- | --- | --- |
| Build | **Vite** | Arranque instantáneo y cero configuración para React + TS. |
| UI | **React 19** | Lo pedía el enunciado. |
| Tipos | **TypeScript** en modo `strict` | `strict` **no viene activado** en la plantilla de `create-vite`; sin él TypeScript no avisa de `null`/`undefined` ni de parámetros implícitamente `any`, que es justo lo que aporta usarlo. |
| Datos | **`fetch` + hook propio** | Ver [Decisiones técnicas](#decisiones-técnicas). |
| Estilos | **CSS Modules** | Alcance local sin configuración ni dependencias extra. |
| Tests | **Vitest + Testing Library + jsdom** | Vitest comparte configuración con Vite; Testing Library empuja a probar por rol accesible, no por detalle de implementación. |
| Linter | **oxlint** | Viene con la plantilla. |

**Dependencias de producción: sólo `react` y `react-dom`.** No hay librería de
estado, ni de datos, ni de formularios, ni de estilos. Cada ausencia es una
decisión, no un olvido, y está justificada abajo.

---

## Estructura

```
src/
  api/              Capa HTTP: cliente tipado y un módulo por recurso
    client.ts       Envoltorio sobre fetch + ApiError
    users.ts        fetch / create / update / delete de usuarios
    posts.ts        fetch / create / update / delete de publicaciones
  hooks/
    useAsync.ts     Estado de una operación asíncrona (carga/éxito/error)
    useUsers.ts     Usuarios + operaciones + persistencia
    usePosts.ts     Publicaciones + operaciones + persistencia
    useTheme.ts     Tema claro/oscuro
  lib/              Lógica pura, sin React
    filterUsersByName.ts
    validateUser.ts
    validatePost.ts
    createId.ts
  storage/          Persistencia en localStorage
    changesStorage.ts   Fábrica compartida por usuarios y publicaciones
    usersStorage.ts
    postsStorage.ts
    themeStorage.ts
  components/
    ui/             Piezas sin lógica (Spinner, ErrorMessage, EmptyState)
    SearchInput/    ThemeToggle/
    UserList/       UserItem con selección, editar y borrar
    UserForm/       Formulario de usuario (crear y editar)
    PostsPanel/     Publicaciones del usuario elegido
    PostList/       PostItem con editar y borrar
    PostForm/       Formulario de publicación (crear y editar)
  test/             Configuración de tests y datos de prueba
  types.ts          Modelo de dominio
```

La regla de organización: **la lógica pura vive en `lib/` y `storage/`**, fuera
de React. Eso permite probar el filtrado, la validación y el manejo de
almacenamiento corrupto sin renderizar nada ni simular pulsaciones.

---

## Decisiones técnicas

### Estado asíncrono como unión discriminada

```ts
type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }
```

Con el patrón habitual `{ isLoading, data, error }` son representables estados
que no existen —cargando y con error a la vez, o con datos y con error— y los
componentes acaban llenos de comprobaciones defensivas y de `data?.map(...)`.
Así cada estado lleva exactamente lo que tiene sentido que lleve, TypeScript
obliga a cubrir los tres casos y en el componente queda un `if` por estado.

### `fetch` con un hook propio, en lugar de TanStack Query

TanStack Query resolvería la caché, los reintentos y la deduplicación. Se
descartó a propósito: el enunciado pide **estados de carga y de error
visibles**, y una librería los resuelve escondiendo justo lo que se quiere
mostrar que uno sabe manejar. El hook propio son unas 70 líneas e incluye
cancelación. En un proyecto real con muchas pantallas, la librería.

### Cancelación de peticiones obsoletas

`useAsync` cancela con `AbortController` cuando cambian sus dependencias. Evita
el fallo clásico de esta pantalla: eliges un usuario, enseguida otro, y la
respuesta del primero llega **después** que la del segundo y pisa los datos
buenos con datos viejos. Hay un test que lo cubre, y se verificó que falla si
se quita la guarda de cancelación.

### `fetch` no rechaza ante errores HTTP

Un 404 o un 500 resuelven normalmente. Sin comprobar `response.ok`, la
aplicación intentaría pintar una página de error como si fueran datos. El
cliente convierte todo lo que no sea 2xx en `ApiError`, traduce los fallos de
red a mensajes legibles y **deja pasar las cancelaciones sin envolverlas**,
porque cancelar no es un error que mostrar al usuario.

### Identificadores normalizados a `string`

La API devuelve siempre el mismo `id` al crear (`101` en publicaciones, `11` en
usuarios). Si se confiara en él, dos elementos nuevos compartirían
identificador: React avisaría de claves duplicadas y editar o borrar uno
afectaría al otro. Lo creado lleva un UUID generado en cliente, y el `id` de la
API se normaliza a `string` en el borde, de modo que el resto de la aplicación
no arrastra un `string | number`.

### Cada recurso sabe de dónde viene

```ts
type Origin = 'server' | 'local'
```

Decide si se puede llamar a la API: `PUT` sobre algo creado en cliente devuelve
404, porque nunca llegó al servidor. Marcarlo explícitamente es preferible a
deducirlo del formato del `id` (`/^\d+$/`), que funciona por casualidad y se
rompe en silencio. Dos tests fijan el comportamiento: editando un recurso del
servidor **sí** se pide `PUT`; editando uno creado en cliente **no**.

### Tres capas sobre la respuesta del servidor

`useUsers` y `usePosts` no copian la respuesta a un estado mutable. Mantienen
tres capas —creados, editados, borrados— que se aplican al leer. Así la lista
sigue derivándose de lo que hay, sin un efecto sincronizando dos copias de los
mismos datos, que es la fuente habitual de listas desfasadas. Y recargar desde
el servidor no obliga a reconciliar nada.

Esas tres capas son justo lo que se guarda en `localStorage`, porque son la
única información que no se puede volver a pedir: la API no guarda nada.

### El almacenamiento nunca lanza

`localStorage` falla en el modo privado de Safari y con la cuota llena, y lo
guardado puede estar corrupto o venir de un formato anterior. Ante cualquiera
de esos casos se devuelve el estado vacío: perder los cambios locales es
molesto, pero que la aplicación no arranque es peor. La clave lleva espacio de
nombres y versión (`jsonplaceholder-app:posts:v1`) para no chocar con otros
proyectos servidos desde `localhost` y para poder cambiar el formato sin
lidiar con lo guardado por la versión anterior.

Usuarios y publicaciones comparten implementación (`createChangesStorage`):
duplicarla significaría arreglar el manejo de un JSON corrupto en un sitio y
olvidarlo en el otro.

### Búsqueda en cliente y sin `debounce`

Los diez usuarios ya están descargados. JSONPlaceholder no admite búsquedas
parciales (`?name_like=` es de `json-server`, no de esta API), y consultar al
servidor en cada pulsación añadiría latencia y un estado de carga parpadeante.
Tampoco hay `debounce`: retrasar el filtrado de diez elementos en memoria sólo
añadiría la sensación de que la interfaz va por detrás de lo que se escribe.

### Validación en funciones puras

Las reglas viven en `lib/`, no dentro de los componentes. Se prueban sin
renderizar ni simular pulsaciones, y los formularios de crear y de editar usan
exactamente las mismas. Se valida contra el texto **recortado**: un campo de
sólo espacios está vacío a todos los efectos aunque `value !== ''`.

Los errores no aparecen mientras se escribe por primera vez, sólo tras el
primer intento de envío; a partir de ahí se revalida en cada tecla para que el
mensaje desaparezca en cuanto se corrige. Regañar antes de que dé tiempo a
rellenar nada deja el formulario en rojo al abrirlo.

El email se comprueba de forma laxa (algo, arroba, dominio con punto). Las
expresiones regulares que intentan implementar el RFC 5322 son enormes y
rechazan direcciones válidas; lo único que confirma que un email existe es
enviarle un correo.

### Un solo formulario para crear y editar

`UserForm` y `PostForm` sirven para ambos casos. Duplicarlos garantizaría
corregir un fallo en uno y olvidarlo en el otro.

### El tema se aplica con un atributo en la raíz

Los colores son variables CSS en `:root`, así que poner `data-theme` en
`<html>` repinta toda la aplicación sin que ningún componente sepa qué tema
está activo. La prioridad tiene tres niveles:

```css
:root { /* claro */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) { /* oscuro del sistema */ }
}
:root[data-theme='dark'] { /* oscuro elegido a mano */ }
```

Ese `:not([data-theme='light'])` es lo que permite forzar el tema claro aunque
el sistema esté en oscuro. Y se distingue "no hay preferencia guardada" de
"eligió claro": sin esa distinción, la primera visita impondría el tema claro a
alguien que tiene el sistema en oscuro.

### `App` guarda el id seleccionado, no el objeto

Con una copia del usuario en el estado habría que sincronizarla al editarlo o
borrarlo. Guardando el id, el panel de publicaciones se actualiza solo: si el
usuario seleccionado desaparece, el panel se cierra sin código adicional.

### Sin `useMemo`

Filtrar diez elementos en cada render es más barato que memorizar el resultado.
Añadirlo sería una dependencia más que mantener a cambio de nada medible.

---

## Lo que descubrí de la API

Comprobado con `curl` contra la API real, porque condiciona el diseño:

| Petición | Respuesta |
| --- | --- |
| `POST /posts` | 201, **siempre `id: 101`** |
| `POST /users` | 201, **siempre `id: 11`** |
| `PUT /posts/1` (existe) | 200 |
| `PUT /posts/101` (no existe) | **404** |
| `PUT /users/11` (no existe) | **404** |
| `DELETE /<recurso>/<id>` | 200 para cualquier id |

De aquí salen dos decisiones del código: los identificadores generados en
cliente, y el campo `origin` que evita pedir un `PUT` condenado a devolver 404.

También conviene saber que **la API es irregular en latencia**. Durante el
desarrollo hubo respuestas de más de 10 segundos en `/posts`. Es, de hecho, la
mejor demostración de por qué los estados de carga importan.

---

## Tests

**69 tests en 11 archivos**, con Vitest y Testing Library.

```bash
npm test
```

| Archivo | Qué cubre |
| --- | --- |
| `api/client.test.ts` | URL y parseo, 404 → `ApiError` con status, fallo de red, cancelación propagada |
| `hooks/useAsync.test.ts` | Carga→éxito, carga→error, `reload`, y descarte de respuestas obsoletas |
| `hooks/useTheme.test.ts` | Preferencia del sistema, prioridad de la guardada, alternar y persistir |
| `lib/filterUsersByName.test.ts` | Búsqueda vacía, parcial, por apellido, con tildes, sin resultados |
| `lib/validatePost.test.ts` | Campos obligatorios y campos de sólo espacios |
| `lib/validateUser.test.ts` | Obligatorios, empresa opcional, formato de email |
| `storage/postsStorage.test.ts` | Ida y vuelta, JSON corrupto, formato desconocido, fallo al escribir |
| `components/PostForm/PostForm.test.tsx` | Validación, `aria-invalid`, foco, retirada del error, recorte de valores |
| `components/UserForm/UserForm.test.tsx` | Lo mismo para usuarios, más valores iniciales al editar |
| `App.test.tsx` | Flujos completos de principio a fin |
| `test/setup.test.tsx` | Que el propio entorno de tests funciona |

Los tests consultan **por rol accesible** (`getByRole('searchbox', { name: ... })`),
no por clase ni `data-testid`. Prueban lo que ve y usa quien abre la página, y
si la interfaz deja de ser accesible, el test se entera.

Dos de ellos merecen mención, porque cubren lo que es fácil que funcione por
accidente:

- **Descarte de respuestas obsoletas** en `useAsync`. Se verificó quitando la
  guarda de cancelación: el test falla. No es decorativo.
- **`PUT` sólo para recursos del servidor.** Un test comprueba que editar algo
  del servidor sí pide `PUT`, y otro que editar algo creado en cliente no lo
  pide.

---

## Accesibilidad

No era un requisito, pero guía la forma del marcado y hace que los tests
prueben la aplicación real:

- Las tarjetas y acciones son `<button>`, no `<div onClick>`: llegan con el
  tabulador y responden a Intro y Espacio sin `role` ni `tabIndex` a mano.
- El indicador de carga lleva `role="status"` (se anuncia sin robar el foco) y
  los errores `role="alert"` (se anuncian de inmediato).
- Los campos inválidos llevan `aria-invalid` y `aria-describedby` apuntando a
  su mensaje, y el foco salta al primero que falla.
- Los botones repetidos llevan el nombre del elemento en `aria-label`
  (`Borrar: Leanne Graham`): con diez usuarios, sin eso un lector de pantalla
  anuncia diez veces "Borrar" sin decir sobre quién actúa.
- Los formularios tienen nombre (`aria-labelledby`). Hace falta porque al
  editar hay dos en pantalla con un campo "Título" cada uno.
- El contador de resultados usa `aria-live="polite"`.
- `color-scheme` declarado, para que los controles nativos sigan el tema.

---

## Qué haría con más tiempo

**Lo primero**

1. **MSW** (Mock Service Worker) en lugar de sustituir `fetch`. Los tests
   dejarían de conocer el detalle de cómo se piden los datos y probarían contra
   un servidor simulado de verdad.
2. **Tests directos de `useUsers` y `usePosts`.** Hoy están cubiertos a través
   de `App.test.tsx`, que es un cubrimiento real pero más lento y menos preciso
   al señalar qué se rompió.
3. **Error boundary** en la raíz. Ahora un fallo inesperado de render deja la
   pantalla en blanco.

**Producto**

4. **Rutas** (`/users/:id`), para poder compartir el enlace a un usuario y usar
   el botón de atrás del navegador.
5. **Paginación o scroll infinito** en publicaciones. Con diez usuarios no hace
   falta; con mil, sí.
6. **Deshacer** tras borrar, en vez de confirmación previa. Suele ser mejor
   patrón: no interrumpe, y protege igual.
7. **Búsqueda también por email o empresa**, con el texto coincidente resaltado.
8. **Actualización optimista** al crear: pintar la publicación de inmediato y
   revertir si la API falla.

**Infraestructura**

9. **GitHub Actions** con `lint`, `build` y `test` en cada push.
10. **`.gitattributes`** con `* text=auto eol=lf`, para que el repo no mezcle
    finales de línea entre Windows y Linux.
11. **Cobertura** con `vitest --coverage` y un mínimo exigido.
12. **Revisión con un lector de pantalla real** (NVDA o VoiceOver). El marcado
    está pensado para ello, pero no se ha probado con uno.

---

## Cómo usé la IA

Usé Claude como copiloto durante todo el desarrollo. No fue "pídele la app y
pégala": el flujo fue plantear el problema, discutir el enfoque, revisar lo
propuesto y corregir. Lo resumo con honestidad, incluidos los fallos.

### Qué le pedí

- Un **análisis del enunciado y un plan por commits** antes de escribir código,
  con estimación de tiempo por bloque.
- **Investigar el comportamiento real de la API** antes de diseñar: qué
  devuelve `POST`, qué pasa con `PUT` sobre un id inexistente, qué hace
  `DELETE`. De ahí salió la tabla de más arriba.
- Implementar cada bloque por separado: cliente HTTP, hook de datos, lista,
  búsqueda, publicaciones, formularios, CRUD, persistencia, tema.
- **Justificar cada decisión**, sobre todo las de no usar algo (sin TanStack
  Query, sin `debounce`, sin `useMemo`, sin librería de formularios).
- Escribir los tests junto al código que prueban, no todos al final.

### Qué acepté

- La **unión discriminada** para el estado asíncrono. Mejoró de verdad el
  código de los componentes: un `if` por estado y sin comprobaciones
  defensivas.
- La **cancelación con `AbortController`**, que no habría puesto de entrada y
  evita un fallo real al cambiar rápido de usuario.
- El **campo `origin`** para saber si un recurso existe en el servidor. Es la
  solución limpia al 404 del `PUT`.
- La **arquitectura de tres capas** sobre la respuesta del servidor. Soportó
  sin cambios el salto de "sólo crear" a CRUD completo y luego a persistencia.
- La insistencia en **consultar por rol accesible** en los tests.

### Qué corregí o tuve que resolver

- **`localStorage` roto en los tests.** El entorno fallaba con
  `localStorage.clear is not a function`. Hubo que diagnosticar que **Node 22+
  expone un `localStorage` nativo que tapa el de jsdom** y llega vacío cuando
  falta `--localstorage-file`. La primera solución propuesta fue usar el flag
  `--no-webstorage`, y se descartó: ese flag no existe antes de Node 22 y
  rompería `npm test` en versiones anteriores. Se sustituyó por una
  implementación en memoria que sólo entra si la del entorno no sirve
  (`src/test/memoryStorage.ts`).
- **`strict` desactivado.** La plantilla de `create-vite` no lo activa. Se
  detectó revisando el `tsconfig` en el primer commit.
- **Un bug de timing con el foco.** En `UserForm`, el `ref` se asignaba según
  el estado de errores, pero `setErrors` todavía no había provocado el
  re-render cuando se llamaba a `focus()`, así que el foco iba al campo
  equivocado. Se arregló guardando los `ref` de todos los campos. En el
  navegador se habría visto como "a veces el foco no va donde debe".
- **Botones anidados.** Al añadir "Editar" y "Borrar" dentro de la tarjeta de
  usuario, que era un `<button>`, quedaba un botón dentro de otro: HTML
  inválido. Hubo que reestructurar para que fueran hermanos.
- **Un test ambiguo que señalaba un defecto real.** Al editar hay dos
  formularios con un campo "Título" cada uno; el test falló por ambigüedad. El
  arreglo correcto no era afinar el test, sino dar nombre a los formularios con
  `aria-labelledby` — porque un lector de pantalla tenía el mismo problema.
- **Avisos del linter mal resueltos.** El primer intento de callar un aviso en
  `useAsync` lo empeoró: al extraer el array de dependencias a una variable,
  oxlint dejó de analizar el efecto y pasó de un aviso a dos. Se volvió al
  literal con una única supresión documentada.
- **Comentarios de más.** Los comentarios deben explicar *por qué*, no *qué*;
  se eliminaron los que repetían lo que el código ya dice.

### Qué no delegué

Las decisiones de alcance (hasta dónde llevar el CRUD), la estructura de
commits y la revisión de cada cambio en el navegador antes de darlo por bueno.
La IA acelera la escritura; no sustituye el criterio sobre qué merece
escribirse.

---

## Tiempo invertido

> **Pendiente de completar antes de entregar.**

---

## Historial de commits

El desarrollo está repartido en commits pequeños que siguen el orden de
construcción: andamiaje, entorno de tests, modelo y cliente HTTP, hook de
datos, lista, búsqueda, publicaciones, formulario, validación, CRUD,
persistencia y tema.

```bash
git log --oneline
```
