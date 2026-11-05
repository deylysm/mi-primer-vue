// Datos de prueba (mock) de medicamentos. Cada uno trae su inventario por farmacia
// (farmaciaId apunta al id de farmacias.mock.js) y su `categoria` (id de categorias.mock.js).
// `marca` = laboratorio/marca del producto (se usa en la tarjeta y en el filtro "Marca").
// `imagen` = URL de la imagen del producto (como la daría una API real). Aquí son fotos (CC0 / dominio
// público, de Wikimedia Commons) de la carpeta public/medicamentos/ (Vite sirve public/ en la raíz:
// /medicamentos/<slug>.jpg). Loratadina y suero oral no tienen foto libre y usan un SVG. Es opcional: si
// un medicamento no la trae o la imagen falla, se muestra el dibujo de su categoría.
// Algunas ofertas del inventario traen `precioAnterior` (precio antes de la oferta, siempre
// mayor que `precio`): la tarjeta lo tacha y calcula el % de descuento.
// Precios en soles (S/).
export const medicamentos = [
  {
    id: 1, imagen: '/medicamentos/ibuprofeno-400.jpg', nombre: 'Ibuprofeno 400 mg', marca: 'Genfar', principioActivo: 'Ibuprofeno', presentacion: 'Caja x 20 tabletas', requiereReceta: false, categoria: 'antiinflamatorio',
    inventario: [
      { farmaciaId: 1, precio: 8.5, precioAnterior: 10.0, stock: 40 },
      { farmaciaId: 2, precio: 7.9, precioAnterior: 13.2, stock: 12 },
      { farmaciaId: 3, precio: 9.2, stock: 3 },
      { farmaciaId: 4, precio: 8.0, stock: 0 },
    ],
  },
  {
    id: 2, imagen: '/medicamentos/acido-acetilsalicilico-100.jpg', nombre: 'Ácido acetilsalicílico 100 mg', marca: 'Bayer', principioActivo: 'Ácido acetilsalicílico', presentacion: 'Caja x 30 tabletas', requiereReceta: false, categoria: 'cardiovascular',
    inventario: [
      { farmaciaId: 1, precio: 6.0, stock: 25 },
      { farmaciaId: 3, precio: 5.5, precioAnterior: 6.5, stock: 18 },
    ],
  },
  {
    id: 3, imagen: '/medicamentos/paracetamol-500.jpg', nombre: 'Paracetamol 500 mg', marca: 'MK', principioActivo: 'Paracetamol', presentacion: 'Caja x 100 tabletas', requiereReceta: false, categoria: 'analgesico',
    inventario: [
      { farmaciaId: 1, precio: 12.0, stock: 60 },
      { farmaciaId: 2, precio: 10.5, precioAnterior: 14.0, stock: 35 },
      { farmaciaId: 4, precio: 11.0, stock: 5 },
    ],
  },
  {
    id: 4, imagen: '/medicamentos/amoxicilina-500.jpg', nombre: 'Amoxicilina 500 mg', marca: 'Medifarma', principioActivo: 'Amoxicilina', presentacion: 'Caja x 21 cápsulas', requiereReceta: true, categoria: 'antibiotico',
    inventario: [
      { farmaciaId: 2, precio: 18.9, precioAnterior: 24.0, stock: 10 },
      { farmaciaId: 3, precio: 20.0, stock: 2 },
    ],
  },
  {
    id: 5, imagen: '/medicamentos/loratadina-10.svg', nombre: 'Loratadina 10 mg', marca: 'Genfar', principioActivo: 'Loratadina', presentacion: 'Caja x 10 tabletas', requiereReceta: false, categoria: 'antialergico',
    inventario: [
      { farmaciaId: 1, precio: 4.5, stock: 50 },
      { farmaciaId: 4, precio: 4.2, precioAnterior: 7.0, stock: 20 },
    ],
  },
  {
    id: 6, imagen: '/medicamentos/omeprazol-20.jpg', nombre: 'Omeprazol 20 mg', marca: 'MK', principioActivo: 'Omeprazol', presentacion: 'Caja x 14 cápsulas', requiereReceta: false, categoria: 'gastrico',
    inventario: [
      { farmaciaId: 2, precio: 9.9, stock: 0 },
      { farmaciaId: 3, precio: 10.5, stock: 8 },
    ],
  },
  {
    id: 7, imagen: '/medicamentos/diclofenaco-50.jpg', nombre: 'Diclofenaco 50 mg', marca: 'Medifarma', principioActivo: 'Diclofenaco sódico', presentacion: 'Caja x 20 grageas', requiereReceta: false, categoria: 'antiinflamatorio',
    inventario: [
      { farmaciaId: 1, precio: 7.0, stock: 1 },
      { farmaciaId: 4, precio: 6.5, precioAnterior: 10.8, stock: 15 },
    ],
  },
  {
    id: 8, imagen: '/medicamentos/metformina-850.jpg', nombre: 'Metformina 850 mg', marca: 'Teva', principioActivo: 'Metformina', presentacion: 'Caja x 60 tabletas', requiereReceta: true, categoria: 'antidiabetico',
    inventario: [
      { farmaciaId: 1, precio: 15.0, stock: 22 },
      { farmaciaId: 2, precio: 14.2, stock: 9 },
    ],
  },
  {
    id: 9, imagen: '/medicamentos/losartan-50.jpg', nombre: 'Losartán 50 mg', marca: 'MK', principioActivo: 'Losartán potásico', presentacion: 'Caja x 30 tabletas', requiereReceta: true, categoria: 'cardiovascular',
    inventario: [
      { farmaciaId: 3, precio: 16.8, precioAnterior: 21.0, stock: 14 },
      { farmaciaId: 4, precio: 17.5, stock: 4 },
    ],
  },
  {
    id: 10, imagen: '/medicamentos/jarabe-tos-nandu-miel.jpg', nombre: 'Jarabe para la tos de ñandú y miel', marca: 'Bayer', principioActivo: 'Dextrometorfano', presentacion: 'Frasco 120 ml', requiereReceta: false, categoria: 'respiratorio',
    inventario: [
      { farmaciaId: 2, precio: 13.5, stock: 7 },
    ],
  },
  {
    id: 11, imagen: '/medicamentos/vitamina-c-1g.jpg', nombre: 'Vitamina C 1 g', marca: 'Naturvita', principioActivo: 'Ácido ascórbico', presentacion: 'Tubo x 10 efervescentes', requiereReceta: false, categoria: 'vitaminas',
    inventario: [
      { farmaciaId: 1, precio: 11.0, stock: 30 },
      { farmaciaId: 3, precio: 10.0, precioAnterior: 12.5, stock: 16 },
      { farmaciaId: 4, precio: 12.5, stock: 6 },
    ],
  },
  {
    id: 12, imagen: '/medicamentos/salbutamol-inhalador.jpg', nombre: 'Salbutamol inhalador 100 mcg', marca: 'Teva', principioActivo: 'Salbutamol', presentacion: 'Inhalador 200 dosis', requiereReceta: true, categoria: 'respiratorio',
    inventario: [
      { farmaciaId: 1, precio: 22.0, stock: 0 },
      { farmaciaId: 2, precio: 21.5, stock: 0 },
    ],
  },
  {
    id: 13, imagen: '/medicamentos/naproxeno-550.jpg', nombre: 'Naproxeno 550 mg', marca: 'Genfar', principioActivo: 'Naproxeno sódico', presentacion: 'Caja x 10 tabletas', requiereReceta: false, categoria: 'antiinflamatorio',
    inventario: [
      { farmaciaId: 2, precio: 9.0, stock: 11 },
      { farmaciaId: 4, precio: 8.7, precioAnterior: 11.6, stock: 2 },
    ],
  },
  {
    id: 14, imagen: '/medicamentos/suero-oral-naranja.svg', nombre: 'Suero de rehidratación oral sabor naranja', marca: 'Medifarma', principioActivo: 'Sales de rehidratación oral', presentacion: 'Sobre x 27.9 g', requiereReceta: false, categoria: 'hidratacion',
    inventario: [
      { farmaciaId: 1, precio: 2.5, stock: 100 },
      { farmaciaId: 3, precio: 2.8, stock: 45 },
    ],
  },
  {
    // Nombre muy largo a propósito, para probar cómo se ve en la interfaz.
    id: 15,
    imagen: '/medicamentos/multivitaminico-adultos-50.jpg',
    nombre: 'Complejo multivitamínico y multimineral con hierro, zinc, calcio, magnesio y vitamina D3 para adultos mayores de cincuenta años',
    marca: 'Naturvita',
    principioActivo: 'Multivitaminas y minerales',
    presentacion: 'Frasco x 120 tabletas recubiertas',
    requiereReceta: false,
    categoria: 'vitaminas',
    inventario: [
      { farmaciaId: 3, precio: 59.9, precioAnterior: 99.8, stock: 5 },
      { farmaciaId: 4, precio: 62.0, stock: 9 },
    ],
  },
]
