/* ESTADO DE LA APLICACIÓN */
let fotos = [];
let initialFotos = [];
let currentFilter = 'all';
let editingIndex = -1;
let selectedCategory = 'gastronomia';
let currentImageData = '';
let currentUploadFile = null;
let pendingUploads = new Map();
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
  loadFotosData();
}

function lockAccess() {
  document.getElementById("lockScreen").style.display = "flex";
  document.getElementById("adminApp").style.display = "none";
  fotos = [];
  initialFotos = [];
}

/* CARGA DE DATOS */
async function loadFotosData() {
  try {
    const res = await fetch("../data/galeria.json?t=" + Date.now());
    if (res.ok) {
      const data = await res.json();
      fotos = data.fotos || [];
      initialFotos = JSON.parse(JSON.stringify(fotos));
      renderGrid();
    }
  } catch (err) {
    console.warn("Carga desde galeria.json falló:", err);
  }
}

/* RENDERIZADO DEL GRID */
function renderGrid() {
  const grid = document.getElementById("photosGrid");
  const counter = document.getElementById("counterLabel");
  const filtered = currentFilter === 'all' ? fotos : fotos.filter(f => f.categoria === currentFilter);

  counter.textContent = `${fotos.length} fotografías en total (${filtered.length} visibles)`;

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

/* FILTROS */
function filterGallery(cat) {
  currentFilter = cat;
  document.querySelectorAll(".filter-pill").forEach(p => {
    p.classList.toggle("active", p.getAttribute("data-filter") === cat);
  });
  renderGrid();
}

/* REORDENAR FOTO */
function movePhoto(index, delta) {
  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= fotos.length) return;
  const [item] = fotos.splice(index, 1);
  fotos.splice(newIndex, 0, item);
  renderGrid();
}

/* ELIMINAR FOTO */
function deletePhoto(index) {
  const item = fotos[index];
  if (confirm(`¿Estás seguro de retirar la fotografía "${item.titulo}" del catálogo?`)) {
    fotos.splice(index, 1);
    renderGrid();
    showToast("Fotografía eliminada del catálogo");
  }
}

/* MODAL AGREGAR / EDITAR */
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

/* COMPROBAR SI HAY CAMBIOS */
function checkChanges() {
  const saveBar = document.getElementById("saveBar");
  hasChanges = JSON.stringify(fotos) !== JSON.stringify(initialFotos);
  saveBar.classList.toggle("visible", hasChanges);
}

function revertChanges() {
  if (confirm("¿Descartar todos los cambios no publicados?")) {
    fotos = JSON.parse(JSON.stringify(initialFotos));
    pendingUploads.clear();
    renderGrid();
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

    // 1. Subir imágenes nuevas como archivos en assets/fotos
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

    // 2. Obtener SHA actual de galeria.json
    const getShaRes = await fetch("/.netlify/git/github/contents/data/galeria.json", { headers });
    let currentSha = null;
    if (getShaRes.ok) {
      const shaData = await getShaRes.json();
      currentSha = shaData.sha;
    }

    // 3. Commit del JSON
    const jsonString = JSON.stringify({ fotos }, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(jsonString)));

    const commitBody = {
      message: `Actualizar galería de fotos (${fotos.length} piezas)`,
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
    checkChanges();
    showToast("✓ ¡Galería publicada con éxito! La web se actualizará en unos instantes.");
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
