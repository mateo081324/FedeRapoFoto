# Guía de Entrega: Gestión Autónoma para el Fotógrafo

Con este sistema, **el fotógrafo gestiona sus fotos de forma 100% visual desde el navegador**, sin tocar código y sin que vos tengas que mantener ningún servidor o base de datos ($0 de costo para siempre).

---

## 1. Configuración inicial (Solo la haces vos una vez - 3 minutos)

1. **Subí este proyecto a Netlify:**
   - Podés vincular tu repositorio de GitHub en [Netlify.com](https://www.netlify.com/) (o arrastrar la carpeta).

2. **Activá Netlify Identity (Autenticación):**
   - En el panel de tu sitio en Netlify, andá a **Site configuration** > **Identity** y hacé clic en **Enable Identity**.
   - En **Registration preferences**, dejalo en **Invite only** (para que nadie desconocido se pueda registrar).

3. **Activá Git Gateway:**
   - En esa misma sección de Identity, bajá hasta **Services** > **Git Gateway** y hacé clic en **Enable Git Gateway**. (Esto le da permiso al panel de administración para guardar fotos en el repositorio).

4. **Invitá al fotógrafo:**
   - Andá a la pestaña **Identity** en Netlify y hacé clic en **Invite users**.
   - Ingresá el correo electrónico del fotógrafo.

---

## 2. Lo que hace el fotógrafo (El instructivo que le entregás)

1. El fotógrafo recibe un correo con el asunto *"You have been invited"*.
2. Hace clic en el enlace, define su contraseña personal.
3. Entra a: `https://tudominio.com/admin/` (o hace clic en el enlace discreto *"Gestión"* al pie de la página).
4. **En el panel podrá gestionar todo desde 3 pestañas:**
   - **📷 Fotografías:** Subir fotos nuevas (arrastrar o URL), editar ficha técnica/equipo, marcar para Portada, reordenar y eliminar.
   - **🎬 Videos:** Agregar enlaces de video (MP4, YouTube o Vimeo), definir título, género/etiqueta, imagen de póster y descripción del rodaje.
   - **👤 Sobre Mí:** Actualizar su frase/manifiesto, foto de perfil, párrafos biográficos, métricas de experiencia y marcas/clientes.
   - Presionar **"Publicar en la Web"** y los cambios se sincronizan en todo el sitio en segundos.

Listo: una vez configurado esto, **te olvidás de la página por completo**.
