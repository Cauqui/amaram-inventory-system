export type UserRole = "admin" | "inventory";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  usesSizes: boolean;
  status: "active" | "inactive";
}

export interface Program {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
}

export interface ProductVariant {
  id: string;
  sku: string;
  size?: string;
  color: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  history: string;
  categoryId: string;
  programId: string;
  creator: string;
  photo: string;
  variants: ProductVariant[];
  status: "available" | "low_stock" | "out_of_stock" | "inactive";
  createdAt: string;
}

export interface Movement {
  id: string;
  date: string;
  type: "entrada" | "salida" | "ajuste";
  productId: string;
  variantSku: string;
  quantity: number;
  userId: string;
  reason: string;
  status: "completed" | "pending";
}

export const USERS: User[] = [
  { id: "u1", name: "Ana Méndez", email: "ana@amaram.org", password: "admin123", role: "admin" },
  { id: "u2", name: "Carlos Rivera", email: "carlos@amaram.org", password: "admin123", role: "admin" },
  { id: "u3", name: "Luisa Herrera", email: "luisa@amaram.org", password: "inv123", role: "inventory" },
  { id: "u4", name: "Marta Gómez", email: "marta@amaram.org", password: "inv123", role: "inventory" },
];

export const CATEGORIES: Category[] = [
  { id: "cat1", name: "Canastas", code: "CAN", usesSizes: false, status: "active" },
  { id: "cat2", name: "Carteras", code: "CAR", usesSizes: false, status: "active" },
  { id: "cat3", name: "Crochet", code: "CRO", usesSizes: false, status: "active" },
  { id: "cat4", name: "Prendas", code: "ROP", usesSizes: true, status: "active" },
  { id: "cat5", name: "Peluches", code: "PEL", usesSizes: false, status: "active" },
];

export const PROGRAMS: Program[] = [
  { id: "prog1", name: "Programa/Taller 01", description: "Taller de tejido y cestería artesanal", status: "active" },
  { id: "prog2", name: "Programa/Taller 02", description: "Taller de confección y prendas", status: "active" },
  { id: "prog3", name: "Programa/Taller 03", description: "Taller de accesorios y crochet", status: "active" },
];

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Canasta tejida natural",
    description: "Canasta elaborada con fibra natural y técnica de cestería tradicional.",
    history: "Creada en el primer taller de cestería como parte del proceso de recuperación de técnicas ancestrales.",
    categoryId: "cat1",
    programId: "prog1",
    creator: "Rosa Quispe",
    photo: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop&auto=format",
    variants: [{ id: "v1", sku: "AMA-CAN-0001", color: "Natural", stock: 8 }],
    status: "available",
    createdAt: "2025-08-10",
  },
  {
    id: "p2",
    name: "Canasta pintada andina",
    description: "Canasta de fibra vegetal con motivos andinos pintados a mano.",
    history: "Inspirada en los patrones geométricos de las comunidades de la sierra.",
    categoryId: "cat1",
    programId: "prog1",
    creator: "Elena Mamani",
    photo: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=80&h=80&fit=crop&auto=format",
    variants: [{ id: "v2", sku: "AMA-CAN-0002", color: "Multicolor", stock: 3 }],
    status: "low_stock",
    createdAt: "2025-08-15",
  },
  {
    id: "p3",
    name: "Cartera de cuero artesanal",
    description: "Cartera elaborada en cuero repujado con cierre dorado.",
    history: "Pieza diseñada como parte del programa de inserción laboral para mujeres artesanas.",
    categoryId: "cat2",
    programId: "prog2",
    creator: "Carmen Torres",
    photo: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=80&h=80&fit=crop&auto=format",
    variants: [
      { id: "v3", sku: "AMA-CAR-0001", color: "Camel", stock: 5 },
      { id: "v4", sku: "AMA-CAR-0002", color: "Negro", stock: 4 },
    ],
    status: "available",
    createdAt: "2025-08-18",
  },
  {
    id: "p4",
    name: "Cartera crochet verano",
    description: "Cartera en crochet con hilo de algodón y asa de bambú.",
    history: "Colección de verano elaborada colaborativamente por las participantes del taller.",
    categoryId: "cat2",
    programId: "prog3",
    creator: "Sofía Paredes",
    photo: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=80&h=80&fit=crop&auto=format",
    variants: [{ id: "v5", sku: "AMA-CAR-0003", color: "Beige", stock: 0 }],
    status: "out_of_stock",
    createdAt: "2025-08-20",
  },
  {
    id: "p5",
    name: "Chal de crochet alpaca",
    description: "Chal elaborado en hilo de alpaca con punto calado floral.",
    history: "Técnica transmitida de generación en generación en las comunidades participantes.",
    categoryId: "cat3",
    programId: "prog3",
    creator: "Lucía Condori",
    photo: "https://images.unsplash.com/photo-1603251578711-3290ca1a0187?w=80&h=80&fit=crop&auto=format",
    variants: [
      { id: "v6", sku: "AMA-CRO-0001", color: "Blanco", stock: 6 },
      { id: "v7", sku: "AMA-CRO-0002", color: "Gris", stock: 2 },
    ],
    status: "available",
    createdAt: "2025-08-22",
  },
  {
    id: "p6",
    name: "Chompa artesanal alpaca",
    description: "Chompa tejida a mano en alpaca pura con diseño geométrico andino.",
    history: "Prenda insignia del programa, reconocida en ferias artesanales regionales.",
    categoryId: "cat4",
    programId: "prog2",
    creator: "María Quispe",
    photo: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=80&h=80&fit=crop&auto=format",
    variants: [
      { id: "v8", sku: "AMA-ROP-0001", size: "M", color: "Beige", stock: 4 },
      { id: "v9", sku: "AMA-ROP-0002", size: "M", color: "Negro", stock: 2 },
      { id: "v10", sku: "AMA-ROP-0003", size: "L", color: "Beige", stock: 3 },
      { id: "v11", sku: "AMA-ROP-0004", size: "L", color: "Negro", stock: 1 },
    ],
    status: "available",
    createdAt: "2025-09-01",
  },
  {
    id: "p7",
    name: "Chaleco bordado tradicional",
    description: "Chaleco de lana bordado con motivos florales tradicionales.",
    history: "Basado en diseños de vestimenta festiva de las comunidades colaboradoras.",
    categoryId: "cat4",
    programId: "prog2",
    creator: "Isabel Flores",
    photo: "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=80&h=80&fit=crop&auto=format",
    variants: [
      { id: "v12", sku: "AMA-ROP-0005", size: "S", color: "Rojo", stock: 2 },
      { id: "v13", sku: "AMA-ROP-0006", size: "M", color: "Rojo", stock: 0 },
    ],
    status: "low_stock",
    createdAt: "2025-09-02",
  },
  {
    id: "p8",
    name: "Peluche llama artesanal",
    description: "Peluche de llama elaborado en tela polar y relleno hipoalergénico.",
    history: "Creado como producto estrella para ferias y eventos culturales de la organización.",
    categoryId: "cat5",
    programId: "prog1",
    creator: "Paula Ríos",
    photo: "https://images.unsplash.com/photo-1559181567-c3190ca9d5db?w=80&h=80&fit=crop&auto=format",
    variants: [{ id: "v14", sku: "AMA-PEL-0001", color: "Beige", stock: 12 }],
    status: "available",
    createdAt: "2025-09-03",
  },
  {
    id: "p9",
    name: "Peluche oso crochet",
    description: "Oso amigurumi elaborado completamente en crochet de algodón.",
    history: "Iniciativa del taller de crochet para expandir la línea de productos infantiles.",
    categoryId: "cat5",
    programId: "prog3",
    creator: "Sofía Paredes",
    photo: "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=80&h=80&fit=crop&auto=format",
    variants: [
      { id: "v15", sku: "AMA-PEL-0002", color: "Café", stock: 7 },
      { id: "v16", sku: "AMA-PEL-0003", color: "Blanco", stock: 5 },
    ],
    status: "available",
    createdAt: "2025-09-04",
  },
  {
    id: "p10",
    name: "Tapete tejido redondo",
    description: "Tapete circular tejido en trapillo reciclado con patrones concéntricos.",
    history: "Parte de la línea sostenible que utiliza materiales reciclados del taller.",
    categoryId: "cat3",
    programId: "prog1",
    creator: "Rosa Quispe",
    photo: "https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=80&h=80&fit=crop&auto=format",
    variants: [{ id: "v17", sku: "AMA-CRO-0003", color: "Multicolor", stock: 0 }],
    status: "out_of_stock",
    createdAt: "2025-09-05",
  },
];

export const MOVEMENTS: Movement[] = [
  { id: "m1", date: "2025-09-05", type: "entrada", productId: "p8", variantSku: "AMA-PEL-0001", quantity: 10, userId: "u3", reason: "Ingreso de productos nuevos", status: "completed" },
  { id: "m2", date: "2025-09-04", type: "salida", productId: "p8", variantSku: "AMA-PEL-0001", quantity: 2, userId: "u4", reason: "Salida para feria artesanal", status: "completed" },
  { id: "m3", date: "2025-09-03", type: "entrada", productId: "p6", variantSku: "AMA-ROP-0001", quantity: 4, userId: "u3", reason: "Ingreso de nueva producción", status: "completed" },
  { id: "m4", date: "2025-09-02", type: "ajuste", productId: "p7", variantSku: "AMA-ROP-0006", quantity: -1, userId: "u1", reason: "Ajuste por producto dañado", status: "completed" },
  { id: "m5", date: "2025-09-01", type: "salida", productId: "p10", variantSku: "AMA-CRO-0003", quantity: 3, userId: "u4", reason: "Salida para consignación", status: "completed" },
  { id: "m6", date: "2025-08-28", type: "entrada", productId: "p1", variantSku: "AMA-CAN-0001", quantity: 8, userId: "u3", reason: "Ingreso de producción mensual", status: "completed" },
  { id: "m7", date: "2025-08-25", type: "salida", productId: "p2", variantSku: "AMA-CAN-0002", quantity: 2, userId: "u4", reason: "Salida a tienda principal", status: "completed" },
  { id: "m8", date: "2025-08-22", type: "entrada", productId: "p5", variantSku: "AMA-CRO-0001", quantity: 6, userId: "u3", reason: "Ingreso de taller mensual", status: "completed" },
];
