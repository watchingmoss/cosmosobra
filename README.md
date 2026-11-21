# Creador de rostros

App web simple para arrastrar piezas de un banco y recrear rostros. Hecha con [Konva.js](https://konvajs.org/), sin backend ni instalación.

## Funciones
- Arrastrar piezas del banco al lienzo (o tocarlas para ponerlas en el centro)
- Mover, escalar (esquinas) y rotar (círculo superior) cada pieza
- Al frente / atrás, voltear, borrar (botón o tecla Supr), limpiar
- Exportar a PNG (1200 x 1400 px)

## Probar en local (VS Code)
No abras `index.html` con doble clic: el navegador bloquea la exportación a PNG en archivos locales.
Instala la extensión **Live Server**, clic derecho en `index.html` → *Open with Live Server*.

## Agregar tus propias imágenes
1. Copia las imágenes a la carpeta `assets/` (SVG, PNG con fondo transparente o WebP).
2. Agrega una línea en `piezas.js`:
   ```js
   { nombre: "Mano 1", src: "assets/mano1.png" },
   ```
3. Las imágenes grandes se reducen solas al insertarlas, pero conviene comprimirlas
   (por ejemplo con Squoosh) para que la página cargue rápido.

## Publicar en GitHub Pages
1. Crea un repositorio en GitHub y sube el contenido de esta carpeta.
2. En el repositorio: **Settings → Pages → Build and deployment**, elige *Deploy from a branch*, rama `main` y carpeta `/ (root)`.
3. En unos minutos queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.
