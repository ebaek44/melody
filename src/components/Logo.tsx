import Link from "next/link";
import { AudioLines } from "lucide-react";

export default function Logo() {
  return (
    <Link href="/" className="brand" aria-label="MusicMap home">
      <span className="brand-mark">
        <AudioLines size={22} />
      </span>
      <span>
        musicmap<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
