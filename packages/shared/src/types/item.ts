export type PublicItemImage = {
  id: string;
  url: string;
};

// price is a string, not a number: the API serializes Prisma Decimals as
// JSON strings (e.g. "24.99") to avoid float precision loss for currency.
// Parse it only for display, never for arithmetic.
export type PublicItem = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  quantity: number;
  category: string;
  createdAt: string;
  images: PublicItemImage[];
};

// GET /api/v1/items/:id additionally embeds the owning store and its owner;
// the list-within-a-store endpoint omits them since the URL already scopes it.
export type PublicItemDetail = PublicItem & {
  store: {
    id: string;
    name: string;
    owner: { id: string; username: string };
  };
};
