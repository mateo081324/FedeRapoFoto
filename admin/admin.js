/* ESTADO DE LA APLICACIÓN */
let fotos = [];
let initialFotos = [];
let videos = [];
let initialVideos = [];
let sobreMi = {};
let initialSobreMi = {};

let currentFilter = 'all';
let currentSection = 'fotos';
let editingIndex = -1;
let editingVideoIndex = -1;
let selectedCategory = 'gastronomia';
let currentImageData = '';
let currentUploadFile = null;
let pendingUploads = new Map();
let pendingSmFoto = null;
let hasChanges = false;

/* CONTROL DE ACCESO ESTRICTO */
document.addEventListener("DOMContentLoaded", () => {
  checkLocalDev();
  initNetlifyIdentity();
});

function checkLocalDev() {
  const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  if (isLocal) {
    const bypass = document.getElementById("devBypassArea");
    if (bypass) bypass.style.display = "block";
  }
}

function activateDevMode() {
  grantAccess({ email: "desarrollo@local.dev" });
}

function initNetlifyIdentity() {
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", user => {
      if (user) {
        grantAccess(user);
      } else {
        lockAccess();
      }
    });
    window.netlifyIdentity.on("login", user => {
      grantAccess(user);
      window.netlifyIdentity.close();
      showToast(`Acceso concedido: ${user.user_metadata?.full_name || user.email}`);
    });
    window.netlifyIdentity.on("logout", () => {
      lockAccess();
      showToast("Sesión cerrada");
    });
  }
}

function openLoginModal() {
  if (window.netlifyIdentity) {
    window.netlifyIdentity.open();
  } else {
    alert("El servicio de autenticación no está disponible sin conexión.");
  }
}

function logoutAdmin() {
  if (window.netlifyIdentity) {
    window.netlifyIdentity.logout();
  }
  lockAccess();
}

function grantAccess(user) {
  document.getElementById("lockScreen").style.display = "none";
  const app = document.getElementById("adminApp");
  app.style.display = "flex";
  document.getElementById("userStatus").textContent = user.email || "Administrador";
  loadData();
}

function lockAccess() {
  document.getElementById("lockScreen").style.display = "flex";
  document.getElementById("adminApp").style.display = "none";
  fotos = [];
  initialFotos = [];
  videos = [];
  initialVideos = [];
  sobreMi = {};
  initialSobreMi = {};
}

/* CAMBIO DE SECCIÓN (TABS) */
function switchSection(sec) {
  currentSection = sec;
  document.querySelectorAll(".admin-tab-btn").forEach(btn => btn.classList.remove("active"));
  if (sec === 'fotos') document.getElementById("tabBtnFotos")?.classList.add("active");
  if (sec === 'videos') document.getElementById("tabBtnVideos")?.classList.add("active");
  if (sec === 'sobreMi') document.getElementById("tabBtnSobreMi")?.classList.add("active");

  document.getElementById("sectionFotos").style.display = sec === 'fotos' ? 'block' : 'none';
  document.getElementById("sectionVideos").style.display = sec === 'videos' ? 'block' : 'none';
  document.getElementById("sectionSobreMi").style.display = sec === 'sobreMi' ? 'block' : 'none';
}

/* CARGA DE DATOS */
async function loadData() {
  try {
    const res = await fetch("../data/galeria.json?t=" + Date.now());
    if (res.ok) {
      const data = await res.json();
      fotos = data.fotos || [];
      initialFotos = JSON.parse(JSON.stringify(fotos));

      videos = data.videos || [];
      initialVideos = JSON.parse(JSON.stringify(videos));

      sobreMi = data.sobreMi || {};
      initialSobreMi = JSON.parse(JSON.stringify(sobreMi));

      renderGrid();
      renderVideos();
      renderSobreMi();
      updateBadges();
    }
  } catch (err) {
    console.warn("Carga desde galeria.json falló:", err);
  }
}

function updateBadges() {
  const badgeFotos = document.getElementById("countFotosBadge");
  if (badgeFotos) badgeFotos.textContent = fotos.length;

  const badgeVideos = document.getElementById("countVideosBadge");
  if (badgeVideos) badgeVideos.textContent = videos.length;
}

/* --------------------------------------------------------------------------
   GESTIÓN DE FOTOGRAFÍAS
   -------------------------------------------------------------------------- */
function renderGrid() {
  const grid = document.getElementById("photosGrid");
  const counter = document.getElementById("counterLabel");
  const filtered = currentFilter === 'all' ? fotos : fotos.filter(f => f.categoria === currentFilter);

  counter.textContent = `${fotos.length} fotografías en total (${filtered.length} visibles)`;
  updateBadges();

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 4rem 2rem; text-align: center; color: var(--text-muted); background: var(--bg-card); border: 1px dashed var(--border); border-radius: var(--radius);">
        <p style="font-size: 1.1rem; margin-bottom: 0.5rem; font-family: var(--font-serif);">No hay fotografías en esta categoría</p>
        <p style="font-size: 0.85rem;">Haz clic en <strong>+ Añadir Fotografía</strong> para agregar la primera.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((foto) => {
    const realIndex = fotos.indexOf(foto);
    const catLabel = (foto.categoria || "General").charAt(0).toUpperCase() + (foto.categoria || "General").slice(1);
    const isFirst = realIndex === 0;
    const isLast = realIndex === fotos.length - 1;

    return `
      <div class="photo-card" data-index="${realIndex}">
        <div class="photo-thumb-wrapper">
          <img src="${foto.imagen}" alt="${foto.titulo}" class="photo-thumb" loading="lazy">
          <div class="photo-badges">
            <span class="badge-cat">${catLabel}</span>
            ${foto.destacada ? '<span class="badge-featured">★ Portada</span>' : ''}
          </div>
          <span class="photo-order-badge">#${realIndex + 1}</span>
        </div>
        <div class="photo-info">
          <h4 class="photo-title">${foto.titulo}</h4>
          <p class="photo-gear">${foto.equipo || 'Sin ficha de lente especificada'}</p>
          <div class="photo-card-actions">
            <div class="order-btns">
              <button class="btn-icon" title="Mover antes" onclick="movePhoto(${realIndex}, -1)" ${isFirst ? 'disabled' : ''}>&uarr;</button>
              <button class="btn-icon" title="Mover después" onclick="movePhoto(${realIndex}, 1)" ${isLast ? 'disabled' : ''}>&darr;</button>
            </div>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-outline" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;" onclick="openEditModal(${realIndex})">
                Editar
              </button>
              <button class="btn-danger-outline" title="Eliminar foto" onclick="deletePhoto(${realIndex})">
                &times;
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  checkChanges();
}

function filterGallery(cat) {
  currentFilter = cat;
  document.querySelectorAll(".filter-pill").forEach(p => {
    p.classList.toggle("active", p.getAttribute("data-filter") === cat);
  });
  renderGrid();
}

function movePhoto(index, delta) {
  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= fotos.length) return;
  const [item] = fotos.splice(index, 1);
  fotos.splice(newIndex, 0, item);
  renderGrid();
}

function deletePhoto(index) {
  const item = fotos[index];
  if (confirm(`¿Estás seguro de retirar la fotografía "${item.titulo}" del catálogo?`)) {
    fotos.splice(index, 1);
    renderGrid();
    showToast("Fotografía eliminada del catálogo");
  }
}

function openAddModal() {
  editingIndex = -1;
  document.getElementById("modalTitle").textContent = "Añadir Fotografía";
  document.getElementById("titleInput").value = "";
  document.getElementById("gearInput").value = "";
  document.getElementById("urlInput").value = "";
  document.getElementById("destacadaInput").checked = false;
  document.getElementById("fileInput").value = "";
  currentImageData = "";
  currentUploadFile = null;
  selectCat("gastronomia");

  const preview = document.getElementById("previewImg");
  preview.src = "";
  preview.classList.remove("active");
  document.getElementById("dropzonePrompt").style.display = "block";

  document.getElementById("photoModal").classList.add("active");
}

function openEditModal(index) {
  editingIndex = index;
  const item = fotos[index];
  document.getElementById("modalTitle").textContent = "Editar Fotografía";
  document.getElementById("titleInput").value = item.titulo || "";
  document.getElementById("gearInput").value = item.equipo || "";
  document.getElementById("urlInput").value = item.imagen.startsWith("http") ? item.imagen : "";
  document.getElementById("destacadaInput").checked = Boolean(item.destacada);
  document.getElementById("fileInput").value = "";
  currentImageData = item.imagen;
  currentUploadFile = null;
  selectCat(item.categoria || "gastronomia");

  const preview = document.getElementById("previewImg");
  preview.src = item.imagen;
  preview.classList.add("active");
  document.getElementById("dropzonePrompt").style.display = "none";

  document.getElementById("photoModal").classList.add("active");
}

function closeModal() {
  document.getElementById("photoModal").classList.remove("active");
}

function selectCat(cat) {
  selectedCategory = cat;
  document.querySelectorAll(".cat-chip").forEach(chip => {
    chip.classList.toggle("selected", chip.getAttribute("data-cat") === cat);
  });
}

function handleFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    currentImageData = event.target.result;
    currentUploadFile = file;
    const preview = document.getElementById("previewImg");
    preview.src = currentImageData;
    preview.classList.add("active");
    document.getElementById("dropzonePrompt").style.display = "none";
  };
  reader.readAsDataURL(file);
}

function handleUrlInput(e) {
  const url = e.target.value.trim();
  if (url) {
    currentImageData = url;
    currentUploadFile = null;
    const preview = document.getElementById("previewImg");
    preview.src = url;
    preview.classList.add("active");
    document.getElementById("dropzonePrompt").style.display = "none";
  }
}

function savePhotoForm() {
  const titulo = document.getElementById("titleInput").value.trim() || "Fotografía sin título";
  const equipo = document.getElementById("gearInput").value.trim();
  const destacada = document.getElementById("destacadaInput").checked;

  if (!currentImageData) {
    alert("Por favor selecciona una imagen para la fotografía.");
    return;
  }

  const fotoObj = {
    titulo,
    categoria: selectedCategory,
    imagen: currentImageData,
    equipo,
    destacada
  };

  if (editingIndex >= 0) {
    fotos[editingIndex] = fotoObj;
    if (currentUploadFile) pendingUploads.set(editingIndex, { file: currentUploadFile, base64: currentImageData });
    showToast("Fotografía actualizada");
  } else {
    fotos.unshift(fotoObj);
    if (currentUploadFile) pendingUploads.set(0, { file: currentUploadFile, base64: currentImageData });
    showToast("Fotografía agregada a la colección");
  }

  closeModal();
  renderGrid();
}

/* --------------------------------------------------------------------------
   GESTIÓN DE VIDEOS
   -------------------------------------------------------------------------- */
function renderVideos() {
  const grid = document.getElementById("videosAdminGrid");
  if (!grid) return;
  updateBadges();

  if (!videos || videos.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 4rem 2rem; text-align: center; color: var(--text-muted); background: var(--bg-card); border: 1px dashed var(--border); border-radius: var(--radius);">
        <p style="font-size: 1.1rem; margin-bottom: 0.5rem; font-family: var(--font-serif);">No hay videos registrados</p>
        <p style="font-size: 0.85rem;">Haz clic en <strong>+ Añadir Video</strong> para agregar el primero.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = videos.map((v, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === videos.length - 1;
    const poster = v.poster || "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80";

    return `
      <div class="video-admin-card" data-video-index="${idx}">
        <div class="video-admin-thumb-wrapper">
          <img src="${poster}" alt="${v.titulo}" class="video-admin-thumb" loading="lazy">
          <div class="video-play-indicator">&#9658;</div>
        </div>
        <div class="video-admin-info">
          <span class="video-admin-tag">${v.tag || 'Video'}</span>
          <h4 class="video-admin-title">${v.titulo}</h4>
          <p class="video-admin-desc">${v.descripcion || ''}</p>
          <div class="photo-card-actions" style="margin-top: 0.75rem;">
            <div class="order-btns">
              <button class="btn-icon" title="Mover antes" onclick="moveVideo(${idx}, -1)" ${isFirst ? 'disabled' : ''}>&uarr;</button>
              <button class="btn-icon" title="Mover después" onclick="moveVideo(${idx}, 1)" ${isLast ? 'disabled' : ''}>&darr;</button>
            </div>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-outline" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;" onclick="openEditVideoModal(${idx})">
                Editar
              </button>
              <button class="btn-danger-outline" title="Eliminar video" onclick="deleteVideo(${idx})">
                &times;
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  checkChanges();
}

function moveVideo(index, delta) {
  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= videos.length) return;
  const [item] = videos.splice(index, 1);
  videos.splice(newIndex, 0, item);
  renderVideos();
}

function deleteVideo(index) {
  const item = videos[index];
  if (confirm(`¿Estás seguro de eliminar el video "${item.titulo}"?`)) {
    videos.splice(index, 1);
    renderVideos();
    showToast("Video retirado del catálogo");
  }
}

function openAddVideoModal() {
  editingVideoIndex = -1;
  document.getElementById("videoModalTitle").textContent = "Añadir Video";
  document.getElementById("videoTitleInput").value = "";
  document.getElementById("videoTagInput").value = "";
  document.getElementById("videoUrlInput").value = "";
  document.getElementById("videoPosterInput").value = "";
  document.getElementById("videoDescInput").value = "";
  document.getElementById("videoModal").classList.add("active");
}

function openEditVideoModal(index) {
  editingVideoIndex = index;
  const item = videos[index];
  document.getElementById("videoModalTitle").textContent = "Editar Video";
  document.getElementById("videoTitleInput").value = item.titulo || "";
  document.getElementById("videoTagInput").value = item.tag || "";
  document.getElementById("videoUrlInput").value = item.video || "";
  document.getElementById("videoPosterInput").value = item.poster || "";
  document.getElementById("videoDescInput").value = item.descripcion || "";
  document.getElementById("videoModal").classList.add("active");
}

function closeVideoModal() {
  document.getElementById("videoModal").classList.remove("active");
}

function saveVideoForm() {
  const titulo = document.getElementById("videoTitleInput").value.trim() || "Video sin título";
  const tag = document.getElementById("videoTagInput").value.trim();
  const video = document.getElementById("videoUrlInput").value.trim();
  const poster = document.getElementById("videoPosterInput").value.trim();
  const descripcion = document.getElementById("videoDescInput").value.trim();

  if (!video) {
    alert("Por favor ingresa la URL del video (MP4, YouTube o Vimeo).");
    return;
  }

  const videoObj = {
    titulo,
    tag: tag || "Producción Audiovisual",
    video,
    poster: poster || "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80",
    descripcion
  };

  if (editingVideoIndex >= 0) {
    videos[editingVideoIndex] = videoObj;
    showToast("Video actualizado");
  } else {
    videos.unshift(videoObj);
    showToast("Video agregado a la colección");
  }

  closeVideoModal();
  renderVideos();
}

/* --------------------------------------------------------------------------
   GESTIÓN DE SOBRE MÍ
   -------------------------------------------------------------------------- */
function renderSobreMi() {
  if (!sobreMi) return;
  document.getElementById("smFrase").value = sobreMi.frase || "";
  document.getElementById("smFoto").value = sobreMi.foto || "";
  updateSmFotoPreview(sobreMi.foto || "");
  document.getElementById("smLead").value = sobreMi.lead || "";
  document.getElementById("smBio").value = sobreMi.bio || "";

  if (Array.isArray(sobreMi.stats)) {
    if (sobreMi.stats[0]) {
      document.getElementById("smStatVal0").value = sobreMi.stats[0].valor || "";
      document.getElementById("smStatLbl0").value = sobreMi.stats[0].label || "";
    }
    if (sobreMi.stats[1]) {
      document.getElementById("smStatVal1").value = sobreMi.stats[1].valor || "";
      document.getElementById("smStatLbl1").value = sobreMi.stats[1].label || "";
    }
    if (sobreMi.stats[2]) {
      document.getElementById("smStatVal2").value = sobreMi.stats[2].valor || "";
      document.getElementById("smStatLbl2").value = sobreMi.stats[2].label || "";
    }
  }

  document.getElementById("smClientes").value = sobreMi.clientes || "";
}

function updateSmFotoPreview(url) {
  const prev = document.getElementById("smFotoPreview");
  if (prev) {
    prev.src = url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";
  }
}

function handleSmFotoFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const base64 = event.target.result;
    pendingSmFoto = { file, base64 };
    updateSmFotoPreview(base64);
    markSobreMiChanged();
  };
  reader.readAsDataURL(file);
}

function markSobreMiChanged() {
  sobreMi = {
    frase: document.getElementById("smFrase").value,
    foto: pendingSmFoto ? pendingSmFoto.base64 : document.getElementById("smFoto").value,
    lead: document.getElementById("smLead").value,
    bio: document.getElementById("smBio").value,
    stats: [
      { valor: document.getElementById("smStatVal0").value, label: document.getElementById("smStatLbl0").value },
      { valor: document.getElementById("smStatVal1").value, label: document.getElementById("smStatLbl1").value },
      { valor: document.getElementById("smStatVal2").value, label: document.getElementById("smStatLbl2").value }
    ],
    clientes: document.getElementById("smClientes").value
  };
  checkChanges();
}

/* --------------------------------------------------------------------------
   COMPROBAR SI HAY CAMBIOS & PUBLICAR
   -------------------------------------------------------------------------- */
function checkChanges() {
  const saveBar = document.getElementById("saveBar");
  const stateCurrent = JSON.stringify({ fotos, videos, sobreMi });
  const stateInitial = JSON.stringify({ fotos: initialFotos, videos: initialVideos, sobreMi: initialSobreMi });
  hasChanges = stateCurrent !== stateInitial || pendingUploads.size > 0 || pendingSmFoto !== null;
  saveBar.classList.toggle("visible", hasChanges);
}

function revertChanges() {
  if (confirm("¿Descartar todos los cambios no publicados?")) {
    fotos = JSON.parse(JSON.stringify(initialFotos));
    videos = JSON.parse(JSON.stringify(initialVideos));
    sobreMi = JSON.parse(JSON.stringify(initialSobreMi));
    pendingUploads.clear();
    pendingSmFoto = null;
    renderGrid();
    renderVideos();
    renderSobreMi();
    checkChanges();
    showToast("Cambios descartados");
  }
}

/* PUBLICAR EN NETLIFY / GITHUB */
async function publishChanges() {
  const btn = document.getElementById("publishBtn");
  const user = window.netlifyIdentity ? window.netlifyIdentity.currentUser() : null;

  btn.disabled = true;
  btn.textContent = "Publicando...";

  try {
    if (!user) {
      throw new Error("No hay una sesión activa de administrador.");
    }

    const token = await user.jwt();
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    // 1. Subir imágenes nuevas de fotos
    for (const [idx, item] of pendingUploads.entries()) {
      const cleanName = `${Date.now()}-${item.file.name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase()}`;
      const base64Data = item.base64.split(",")[1];

      const uploadRes = await fetch(`/.netlify/git/github/contents/assets/fotos/${cleanName}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `Subida de foto: ${cleanName}`,
          content: base64Data,
          branch: "main"
        })
      });

      if (uploadRes.ok) {
        fotos[idx].imagen = `assets/fotos/${cleanName}`;
      }
    }
    pendingUploads.clear();

    // 2. Subir foto de perfil si se cargó un archivo nuevo
    if (pendingSmFoto) {
      const cleanName = `perfil-${Date.now()}-${pendingSmFoto.file.name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase()}`;
      const base64Data = pendingSmFoto.base64.split(",")[1];

      const uploadRes = await fetch(`/.netlify/git/github/contents/assets/fotos/${cleanName}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `Subida foto perfil: ${cleanName}`,
          content: base64Data,
          branch: "main"
        })
      });

      if (uploadRes.ok) {
        sobreMi.foto = `assets/fotos/${cleanName}`;
      }
      pendingSmFoto = null;
    }

    // 3. Obtener SHA actual de galeria.json
    const getShaRes = await fetch("/.netlify/git/github/contents/data/galeria.json", { headers });
    let currentSha = null;
    if (getShaRes.ok) {
      const shaData = await getShaRes.json();
      currentSha = shaData.sha;
    }

    // 4. Commit del JSON completo con fotos, videos y sobreMi
    const payload = { fotos, videos, sobreMi };
    const jsonString = JSON.stringify(payload, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(jsonString)));

    const commitBody = {
      message: `Actualizar catálogo web: ${fotos.length} fotos, ${videos.length} videos y biografía`,
      content: encodedContent,
      branch: "main"
    };
    if (currentSha) commitBody.sha = currentSha;

    const putRes = await fetch("/.netlify/git/github/contents/data/galeria.json", {
      method: "PUT",
      headers,
      body: JSON.stringify(commitBody)
    });

    if (!putRes.ok) {
      throw new Error("Error al publicar en GitHub a través de Netlify Git Gateway.");
    }

    initialFotos = JSON.parse(JSON.stringify(fotos));
    initialVideos = JSON.parse(JSON.stringify(videos));
    initialSobreMi = JSON.parse(JSON.stringify(sobreMi));
    checkChanges();
    showToast("✓ ¡Cambios publicados con éxito! La web se actualizará en unos instantes.");
  } catch (err) {
    console.error(err);
    alert("Error de publicación: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Publicar en la Web →";
  }
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 3800);
}
