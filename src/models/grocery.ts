export type ShoppingCategory = "grocery" | "health" | "home";

export interface GroceryItem {
  id: string;
  title: string;
  shoppingCategory: ShoppingCategory;
  subcategory?: string;
  qty?: string;
  isBought: boolean;
  updatedAt: number;
  createdAt: number;
}

export const SHOPPING_CATEGORIES: ShoppingCategory[] = [
  "grocery",
  "health",
  "home",
];

export const GROCERY_SUBCATEGORIES = [
  "Produce",
  "Dairy",
  "Meat",
  "Bakery",
  "Frozen",
  "Snacks",
  "Beverages",
  "Household",
  "Other",
] as const;
