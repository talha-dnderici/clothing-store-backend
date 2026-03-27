export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Classic Men's T-Shirt",
    price: 24.99,
    category: "Men",
    imageUrl: "https://images.unsplash.com/photo-1763609973511-77f5caecd0f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW5zJTIwY2FzdWFsJTIwdC1zaGlydCUyMG1vZGVsfGVufDF8fHx8MTc3NDUzNTQxOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    id: "2",
    name: "Summer Floral Dress",
    price: 59.99,
    category: "Women",
    imageUrl: "https://images.unsplash.com/photo-1602303894456-398ce544d90b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21lbnMlMjBzdW1tZXIlMjBkcmVzcyUyMGZhc2hpb258ZW58MXx8fHwxNzc0NTM1NDE4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    id: "3",
    name: "Urban Stylish Sneakers",
    price: 89.99,
    category: "Shoes",
    imageUrl: "https://images.unsplash.com/photo-1695459468644-717c8ae17eed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHlsaXNoJTIwc25lYWtlcnMlMjBzaG9lc3xlbnwxfHx8fDE3NzQ0MTczNDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    id: "4",
    name: "Premium Leather Watch",
    price: 129.99,
    category: "Accessories",
    imageUrl: "https://images.unsplash.com/photo-1765446904696-15840809580c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwd2F0Y2glMjBhY2Nlc3Nvcnl8ZW58MXx8fHwxNzc0NTM1NDE4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    id: "5",
    name: "Men's Denim Jacket",
    price: 79.99,
    category: "Men",
    imageUrl: "https://images.unsplash.com/photo-1662915358274-dde61c1cb53b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW5zJTIwZGVuaW0lMjBqYWNrZXQlMjBhcHBhcmVsfGVufDF8fHx8MTc3NDUzNTQyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    id: "6",
    name: "Women's Leather Handbag",
    price: 149.99,
    category: "Accessories",
    imageUrl: "https://images.unsplash.com/photo-1484527273420-c598cb0601f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwaGFuZGJhZyUyMGZhc2hpb258ZW58MXx8fHwxNzc0NTM1NDIyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    id: "7",
    name: "Performance Running Shoes",
    price: 119.99,
    category: "Shoes",
    imageUrl: "https://images.unsplash.com/photo-1758684050614-4b9d4b4f851f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydW5uaW5nJTIwc2hvZXMlMjBhY3RpdmV3ZWFyfGVufDF8fHx8MTc3NDUzNTQyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    id: "8",
    name: "Classic Sunglasses",
    price: 45.00,
    category: "Accessories",
    imageUrl: "https://images.unsplash.com/photo-1584280282203-143dd29f3fcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21lbnMlMjBzdW5nbGFzc2VzJTIwc3VtbWVyfGVufDF8fHx8MTc3NDUzNTQyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  }
];