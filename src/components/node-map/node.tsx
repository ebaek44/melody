// Make an interface for the props
interface ArtistNodeProps {
  artistName: string;
  artistURL: string;
  bgPfp?: string;
}

// This object will have the artist name and the url to get to their page
export default function Node({
  artistName,
  artistURL,
  bgPfp,
}: ArtistNodeProps) {
  return (
    <a
      target="_blank"
      href={artistURL}
      className="
  w-25 h-25 rounded-full flex justify-center 
  border-solid border-gray-300 border-[5px] 
  transform-gpu transition-transform duration-200 ease-out hover:scale-105 active:scale-95 
  bg-cover bg-no-repeat bg-[position:center_30%]"
      style={{ backgroundImage: bgPfp ? `url(${bgPfp})` : undefined }}
    >
      {!bgPfp && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-green-300">
          <span className="px-2 text-center text-sm text-black leading-tight break-words">
            {artistName}
          </span>
        </div>
      )}
    </a>
  );
}
