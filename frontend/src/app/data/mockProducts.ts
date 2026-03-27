export interface MockProduct {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  description: string;
  stockQuantity: number;
  price: number;
  warrantyStatus: string;
  distributor: string;
  imageUrl: string;
  rating: number; // 1-5
  category: string;
}

export const mockProducts: MockProduct[] = [
  {
    id: "1",
    name: "Classic Men's T-Shirt",
    model: "AURA-TSHIRT-01",
    serialNumber: "SN-AURA-1001",
    description: "Premium quality men's t-shirt designed for modern comfort and effortless style. Carefully crafted with sustainable, high-grade materials to ensure long-lasting durability.",
    stockQuantity: 42,
    price: 24.99,
    warrantyStatus: "2 Years Covered",
    distributor: "AURA Global Warehouses",
    imageUrl: "https://images.unsplash.com/photo-1763609973511-77f5caecd0f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW5zJTIwY2FzdWFsJTIwdC1zaGlydCUyMG1vZGVsfGVufDF8fHx8MTc3NDUzNTQxOHww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.5,
    category: "Men"
  },
  {
    id: "2",
    name: "Summer Floral Dress",
    model: "AURA-DRESS-02",
    serialNumber: "SN-AURA-1002",
    description: "Beautiful floral pattern dress perfect for summer. Lightweight and breathable fabric.",
    stockQuantity: 15,
    price: 59.99,
    warrantyStatus: "1 Year Covered",
    distributor: "AURA Fashion Partners",
    imageUrl: "https://images.unsplash.com/photo-1602303894456-398ce544d90b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21lbnMlMjBzdW1tZXIlMjBkcmVzcyUyMGZhc2hpb258ZW58MXx8fHwxNzc0NTM1NDE4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.8,
    category: "Women"
  },
  {
    id: "3",
    name: "Urban Stylish Sneakers",
    model: "AURA-SNEAKER-03",
    serialNumber: "SN-AURA-1003",
    description: "Comfortable and stylish urban sneakers for everyday wear.",
    stockQuantity: 0, // Out of stock example
    price: 89.99,
    warrantyStatus: "6 Months limited",
    distributor: "Sneaks Global Dist.",
    imageUrl: "https://images.unsplash.com/photo-1695459468644-717c8ae17eed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHlsaXNoJTIwc25lYWtlcnMlMjBzaG9lc3xlbnwxfHx8fDE3NzQ0MTczNDF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.2,
    category: "Shoes"
  },
  {
    id: "4",
    name: "Premium Leather Watch",
    model: "AURA-WATCH-04",
    serialNumber: "SN-AURA-1004",
    description: "Elegant leather watch suitable for all occasions. Water-resistant up to 50m.",
    stockQuantity: 20,
    price: 129.99,
    warrantyStatus: "2 Years Covered",
    distributor: "AURA Global Warehouses",
    imageUrl: "https://images.unsplash.com/photo-1765446904696-15840809580c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwd2F0Y2glMjBhY2Nlc3Nvcnl8ZW58MXx8fHwxNzc0NTM1NDE4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 5.0,
    category: "Accessories"
  },
  {
    id: "5",
    name: "Men's Denim Jacket",
    model: "AURA-JACKET-05",
    serialNumber: "SN-AURA-1005",
    description: "Classic denim jacket for men. Durable and stylish for the colder seasons.",
    stockQuantity: 8,
    price: 79.99,
    warrantyStatus: "1 Year Covered",
    distributor: "Denim Co.",
    imageUrl: "https://images.unsplash.com/photo-1662915358274-dde61c1cb53b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW5zJTIwZGVuaW0lMjBqYWNrZXQlMjBhcHBhcmVsfGVufDF8fHx8MTc3NDUzNTQyMnww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.6,
    category: "Men"
  },
  {
    id: "6",
    name: "Women's Leather Handbag",
    model: "AURA-BAG-06",
    serialNumber: "SN-AURA-1006",
    description: "Spacious leather handbag designed with multiple compartments for convenience.",
    stockQuantity: 2,
    price: 149.99,
    warrantyStatus: "3 Years Covered",
    distributor: "AURA Global Warehouses",
    imageUrl: "https://images.unsplash.com/photo-1484527273420-c598cb0601f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwaGFuZGJhZyUyMGZhc2hpb258ZW58MXx8fHwxNzc0NTM1NDIyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.9,
    category: "Accessories"
  },
  {
    id: "7",
    name: "Performance Running Shoes",
    model: "AURA-RUN-07",
    serialNumber: "SN-AURA-1007",
    description: "Lightweight, breathable performance running shoes for athletes and enthusiasts.",
    stockQuantity: 34,
    price: 119.99,
    warrantyStatus: "1 Year Covered",
    distributor: "RunFast Dist.",
    imageUrl: "https://images.unsplash.com/photo-1758684050614-4b9d4b4f851f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydW5uaW5nJTIwc2hvZXMlMjBhY3RpdmV3ZWFyfGVufDF8fHx8MTc3NDUzNTQyMnww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.3,
    category: "Shoes"
  },
  {
    id: "8",
    name: "Classic Sunglasses",
    model: "AURA-SUNGLASS-08",
    serialNumber: "SN-AURA-1008",
    description: "Stylish sunglasses with UV protection. A perfect addition to your summer accessories.",
    stockQuantity: 0, // Out of stock
    price: 45.00,
    warrantyStatus: "1 Year Covered",
    distributor: "AURA Global Warehouses",
    imageUrl: "https://images.unsplash.com/photo-1584280282203-143dd29f3fcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21lbnMlMjBzdW5nbGFzc2VzJTIwc3VtbWVyfGVufDF8fHx8MTc3NDUzNTQyMnww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.1,
    category: "Accessories"
  },
  {
    id: "9",
    name: "Cozy Winter Scarf",
    model: "AURA-SCARF-09",
    serialNumber: "SN-AURA-1009",
    description: "Warm, cozy, and soft winter scarf made from a wool blend.",
    stockQuantity: 100,
    price: 29.99,
    warrantyStatus: "Not Applicable",
    distributor: "AURA Fashion Partners",
    imageUrl: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    rating: 4.7,
    category: "Accessories"
  },
  {
    id: "10",
    name: "Casual Unisex Hoodie",
    model: "AURA-HOODIE-10",
    serialNumber: "SN-AURA-1010",
    description: "Comfortable unisex hoodie, perfect for lounging or running errands.",
    stockQuantity: 50,
    price: 64.99,
    warrantyStatus: "1 Year Covered",
    distributor: "AURA Global Warehouses",
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    rating: 4.5,
    category: "Unisex"
  }
];
