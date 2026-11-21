(() => {
  // Tamaño lógico del lienzo (el PNG exportado sale a 2x de esto: 1200 x 1400 px)
  const W = 600;
  const H = 700;
  const CALIDAD_EXPORT = 2;
  // Si una imagen es más grande que esto (en su lado mayor), se reduce al insertarla.
  const LADO_MAX_INICIAL = 360;

  const zona = document.getElementById("zona-lienzo");
  const contenedor = document.getElementById("lienzo");
  const banco = document.getElementById("banco");

  // ---------- Konva ----------
  const stage = new Konva.Stage({ container: "lienzo", width: W, height: H });

  const capaFondo = new Konva.Layer({ listening: false });
  capaFondo.add(new Konva.Rect({ x: 0, y: 0, width: W, height: H, fill: "#ffffff" }));

  const capa = new Konva.Layer();
  const tr = new Konva.Transformer({
    keepRatio: false,
    enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
    rotateEnabled: true,
    rotationSnaps: [0, 90, 180, 270],
    rotationSnapTolerance: 5,
    anchorSize: 14,
    anchorCornerRadius: 7,
    borderStroke: "#3b82f6",
    anchorStroke: "#3b82f6",
    flipEnabled: true,
    boundBoxFunc: (anterior, nuevo) =>
      nuevo.width < 20 || nuevo.height < 20 ? anterior : nuevo,
  });
  capa.add(tr);
  stage.add(capaFondo, capa);

  // Ajusta el lienzo al ancho disponible (útil en celulares)
function ajustar() {
  const arriba = zona.getBoundingClientRect().top + window.scrollY;
  const anchoDisp = zona.clientWidth - 2;
  const altoDisp = window.innerHeight - arriba - 50; // deja espacio al texto de ayuda
  const esc = Math.max(0.3, Math.min(1, anchoDisp / W, altoDisp / H));
  stage.width(W * esc);
  stage.height(H * esc);
  stage.scale({ x: esc, y: esc });
  stage.batchDraw();
}
  ajustar();
  window.addEventListener("resize", ajustar);

  // ---------- Selección ----------
  function seleccionar(nodo) {
    tr.nodes(nodo ? [nodo] : []);
  }
  const seleccionado = () => tr.nodes()[0] || null;

  stage.on("mousedown touchstart", (e) => {
    if (e.target === stage) seleccionar(null);
  });

  // ---------- Agregar piezas ----------
  // x, y son coordenadas lógicas (centro de la pieza)
  function agregarPieza(src, x, y) {
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth || 200;
      let h = img.naturalHeight || 200;
      const k = Math.min(1, LADO_MAX_INICIAL / Math.max(w, h));
      w *= k;
      h *= k;

      const nodo = new Konva.Image({
        image: img,
        x,
        y,
        width: w,
        height: h,
        offsetX: w / 2, // rota y escala desde el centro
        offsetY: h / 2,
        draggable: true,
      });
      nodo.on("mousedown touchstart", () => seleccionar(nodo));
      nodo.on("mouseenter", () => (stage.container().style.cursor = "move"));
      nodo.on("mouseleave", () => (stage.container().style.cursor = "default"));

      capa.add(nodo);
      tr.moveToTop();
      seleccionar(nodo);
    };
    img.src = src;
  }

  // ---------- Banco de piezas + arrastre ----------
  PIEZAS.forEach((p) => {
    const celda = document.createElement("div");
    celda.className = "pieza";
    celda.title = p.nombre;
    const miniatura = document.createElement("img");
    miniatura.src = p.src;
    miniatura.alt = p.nombre;
    miniatura.draggable = false;
    celda.appendChild(miniatura);
    celda.addEventListener("pointerdown", (e) => iniciarArrastre(p, e));
    banco.appendChild(celda);
  });

  function iniciarArrastre(pieza, e) {
    e.preventDefault();
    const inicio = { x: e.clientX, y: e.clientY };

    const fantasma = document.createElement("img");
    fantasma.id = "fantasma";
    fantasma.src = pieza.src;
    fantasma.style.left = e.clientX + "px";
    fantasma.style.top = e.clientY + "px";
    document.body.appendChild(fantasma);

    const mover = (ev) => {
      fantasma.style.left = ev.clientX + "px";
      fantasma.style.top = ev.clientY + "px";
    };
    const terminar = () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", terminar);
      fantasma.remove();
    };
    const soltar = (ev) => {
      terminar();
      const movido = Math.hypot(ev.clientX - inicio.x, ev.clientY - inicio.y) > 6;
      const r = contenedor.getBoundingClientRect();
      const dentro =
        ev.clientX >= r.left && ev.clientX <= r.right &&
        ev.clientY >= r.top && ev.clientY <= r.bottom;
      const esc = stage.scaleX();

      if (movido && dentro) {
        agregarPieza(pieza.src, (ev.clientX - r.left) / esc, (ev.clientY - r.top) / esc);
      } else if (!movido) {
        // Un toque simple en el banco la coloca en el centro del lienzo
        agregarPieza(pieza.src, W / 2, H / 2);
      }
    };

    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", terminar);
  }

  // ---------- Botones ----------
  document.getElementById("btn-frente").onclick = () => {
    const n = seleccionado();
    if (n) { n.moveToTop(); tr.moveToTop(); }
  };
  document.getElementById("btn-atras").onclick = () => {
    const n = seleccionado();
    if (n) n.moveDown();
  };
  document.getElementById("btn-borrar").onclick = borrar;
  document.getElementById("btn-limpiar").onclick = () => {
    if (!capa.find("Image").length) return;
    if (!confirm("¿Vaciar el lienzo?")) return;
    seleccionar(null);
    capa.find("Image").forEach((n) => n.destroy());
  };
  function borrar() {
    const n = seleccionado();
    if (!n) return;
    seleccionar(null);
    n.destroy();
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      borrar();
    }
  });

  // ---------- Exportar ----------
  document.getElementById("btn-exportar").onclick = () => {
    const previos = tr.nodes();
    tr.nodes([]); // oculta las manijas para que no salgan en la imagen
    try {
      const url = stage.toDataURL({
        pixelRatio: CALIDAD_EXPORT / stage.scaleX(),
        mimeType: "image/png",
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = "rostro.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(
        "No se pudo exportar. Si abriste index.html haciendo doble clic, " +
        "ábrelo con un servidor local (por ejemplo la extensión Live Server de VS Code) " +
        "o desde la página publicada."
      );
    } finally {
      tr.nodes(previos);
    }
  };
})();
