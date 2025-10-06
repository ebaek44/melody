"use client";
import { useState } from "react";
import OrbitDynamic from "./NodeMapAnimation";
import { Artist } from "@/types";
import { fetchRelatedArtists } from "@/app/actions/lastfm/actions";
import { searchArtist } from "@/app/actions/spotify/actions";

type ArtistInput = { name: string; url?: string };

export default function NodeMap() {
  const sampleArtists: Artist[] = [
    {
      name: "Taylor Swift",
      url: "https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02",
      id: "06HL4z0CvFAxyc27GXpf02",
    },
    {
      name: "Drake",
      url: "https://open.spotify.com/artist/3TVXtAsR1Inumwj472S9r4",
      id: "3TVXtAsR1Inumwj472S9r4",
    },
    {
      name: "Billie Eilish",
      url: "https://open.spotify.com/artist/6qqNVTkY8uBg9cP3Jd7DAH",
      id: "6qqNVTkY8uBg9cP3Jd7DAH",
    },
    {
      name: "The Weeknd",
      url: "https://open.spotify.com/artist/1Xyo4u8uXC1ZmMpatF05PJ",
      id: "1Xyo4u8uXC1ZmMpatF05PJ",
    },
    {
      name: "Kendrick Lamar",
      url: "https://open.spotify.com/artist/2YZyLoL8N0Wb9xBt1NhZWg",
      id: "0TnOYISbd1XYRBk9myaseg",
    },
    {
      name: "Ariana Grande",
      url: "https://open.spotify.com/artist/66CXWjxzNUsdJxJ2JdwvnR",
      id: "66CXWjxzNUsdJxJ2JdwvnR",
    },
    {
      name: "Post Malone",
      url: "https://open.spotify.com/artist/246dkjvS1zLTtiykXe5h60",
      id: "246dkjvS1zLTtiykXe5h60",
    },
    {
      name: "Olivia Rodrigo",
      url: "https://open.spotify.com/artist/1McMsnEElThX1knmY4oliG",
      id: "1McMsnEElThX1knmY4oliG",
    },
    {
      name: "SZA",
      url: "https://open.spotify.com/artist/7tYKF4w9nC0nq9CsPZTHyP",
      id: "7tYKF4w9nC0nq9CsPZTHyP",
    },
    {
      name: "Bad Bunny",
      url: "https://open.spotify.com/artist/4q3ewBCX7sLwd24euuV69X",
      id: "4q3ewBCX7sLwd24euuV69X",
    },
    {
      name: "Doja Cat",
      url: "https://open.spotify.com/artist/5cj0lLjcoR7YOSnhnX0Po5",
      id: "5cj0lLjcoR7YOSnhnX0Po5",
    },
  ];

  const [middleArtist, setMiddleArtist] = useState<Artist>(sampleArtists[0]);
  const [surroundArtists, setSurroundArtists] = useState<Artist[]>(
    sampleArtists.slice(1)
  );
  const [activeArtist, setActiveArtist] = useState<string>("");
  const [state, setState] = useState("spread");

  // let stack = [middleArtist];

  const convertArtist = async (artist: ArtistInput) => {
    const name = artist.name;

    const data = await searchArtist(name);
    const a = data.artists.items[0];
    const image = a?.images?.[0]?.url ?? undefined;
    const url = a?.external_urls?.spotify ?? artist.url ?? "#";
    const returnArtist: Artist = {
      name: name,
      url: url,
      pfp: image,
    };
    return returnArtist;
  };

  const convertArtistList = async (
    artistList: ArtistInput[]
  ): Promise<Artist[]> => {
    const tasks = artistList.map((x) => convertArtist(x)); // Promise<Artist>[]
    const res = await Promise.all(tasks); // Artist[]
    return res;
  };

  const changeMiddleArtist = async (a: Artist) => {
    try {
      setState("gather");
      setActiveArtist(a.name);
      const apiData = await fetchRelatedArtists(a.name);
      console.log(apiData);
      const formattedArtists = await convertArtistList(
        apiData.similarartists.artist
      );

      // stack.push(a);
      setState("spread");
      setMiddleArtist(a);
      setSurroundArtists(formattedArtists);
      setActiveArtist("");
    } catch (error) {
      console.error("Error changing middle artist:", error);
      setState("spread");
      setActiveArtist("");
    }
  };

  return (
    <div>
      <OrbitDynamic
        center={middleArtist}
        orbit={surroundArtists}
        state={state}
        radius="250px"
        changeMiddleArtist={changeMiddleArtist}
        activeArtist={activeArtist}
      />
    </div>
  );
}
