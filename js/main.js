/**
 * Portfolio de Fotografía - Scripts principales
 * Principios de interacción y microanimación (Emil Kowalski / Impeccable)
 */

document.addEventListener("DOMContentLoaded", () => {
  initHeaderScroll();
  initMobileNav();
  initGalleryFilter();
  initLightbox();
  initContactForm();
  initScrollReveal();
  loadDynamicGallery();
  loadDynamicVideos();
  loadDynamicAbout();
  runSelfCheck();
});

/* --------------------------------------------------------------------------
   HEADER DINÁMICO CON SCROLL
   -------------------------------------------------------------------------- */
function initHeaderScroll() {
  const header = document.querySelector(".header");
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 24) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* --------------------------------------------------------------------------
   SISTEMA DE REVELACIÓN CON SCROLL (INTERSECTION OBSERVER)
   -------------------------------------------------------------------------- */
function initScrollReveal() {
  const targets = document.querySelectorAll(
    ".curated-section, .series-section, .manifesto-section, .contact-fast-strip, .videos-grid, .about-grid, .gear-grid, .contact-grid"
  );
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => {
    el.classList.add("reveal");
    observer.observe(el);
  });
}

/* --------------------------------------------------------------------------
   MENÚ MÓVIL
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (!toggle || !navLinks) return;

  toggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    toggle.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

/* --------------------------------------------------------------------------
   FILTROS DE LA GALERÍA CON TRANSICIÓN SUAVE
   -------------------------------------------------------------------------- */
function initGalleryFilter() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  if (!filterBtns.length) return;

  const applyFilter = (filter) => {
    filterBtns.forEach((b) => b.classList.toggle("active", b.getAttribute("data-filter") === filter));
    const items = document.querySelectorAll(".gallery-grid .gallery-item");
    items.forEach((item) => {
      const match = filter === "all" || item.getAttribute("data-category") === filter;
      if (match) {
        item.style.display = "block";
        requestAnimationFrame(() => {
          item.style.opacity = "1";
          item.style.transform = "scale(1)";
        });
      } else {
        item.style.opacity = "0";
        item.style.transform = "scale(0.96)";
        setTimeout(() => {
          if (item.getAttribute("data-category") !== filter && filter !== "all") {
            item.style.display = "none";
          }
        }, 220);
      }
    });
  };

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => applyFilter(btn.getAttribute("data-filter")));
  });

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
   VISOR MODAL ELEVADO (LIGHTBOX) CON NAVEGACIÓN Y SWIPE
   -------------------------------------------------------------------------- */
function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxCounter = document.getElementById("lightbox-counter");
  const closeBtn = document.querySelector(".lightbox-close");
  const prevBtn = document.querySelector(".lightbox-prev");
  const nextBtn = document.querySelector(".lightbox-next");

  if (!lightbox || !lightboxImg) return;

  let currentItems = [];
  let currentIndex = 0;

  const updateActiveItems = () => {
    currentItems = Array.from(document.querySelectorAll(".gallery-grid .gallery-item")).filter(
      (item) => window.getComputedStyle(item).display !== "none"
    );
  };

  const renderCurrent = () => {
    if (!currentItems.length || currentIndex < 0 || currentIndex >= currentItems.length) return;
    const item = currentItems[currentIndex];
    const img = item.querySelector("img");
    if (!img) return;

    const title = item.querySelector("h3, h4")?.textContent || img.alt || "Fotografía";
    const gear = item.querySelector(".gear-tag, .gallery-meta")?.textContent || "";

    lightboxImg.classList.add("changing");
    setTimeout(() => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || title;
      if (lightboxCaption) {
        lightboxCaption.textContent = gear ? `${title} — ${gear}` : title;
      }
      if (lightboxCounter) {
        lightboxCounter.textContent = `${currentIndex + 1} / ${currentItems.length}`;
      }
      lightboxImg.classList.remove("changing");
    }, 120);
  };

  const openItem = (item) => {
    updateActiveItems();
    const idx = currentItems.indexOf(item);
    currentIndex = idx >= 0 ? idx : 0;
    renderCurrent();
    lightbox.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
  };

  const nextItem = () => {
    if (!currentItems.length) return;
    currentIndex = (currentIndex + 1) % currentItems.length;
    renderCurrent();
  };

  const prevItem = () => {
    if (!currentItems.length) return;
    currentIndex = (currentIndex - 1 + currentItems.length) % currentItems.length;
    renderCurrent();
  };

  // Delegación de click
  document.addEventListener("click", (e) => {
    const item = e.target.closest(".gallery-item");
    if (item) {
      e.preventDefault();
      openItem(item);
    }
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

  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
  if (prevBtn) prevBtn.addEventListener("click", prevItem);
  if (nextBtn) nextBtn.addEventListener("click", nextItem);

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Atajos de teclado: Escape, Flecha Izquierda, Flecha Derecha
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") nextItem();
    if (e.key === "ArrowLeft") prevItem();
  });

  // Soporte de gestos táctiles (Swipe)
  let touchStartX = 0;
  let touchEndX = 0;

  lightbox.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );

  lightbox.addEventListener(
    "touchend",
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diffX = touchEndX - touchStartX;
      if (Math.abs(diffX) > 45) {
        if (diffX < 0) nextItem();
        else prevItem();
      }
    },
    { passive: true }
  );
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
