export type Artist = {
  name: string;
  url: string;
  id?: string;
  followers?: number;
  popularity?: number;
  pfp?: string;
  uri?: string;
  match?: number;
  genres?: string[];
};

export type Track = {
  name: string;
  artist: string;
  url: string;
  uri?: string;
};

export type Neighborhood = {
  center: Artist;
  related: Artist[];
  /** Raw provider-ranked candidates, before browser-specific exclusions. */
  candidates?: Artist[];
  tracks: Track[];
  source: "lastfm" | "curated";
  notice?: string;
};

export type SavedItem = {
  key: string;
  kind: "artist" | "track";
  name: string;
  artist: string;
  url: string;
  uri?: string;
  pfp?: string;
  createdAt: number;
};
