# 📘 Guía de Desarrollo - ServirepoApp

## 🧩 Descripción general

ServirepoApp es una aplicación web pensada para visualizar y consultar marcaciones de entrada y salida realizadas por repositores de una empresa. La información proviene de una app externa que maneja los registros. Esta herramienta servirá como panel de control para supervisores y como historial de marcaciones por usuario y fecha.

---

## 🎯 Objetivos principales

- Visualizar las marcaciones de entrada/salida.
- Consultar ubicación (geolocalización) al momento de marcar.
- Consultar datos del repositor (medio de transporte, supervisor).
- Filtrar registros por fecha y por usuario.
- Visualizar supervisores y su personal asignado.
- La app solo visualiza datos: no permite modificaciones.
- Descargar registros en Excel (opcional/mejor caso).

---

## 🔐 Roles

- **Repositor**: ve únicamente sus propias marcaciones.
- **Supervisor**: puede ver sus propias marcaciones y las de sus repositores asignados.

---

## 🌐 API disponible

Base URL: `https://cloud01.browix.com`  
Token: `5632674a4257a67218c812191c3efd81`

Endpoints disponibles:

- Obtener todos los usuarios:  
  `/v1/externalpermissions/getUsers/uuid:{{clientToken}}/limit:200/page:1`

- Obtener usuario por código externo:  
  `/v1/externalpermissions/getUsers/uuid:{{clientToken}}/{{externalCode}}`

- Obtener marcaciones por DNI y rango de fechas:  
  `/v1/externalpermissions/getIntervalsInDateRange/uuid:{{clientToken}}/{{fromDate}}/{{toDate}}/{{userDNI}}`

- Si `lat` y `long` son `null`, se interpreta como una marcación inválida o sin GPS.

---

## 🖥️ Diseño de la interfaz

Aplicación minimalista, desarrollada con **React** y **Tailwind CSS**.

### Vistas:
1. **Login**
2. **Página índice**:
   - Listado de todos los supervisores (buscador incluido)
3. **Página de supervisor**:
   - Sus propias marcaciones
   - Listado de los repositores que tiene a cargo
4. **Página de repositor**:
   - Misma estructura que la del supervisor, pero solo con su historial

---

## 🧱 Estado y estructura

- No hay estructura inicial en GitHub aún.
- Se usará React (o HTML Vanilla si se desea simplificar).
- No se implementará resumen diario guardado; se generará dinámicamente si se requiere.
- No se requiere aún un manejador de estado como Redux o Zustand. Se puede comenzar con **Context API** si hiciera falta compartir datos entre componentes.

---

## 🔐 Login

- No está implementado aún.
- Sugerencia inicial: autenticación simple con backend propio, usando JWT o sesión con verificación por usuario/clave.
- Alternativamente, si la app externa ofrece validación, se puede conectar con sus tokens.

---

## ✅ Observaciones

- Todos los datos mostrados provienen de la app externa.
- No se gestionan registros ni validaciones dentro de esta app.
- Se puede exportar a Excel en el mejor de los casos como funcionalidad adicional.
