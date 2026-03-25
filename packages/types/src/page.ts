export type PageStatus = 'draft' | 'published';

export interface Page {
  id: string;
  artistId: string;
  title: string;
  slug: string;
  status: PageStatus;
  theme?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}
