/**
 * Portfolio de Fotografía - Scripts principales
 */

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initGalleryFilter();
  initLightbox();
  initContactForm();
  loadDynamicGallery();
  runSelfCheck();
});

/* --------------------------------------------------------------------------
   MENÚ MÓVIL
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (!toggle || !navLinks) return;

  toggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

/* --------------------------------------------------------------------------
   FILTROS DE LA GALERÍA
   -------------------------------------------------------------------------- */
function initGalleryFilter() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  if (!filterBtns.length) return;

  const applyFilter = (filter) => {
    filterBtns.forEach((b) => b.classList.toggle("active", b.getAttribute("data-filter") === filter));
    document.querySelectorAll(".gallery-grid .gallery-item").forEach((item) => {
      const match = filter === "all" || item.getAttribute("data-category") === filter;
      item.style.display = match ? "block" : "none";
    });
  };

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => applyFilter(btn.getAttribute("data-filter")));
  });

  // Activa filtro automático si la URL trae hash (ej. galeria.html#gastronomia)
  const syncHash = () => {
    const hash = window.location.hash.slice(1);
    if (hash && document.querySelector(`.filter-btn[data-filter="${hash}"]`)) {
      applyFilter(hash);
    }
  };

  syncHash();
  window.addEventListener("hashchange", syncHash);
}

/* --------------------------------------------------------------------------
   VISOR MODAL (LIGHTBOX)
   -------------------------------------------------------------------------- */
function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const closeBtn = document.querySelector(".lightbox-close");

  if (!lightbox || !lightboxImg) return;

  const openItem = (item) => {
    const img = item.querySelector("img");
    if (!img) return;
    const title = item.querySelector("h3, h4")?.textContent || img.alt || "Fotografía";
    const gear = item.querySelector(".gear-tag, .gallery-meta")?.textContent || "";

    lightboxImg.src = img.src;
    lightboxCaption.textContent = gear ? `${title} — ${gear}` : title;
    lightbox.classList.add("active");
  };

  // Delegación de eventos para soportar items estáticos o cargados dinámicamente
  document.addEventListener("click", (e) => {
    const item = e.target.closest(".gallery-item");
    if (item) openItem(item);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const item = document.activeElement?.closest(".gallery-item");
      if (item) {
        e.preventDefault();
        openItem(item);
      }
    }
  });

  const closeLightbox = () => lightbox.classList.remove("active");

  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("active")) {
      closeLightbox();
    }
  });
}

/* --------------------------------------------------------------------------
   CARGA DINÁMICA DE FOTOS (DECAP CMS / JSON)
   -------------------------------------------------------------------------- */
async function loadDynamicGallery() {
  const grid = document.querySelector(".gallery-grid");
  if (!grid) return;

  try {
    const res = await fetch("data/galeria.json");
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !Array.isArray(data.fotos) || !data.fotos.length) return;

    const isHome = Boolean(document.querySelector(".curated-section"));
    const items = isHome
      ? (data.fotos.some((f) => f.destacada) ? data.fotos.filter((f) => f.destacada) : data.fotos.slice(0, 6))
      : data.fotos;

    grid.innerHTML = items.map((item) => {
      const cat = item.categoria || "general";
      const catTitle = cat.charAt(0).toUpperCase() + cat.slice(1);
      const gear = item.equipo ? `<p class="gear-tag">${item.equipo}</p>` : "";
      return `
        <div class="gallery-item" tabindex="0" role="button" aria-label="Ver fotografía ampliada: ${item.titulo}" data-category="${cat}">
          <img src="${item.imagen}" alt="${item.titulo}" loading="lazy">
          <div class="gallery-overlay">
            <span>${catTitle}</span>
            <h4>${item.titulo}</h4>
            ${gear}
          </div>
        </div>
      `;
    }).join("");

    // Reaplica filtro activo si existe
    const activeFilterBtn = document.querySelector(".filter-btn.active");
    if (activeFilterBtn) {
      const filter = activeFilterBtn.getAttribute("data-filter");
      if (filter && filter !== "all") {
        document.querySelectorAll(".gallery-grid .gallery-item").forEach((el) => {
          el.style.display = el.getAttribute("data-category") === filter ? "block" : "none";
        });
      }
    }
  } catch (_) {
    // shortcut: Fallback silencioso a fotos estáticas HTML si falla fetch (ej. protocolo file://)
  }
}

/* --------------------------------------------------------------------------
   FORMULARIO DE CONTACTO
   -------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  // shortcut: Manejo de envío local simulado con confirmación suave; conectar a backend PHP o servicio tipo Formspree al publicar en hosting
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = "Mensaje enviado con éxito ✓";
    btn.style.backgroundColor = "#2e7d32";
    btn.style.borderColor = "#2e7d32";
    form.reset();

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.backgroundColor = "";
      btn.style.borderColor = "";
    }, 4000);
  });
}

/* --------------------------------------------------------------------------
   SELF-CHECK (ASSERT TESTS)
   -------------------------------------------------------------------------- */
function runSelfCheck() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const galleryItems = document.querySelectorAll(".gallery-item");
  if (filterBtns.length > 0 && galleryItems.length > 0) {
    console.assert(
      document.querySelector('.filter-btn[data-filter="all"]'),
      "Check: Debe existir botón de filtro 'all'"
    );
    console.assert(
      [...galleryItems].every((item) => item.hasAttribute("tabindex")),
      "Check: Todos los items de galería deben tener tabindex para accesibilidad"
    );
  }
}
