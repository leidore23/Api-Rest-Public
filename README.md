# Usuarios y publicaciones — JSONPlaceholder

Pequeña aplicación en React + TypeScript que consume la API pública
[JSONPlaceholder](https://jsonplaceholder.typicode.com): lista de usuarios con
búsqueda por nombre, publicaciones del usuario seleccionado y creación de nuevas
publicaciones mediante un formulario validado.

Prueba técnica de Frontend.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

## Cómo ejecutarlo

```bash
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

## Scripts

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Comprobación de tipos y build de producción |
| `npm run preview` | Sirve localmente el build de producción |
| `npm test` | Ejecuta la suite de tests una vez |
| `npm run test:watch` | Tests en modo watch |
| `npm run lint` | Linter (oxlint) |

## Stack

- **Vite** como herramienta de build y servidor de desarrollo
- **React 19** con **TypeScript** en modo `strict`
- **Vitest** + **Testing Library** sobre **jsdom** para los tests

---

> Las secciones de decisiones técnicas, mejoras pendientes y uso de IA se
> completan al cierre del desarrollo.
