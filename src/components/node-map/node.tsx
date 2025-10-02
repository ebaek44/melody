import { Artist } from "@/types";

// This object will have the artist name and the url to get to their page
export default function Node(a: Artist) {
  return (
    <a
      className="
  relative block w-[6rem] h-[6rem] rounded-full flex justify-center 
  border-solid border-gray-300 border-[5px] 
  transform-gpu transition-transform duration-200 ease-out hover:scale-105 active:scale-95 
  bg-cover bg-no-repeat bg-[position:center_30%]"
      style={{ backgroundImage: a.pfp ? `url(${a.pfp})` : undefined }}
    >
      {!a.pfp && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-green-300">
          <span className="px-2 text-center text-sm text-black leading-tight break-words">
            {a.name}
          </span>
        </div>
      )}
    </a>
  );
}
