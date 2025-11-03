import { Artist } from "@/types";
import { Button } from "../ui/button";

interface props {
  a: Artist;
  changeMiddleArtist?: (artist: Artist) => void;
}

// This object will have the artist name and the url to get to their page
export default function Node({ a, changeMiddleArtist }: props) {
  return (
    <div className="relative w-[6rem] h-[6rem] group">
      {a.name && (
        <Button
          onClick={() => changeMiddleArtist?.(a)}
          className="
  group/node 
relative block w-[6rem] h-[6rem] rounded-full flex justify-center 
  border-solid border-gray-300 border-[5px] 
  transform-gpu transition-transform duration-200 ease-out hover:scale-105 active:scale-95 
  bg-cover bg-no-repeat bg-[position:center_30%]"
          style={{ backgroundImage: a.pfp ? `url(${a.pfp})` : undefined }}
        >
          <div className="opacity-0 group-hover/node:opacity-100 duration-300 absolute left-1/2 top-full -translate-x-1/2 mt-1 text-3 text-black font-semibold">
            {a.name}
          </div>
          {!a.pfp && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-green-300">
              <span className="px-2 text-center text-sm text-black leading-tight break-words">
                {a.name}
              </span>
            </div>
          )}
        </Button>
      )}
    </div>
  );
}
