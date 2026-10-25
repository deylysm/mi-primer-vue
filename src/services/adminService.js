// src/services/adminService.js
// Para qué sirve: las llamadas a la API del panel de administración: listar, crear, editar y borrar
// medicamentos y farmacias. Crear/editar/borrar necesitan sesión (token); listar es público.
// Quién lo usa: src/views/AdminView.vue (nadie más).
// Imports:
//   - './api.js': archivo local (misma carpeta). `pedir` = GET público.
//   - '@/composables/useSesion.js': archivo local con el alias @ (apunta a src/).
//     `peticionProtegida` añade el token solo y cierra la sesión si la API responde 401.
import { pedir } from './api.js'
import { peticionProtegida } from '@/composables/useSesion.js'

// ---- Medicamentos ----
export const listarMedicamentosAdmin = () => pedir('/medicamentos')

export const crearMedicamento = (datos) =>
  peticionProtegida('/medicamentos', { method: 'POST', body: datos })

export const editarMedicamento = (id, datos) =>
  peticionProtegida(`/medicamentos/${id}`, { method: 'PUT', body: datos })

export const borrarMedicamento = (id) =>
  peticionProtegida(`/medicamentos/${id}`, { method: 'DELETE' })

// ---- Farmacias ----
export const listarFarmaciasAdmin = () => pedir('/farmacias')

export const crearFarmacia = (datos) =>
  peticionProtegida('/farmacias', { method: 'POST', body: datos })

export const editarFarmacia = (id, datos) =>
  peticionProtegida(`/farmacias/${id}`, { method: 'PUT', body: datos })

export const borrarFarmacia = (id) =>
  peticionProtegida(`/farmacias/${id}`, { method: 'DELETE' })
