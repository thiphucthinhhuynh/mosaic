export type PublicStore = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  createdAt: string;
  owner: {
    id: string;
    username: string;
  };
};
