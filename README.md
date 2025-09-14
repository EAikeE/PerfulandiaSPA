# Perfulandia SPA

Aplicación web para catálogo de perfumes con carrito, registro/login en localStorage, validaciones reforzadas y notificaciones mediante SweetAlert2.

## Características principales
- Catálogo filtrable (marca, búsqueda, precio).
- Carrito persistido en `localStorage` (agregar, editar cantidades, eliminar, checkout simulado).
- Autenticación local (registro + login) con sanitización y validación estricta (nombre, correo y contraseña).
- Protección de rutas: `productos.html` y `carrito.html` requieren sesión (redirige a login con alerta).
- Dropdown de usuario responsive (desktop flotante / móvil integrado en menú).
- Formularios: contacto, registro, login y checkout con validación en vivo.
- SweetAlert2 para mensajes: éxito, errores, protección, confirmaciones.
- UI responsive (navbar colapsable, grillas adaptables, formularios compactos).

## Requisitos
- VS Code.
- Extensión: **Live Server**.
- Navegador moderno (Chrome, Edge, Firefox, Safari).

_No requiere Node, build tools, ni backend. Todo corre desde archivos estáticos._

## Estructura del proyecto
```
perfulandia_spa/
  index.html
  assets/
    css/styles.css
    js/app.js
    js/data.js          # Datos de productos y fallback
    pages/
      productos.html
      carrito.html
      login.html
      register.html
```

## Puesta en marcha con Live Server (VS Code)
1. Abre la carpeta `perfulandia_spa` en VS Code.
2. Verifica que tienes instalada la extensión Live Server:
   - Abrir Marketplace (Ctrl+Shift+X) → buscar "Live Server" → instalar si falta.
3. Abre `index.html` en el editor.
4. Opción A (barra de estado): Clic en **Go Live** (abajo a la derecha).
5. Opción B (contextual): Clic derecho sobre `index.html` → **Open with Live Server**.
6. El navegador se abrirá en una URL similar a:
   - `http://127.0.0.1:5500/index.html` (el puerto puede variar).
7. Navega normalmente:
   - Catálogo: `Productos`.
   - Carrito: `Carrito` (pedirá login si no has iniciado sesión).
   - Login / Registro: menú "Acceder".

### ¿Por qué usar Live Server?
Abrir directamente `index.html` con `file://` puede romper rutas relativas y el `dialog` modal o fuentes externas. Live Server simula un servidor estático simple.

## Flujo de autenticación
1. Usuario se registra (se guarda objeto `{ name, email, password }` en localStorage `pf_users`).
2. Se crea sesión en `pf_session` y se refresca el menú (muestra nombre).
3. Si intenta entrar a páginas protegidas sin sesión: alerta → opcional redirección a login.
4. Cerrar sesión: elimina `pf_session` y redirige si la página era protegida.

## Validación y sanitización
- **Nombre**: Solo letras (acentos incluidos) y espacios (3–60).
- **Email**: Regex estándar.
- **Contraseña**: 6–64, mínimo 1 letra y 1 número, sin espacios, sin `< > " ' \` ni `script`.
- Sanitización elimina etiquetas, caracteres de control y comillas.
- Mensajes de error en línea + SweetAlert2 para casos globales.

## Carrito y checkout
- Persistencia en `localStorage` (`pf_cart`).
- Checkout simula compra: genera orden (`pf_orders`) con tarjeta enmascarada y muestra alerta de confirmación.
- Sin integración real de pago (solo demostración UX).

## Datos de productos
- Cargados desde `assets/js/data.js` (`window.PERFULANDIA_DATA`).
- Imágenes con fallback si hay error de carga.

## SweetAlert2
Se usa CDN: `https://cdn.jsdelivr.net/npm/sweetalert2@11`.
Si lo deseas offline, descarga el script y actualiza el `<script src=...>` en las páginas.

## Customización rápida
| Objetivo | Archivo | Qué tocar |
|----------|---------|-----------|
| Colores base | `styles.css` `:root` | Variables `--bg`, `--brand`, etc. |
| Productos | `data.js` | Arreglo `products` |
| Reglas password | `app.js` | Sección `register` (regex y validaciones) |
| Páginas protegidas | `app.js` | Array `PROTECTED_PAGES` |
| Mensajes modales | `app.js` | Funciones `alertQuick`, uso de `Swal.fire` |

## Troubleshooting
| Problema | Causa | Solución |
|----------|-------|----------|
| Rutas de login duplicadas (`assets/pages/assets/pages/login.html`) | Acceso desde subruta sin cálculo dinámico | Ya corregido con lógica `rootPrefix` y `loginPath` en `app.js` |
| No abre modal de producto | Bloqueo de popup / script no cargó | Ver consola y comprobar carga de `data.js` |
| Carrito no persiste | Bloqueo de `localStorage` | Revisar modo incógnito / permisos |
| Estilos rotos al abrir directo con file:// | Sin servidor | Usar Live Server o método alterno |

## Seguridad (Limitaciones)
Este proyecto NO usa backend ni base de datos real:
- No hay SQL, la "inyección" se limita a intentos de romper validaciones front-end.
- Datos quedan en `localStorage` (fáciles de manipular desde DevTools).
- No usar en producción sin: backend seguro, hashing salado, JWT/sesiones, rate limiting y captcha.

## Accesibilidad
- Uso de `aria-label`, `role="menu"`, estados `aria-expanded`.
- Focus manejado en dropdown (tecla Escape para cerrar).
- Mensajes de error asociados a inputs vía `data-error-for`.

## Scripts / Build
No hay scripts de construcción. Puedes empaquetar si quieres con un simple zip o integrar un bundler (Vite, esbuild) si el proyecto crece.

## Próximas mejoras sugeridas
- Hash de contraseñas (SHA-256) antes de guardar (solo demostración educativa).
- Lista dinámica de requisitos de contraseña mientras escribe.
- Paginación de catálogo / lazy loading.
- Modo oscuro/claro con toggle.
- Internacionalización.

## FAQ rápida
**¿Dónde cambio los productos?** `assets/js/data.js`.
**¿Cómo reinicio datos?** Limpia `localStorage` desde DevTools o ejecutar en consola: `localStorage.clear()`.
**¿Se puede usar sin Internet?** Sí, salvo CDN de SweetAlert2 y Font Awesome (descarga local si deseas offline total).

## Licencia
(No se especificó licencia; agrega una si publicarás el repo.)

---
¿Necesitas versión en inglés, agregar capturas o badges? Pídelo y lo ajusto.
