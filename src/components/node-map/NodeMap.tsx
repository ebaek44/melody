"use client";
import { useState, useEffect } from "react";
import OrbitDynamic from "./NodeMapAnimation";
import { Artist } from "@/types";
import { fetchRelatedArtists } from "@/app/actions/lastfm/actions";
import { searchArtist, getTopArtists } from "@/app/actions/spotify/actions";
import useStack from "../Stack";
import SpotifyEmbed from "../ui/SpotifyEmbed";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type ArtistInput = { name: string; url?: string };

export default function NodeMap() {
  const [activeArtist, setActiveArtist] = useState<string>("");
  const [state, setState] = useState("spread");
  const stack = useStack();

  // Place holder for a blank middle node
  const placeHolder: Artist = {
    name: "",
    url: "",
    pfp: "",
    uri: "",
  };
  const [middleArtist, setMiddleArtist] = useState<Artist>(placeHolder);
  const [surroundArtists, setSurroundArtists] = useState<Artist[]>([]);

  // converts a single raw JSON data for a spotify artist
  const convertArtist = async (artist: ArtistInput) => {
    const name = artist.name;
    const data = await searchArtist(name);
    const a = data.artists.items[0];
    const image = a?.images?.[0]?.url ?? undefined;
    const url = a?.external_urls?.spotify ?? artist.url ?? "#";
    const uri = a?.uri;
    const returnArtist: Artist = {
      name: name,
      url: url,
      pfp: image,
      uri: uri,
    };
    return returnArtist;
  };

  // Runs a list of artists (making sure they are not repeats) and converts them using convertArtist
  const convertArtistList = async (
    artistList: ArtistInput[]
  ): Promise<Artist[]> => {
    const res = [];
    for (let i = 0; i < 12; i++) {
      if (
        !stack.contains(artistList[i].name) &&
        !artistList[i].name.includes("&")
      ) {
        res.push(await convertArtist(artistList[i]));
      }
      if (res.length == 6) {
        break;
      }
    }
    return res;
  };

  // This will get the top artists from a users spotify for the original page
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const session = await getServerSession(authOptions);
        if (session) {
          const data = await getTopArtists(
            session.spotifyAccessToken as string
          );

          if (cancel) return;
          const topartists = await convertArtistList(data.items);
          if (cancel) return;
          console.log(topartists);
          setSurroundArtists(topartists);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const changeMiddleArtist = async (a: Artist) => {
    try {
      setState("gather");
      setActiveArtist(a.name);
      const apiData = await fetchRelatedArtists(a.name);
      const formattedArtists = await convertArtistList(
        apiData.similarartists.artist
      );
      if (middleArtist) {
        stack.push([middleArtist, formattedArtists].flat());
      }
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

  const goBack = async () => {
    if (stack.isEmpty) {
      console.log("history is empty");
      return;
    }

    const previous_nodes = stack.pop();

    try {
      setState("gather");
      setActiveArtist(previous_nodes[0].name);
      setTimeout(() => {
        setState("spread");
        setMiddleArtist(previous_nodes[0]);
        setSurroundArtists(previous_nodes.slice(1));
        setActiveArtist("");
      }, 950);
    } catch (error) {
      console.error("Error changing middle artist:", error);
      setState("spread");
      setActiveArtist("");
    }
  };

  return (
    <div className="flex flex-row gap-x-42">
      <div className="relative flex flex-col items-center">
        <OrbitDynamic
          center={middleArtist}
          orbit={surroundArtists}
          state={state}
          radius="250px"
          changeMiddleArtist={changeMiddleArtist}
          activeArtist={activeArtist}
        />
        {!stack.isEmpty && (
          <button
            onClick={goBack}
            className="p-3 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
      </div>
      {middleArtist && middleArtist.uri && (
        <SpotifyEmbed urlOrUri={middleArtist.uri} width={500} height={500} />
      )}
    </div>
  );
}
