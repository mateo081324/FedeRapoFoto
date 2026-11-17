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
4. **En el panel podrá:**
   - **Subir fotos nuevas:** Arrastra la imagen desde su computadora o celular.
   - **Modificar datos:** Cambiar título, categoría (Gastronomía, Moda, Paisaje, Eventos) y cámara/lente.
   - **Elegir destacadas:** Marcar la casilla *"¿Mostrar en Portada?"* para las fotos que quiere que aparezcan en el Inicio.
   - **Reordenar:** Arrastrar las fotos hacia arriba o abajo para cambiar el orden en que se muestran.
   - **Eliminar fotos** que ya no quiera mostrar.
   - Presionar **"Guardar"** y los cambios se publican solos en la web en cuestión de segundos.

Listo: una vez configurado esto, **te olvidás de la página por completo**.
