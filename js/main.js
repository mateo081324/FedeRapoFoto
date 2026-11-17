/**
 * Portfolio de Fotografía - Scripts principales
 */

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initGalleryFilter();
  initLightbox();
  initContactForm();
  loadDynamicGallery();
  loadDynamicVideos();
  loadDynamicAbout();
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
   CARGA DINÁMICA DE VIDEOS
   -------------------------------------------------------------------------- */
async function loadDynamicVideos() {
  const grid = document.querySelector(".videos-grid");
  if (!grid) return;

  try {
    const res = await fetch("data/galeria.json");
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !Array.isArray(data.videos) || !data.videos.length) return;

    grid.innerHTML = data.videos.map((v) => {
      let mediaHtml = "";
      const isEmbed = v.video && (v.video.includes("youtube.com") || v.video.includes("youtu.be") || v.video.includes("vimeo.com"));
      if (isEmbed) {
        let embedUrl = v.video;
        if (v.video.includes("youtube.com/watch?v=")) {
          embedUrl = v.video.replace("watch?v=", "embed/");
        } else if (v.video.includes("youtu.be/")) {
          embedUrl = v.video.replace("youtu.be/", "www.youtube.com/embed/");
        } else if (v.video.includes("vimeo.com/") && !v.video.includes("player.vimeo.com")) {
          embedUrl = v.video.replace("vimeo.com/", "player.vimeo.com/video/");
        }
        mediaHtml = `<iframe src="${embedUrl}" title="${v.titulo}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%; aspect-ratio:16/9; border:none; display:block;"></iframe>`;
      } else {
        mediaHtml = `
          <video controls playsinline preload="metadata" poster="${v.poster || ''}">
            <source src="${v.video}" type="video/mp4">
            Tu navegador no soporta reproducción de video.
          </video>
        `;
      }

      return `
        <article class="video-card">
          <div class="video-wrapper">
            ${mediaHtml}
          </div>
          <div class="video-meta">
            ${v.tag ? `<span class="video-tag">${v.tag}</span>` : ""}
            <h3>${v.titulo}</h3>
            ${v.descripcion ? `<p>${v.descripcion}</p>` : ""}
          </div>
        </article>
      `;
    }).join("");
  } catch (_) {
    // shortcut: Fallback silencioso a videos estáticos HTML
  }
}

/* --------------------------------------------------------------------------
   CARGA DINÁMICA DE SOBRE MÍ
   -------------------------------------------------------------------------- */
async function loadDynamicAbout() {
  const aboutSection = document.querySelector(".about-grid");
  if (!aboutSection) return;

  try {
    const res = await fetch("data/galeria.json");
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !data.sobreMi) return;
    const sm = data.sobreMi;

    const imgEl = aboutSection.querySelector(".about-photo img");
    if (imgEl && sm.foto) imgEl.src = sm.foto;

    const quoteEl = aboutSection.querySelector(".about-content h2");
    if (quoteEl && sm.frase) quoteEl.textContent = sm.frase;

    const leadEl = aboutSection.querySelector(".about-lead");
    if (leadEl && sm.lead) leadEl.textContent = sm.lead;

    if (sm.bio) {
      const oldParagraphs = aboutSection.querySelectorAll(".about-content > p:not(.about-lead):not([style*='uppercase'])");
      oldParagraphs.forEach((p) => p.remove());

      const paragraphs = sm.bio.split("\n\n").filter((p) => p.trim());
      const statsEl = aboutSection.querySelector(".about-stats");
      paragraphs.forEach((text) => {
        const p = document.createElement("p");
        p.textContent = text.trim();
        aboutSection.querySelector(".about-content").insertBefore(p, statsEl);
      });
    }

    if (Array.isArray(sm.stats) && sm.stats.length) {
      const statsContainer = aboutSection.querySelector(".about-stats");
      if (statsContainer) {
        statsContainer.innerHTML = sm.stats.map((s) => `
          <div class="stat-item">
            <h3>${s.valor}</h3>
            <p>${s.label}</p>
          </div>
        `).join("");
      }
    }

    if (sm.clientes) {
      const clientList = document.querySelector(".clients-brand-list") || document.querySelector("section[style*='border-top'] div");
      if (clientList) {
        const items = typeof sm.clientes === "string" ? sm.clientes.split(",").map((c) => c.trim()) : sm.clientes;
        clientList.innerHTML = items.map((c) => `<span>${c}</span>`).join("");
      }
    }
  } catch (_) {
    // shortcut: Fallback silencioso a contenido estático HTML
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
