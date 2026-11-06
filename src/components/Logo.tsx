import Link from "next/link";
import { AudioLines } from "lucide-react";

export default function Logo() {
  return (
    <Link href="/" className="brand" aria-label="musicweb home">
      <span className="brand-mark">
        <AudioLines size={22} />
      </span>
      <span>
        musicweb<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
