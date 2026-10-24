// Datos de prueba (mock) de medicamentos. Cada uno trae su inventario por farmacia
// (farmaciaId apunta al id de farmacias.mock.js) y su `categoria` (id de categorias.mock.js).
// Precios en soles (S/).
export const medicamentos = [
  {
    id: 1, nombre: 'Ibuprofeno 400 mg', principioActivo: 'Ibuprofeno', presentacion: 'Caja x 20 tabletas', requiereReceta: false, categoria: 'antiinflamatorio',
    inventario: [
      { farmaciaId: 1, precio: 8.5, stock: 40 },
      { farmaciaId: 2, precio: 7.9, stock: 12 },
      { farmaciaId: 3, precio: 9.2, stock: 3 },
      { farmaciaId: 4, precio: 8.0, stock: 0 },
    ],
  },
  {
    id: 2, nombre: 'Ácido acetilsalicílico 100 mg', principioActivo: 'Ácido acetilsalicílico', presentacion: 'Caja x 30 tabletas', requiereReceta: false, categoria: 'cardiovascular',
    inventario: [
      { farmaciaId: 1, precio: 6.0, stock: 25 },
      { farmaciaId: 3, precio: 5.5, stock: 18 },
    ],
  },
  {
    id: 3, nombre: 'Paracetamol 500 mg', principioActivo: 'Paracetamol', presentacion: 'Caja x 100 tabletas', requiereReceta: false, categoria: 'analgesico',
    inventario: [
      { farmaciaId: 1, precio: 12.0, stock: 60 },
      { farmaciaId: 2, precio: 10.5, stock: 35 },
      { farmaciaId: 4, precio: 11.0, stock: 5 },
    ],
  },
  {
    id: 4, nombre: 'Amoxicilina 500 mg', principioActivo: 'Amoxicilina', presentacion: 'Caja x 21 cápsulas', requiereReceta: true, categoria: 'antibiotico',
    inventario: [
      { farmaciaId: 2, precio: 18.9, stock: 10 },
      { farmaciaId: 3, precio: 20.0, stock: 2 },
    ],
  },
  {
    id: 5, nombre: 'Loratadina 10 mg', principioActivo: 'Loratadina', presentacion: 'Caja x 10 tabletas', requiereReceta: false, categoria: 'antialergico',
    inventario: [
      { farmaciaId: 1, precio: 4.5, stock: 50 },
      { farmaciaId: 4, precio: 4.2, stock: 20 },
    ],
  },
  {
    id: 6, nombre: 'Omeprazol 20 mg', principioActivo: 'Omeprazol', presentacion: 'Caja x 14 cápsulas', requiereReceta: false, categoria: 'gastrico',
    inventario: [
      { farmaciaId: 2, precio: 9.9, stock: 0 },
      { farmaciaId: 3, precio: 10.5, stock: 8 },
    ],
  },
  {
    id: 7, nombre: 'Diclofenaco 50 mg', principioActivo: 'Diclofenaco sódico', presentacion: 'Caja x 20 grageas', requiereReceta: false, categoria: 'antiinflamatorio',
    inventario: [
      { farmaciaId: 1, precio: 7.0, stock: 1 },
      { farmaciaId: 4, precio: 6.5, stock: 15 },
    ],
  },
  {
    id: 8, nombre: 'Metformina 850 mg', principioActivo: 'Metformina', presentacion: 'Caja x 60 tabletas', requiereReceta: true, categoria: 'antidiabetico',
    inventario: [
      { farmaciaId: 1, precio: 15.0, stock: 22 },
      { farmaciaId: 2, precio: 14.2, stock: 9 },
    ],
  },
  {
    id: 9, nombre: 'Losartán 50 mg', principioActivo: 'Losartán potásico', presentacion: 'Caja x 30 tabletas', requiereReceta: true, categoria: 'cardiovascular',
    inventario: [
      { farmaciaId: 3, precio: 16.8, stock: 14 },
      { farmaciaId: 4, precio: 17.5, stock: 4 },
    ],
  },
  {
    id: 10, nombre: 'Jarabe para la tos de ñandú y miel', principioActivo: 'Dextrometorfano', presentacion: 'Frasco 120 ml', requiereReceta: false, categoria: 'respiratorio',
    inventario: [
      { farmaciaId: 2, precio: 13.5, stock: 7 },
    ],
  },
  {
    id: 11, nombre: 'Vitamina C 1 g', principioActivo: 'Ácido ascórbico', presentacion: 'Tubo x 10 efervescentes', requiereReceta: false, categoria: 'vitaminas',
    inventario: [
      { farmaciaId: 1, precio: 11.0, stock: 30 },
      { farmaciaId: 3, precio: 10.0, stock: 16 },
      { farmaciaId: 4, precio: 12.5, stock: 6 },
    ],
  },
  {
    id: 12, nombre: 'Salbutamol inhalador 100 mcg', principioActivo: 'Salbutamol', presentacion: 'Inhalador 200 dosis', requiereReceta: true, categoria: 'respiratorio',
    inventario: [
      { farmaciaId: 1, precio: 22.0, stock: 0 },
      { farmaciaId: 2, precio: 21.5, stock: 0 },
    ],
  },
  {
    id: 13, nombre: 'Naproxeno 550 mg', principioActivo: 'Naproxeno sódico', presentacion: 'Caja x 10 tabletas', requiereReceta: false, categoria: 'antiinflamatorio',
    inventario: [
      { farmaciaId: 2, precio: 9.0, stock: 11 },
      { farmaciaId: 4, precio: 8.7, stock: 2 },
    ],
  },
  {
    id: 14, nombre: 'Suero de rehidratación oral sabor naranja', principioActivo: 'Sales de rehidratación oral', presentacion: 'Sobre x 27.9 g', requiereReceta: false, categoria: 'hidratacion',
    inventario: [
      { farmaciaId: 1, precio: 2.5, stock: 100 },
      { farmaciaId: 3, precio: 2.8, stock: 45 },
    ],
  },
  {
    // Nombre muy largo a propósito, para probar cómo se ve en la interfaz.
    id: 15,
    nombre: 'Complejo multivitamínico y multimineral con hierro, zinc, calcio, magnesio y vitamina D3 para adultos mayores de cincuenta años',
    principioActivo: 'Multivitaminas y minerales',
    presentacion: 'Frasco x 120 tabletas recubiertas',
    requiereReceta: false,
    categoria: 'vitaminas',
    inventario: [
      { farmaciaId: 3, precio: 59.9, stock: 5 },
      { farmaciaId: 4, precio: 62.0, stock: 9 },
    ],
  },
]
