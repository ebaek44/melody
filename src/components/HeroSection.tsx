"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader,
  Plus,
  ExternalLink,
  Play,
  Heart,
  MoreHorizontal,
} from "lucide-react";

// Music Board Component
const MusicBoard = () => {
  const columns = [
    {
      id: "discover",
      title: "New Discoveries",
      color: "bg-emerald-500",
      items: [
        {
          id: 1,
          title: "Midnight City",
          artist: "M83",
          genre: "Electronic",
          match: "95%",
          image: "🎵",
        },
        {
          id: 2,
          title: "Strobe",
          artist: "Deadmau5",
          genre: "Electronic",
          match: "92%",
          image: "🎶",
        },
        {
          id: 3,
          title: "Bohemian Rhapsody",
          artist: "Queen",
          genre: "Rock",
          match: "89%",
          image: "🎤",
        },
      ],
    },
    {
      id: "liked",
      title: "Liked",
      color: "bg-green-500",
      items: [
        {
          id: 4,
          title: "Teardrop",
          artist: "Massive Attack",
          genre: "Trip Hop",
          match: "97%",
          image: "💧",
        },
        {
          id: 5,
          title: "Porcelain",
          artist: "Moby",
          genre: "Electronic",
          match: "94%",
          image: "🏺",
        },
      ],
    },
    {
      id: "queue",
      title: "Listen Later",
      color: "bg-orange-500",
      items: [
        {
          id: 6,
          title: "Time",
          artist: "Pink Floyd",
          genre: "Progressive Rock",
          match: "91%",
          image: "⏰",
        },
        {
          id: 7,
          title: "Claire de Lune",
          artist: "Debussy",
          genre: "Classical",
          match: "88%",
          image: "🌙",
        },
        {
          id: 8,
          title: "Take Five",
          artist: "Dave Brubeck",
          genre: "Jazz",
          match: "85%",
          image: "🎺",
        },
      ],
    },
  ];

  type MusicItem = {
    id: number;
    title: string;
    artist: string;
    genre: string;
    match: string;
    image: string;
  };

  interface MusicCardProps {
    item: MusicItem;
    isDragging?: boolean;
  }

  const MusicCard: React.FC<MusicCardProps> = ({
    item,
    isDragging = false,
  }) => (
    <div
      className={`group bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer ${
        isDragging ? "opacity-50 rotate-2" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-2xl">{item.image}</div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1 rounded hover:bg-gray-100">
            <Play className="h-3 w-3" />
          </button>
          <button className="p-1 rounded hover:bg-gray-100">
            <Heart className="h-3 w-3" />
          </button>
          <button className="p-1 rounded hover:bg-gray-100">
            <MoreHorizontal className="h-3 w-3" />
          </button>
        </div>
      </div>

      <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">
        {item.title}
      </h4>
      <p className="text-xs text-gray-600 mb-2">{item.artist}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
          {item.genre}
        </span>
        <span className="text-xs font-medium text-green-600">{item.match}</span>
      </div>
    </div>
  );

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {columns.map((column) => (
        <div key={column.id} className="flex-shrink-0 w-72">
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
            <h3 className="font-medium text-gray-900">{column.title}</h3>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
              {column.items.length}
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {column.items.map((item) => (
              <MusicCard key={item.id} item={item} />
            ))}

            <button className="w-full p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              Add track
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative w-full py-12 md:py-20 px-6 md:px-12 flex flex-col items-center justify-center overflow-hidden bg-gray-50">
      {/* Cosmic particle effect (background dots) */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.3) 1px, transparent 0)`,
          backgroundSize: "20px 20px",
        }}
      ></div>

      {/* Gradient glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full">
        <div className="w-full h-full opacity-10 bg-gradient-to-r from-emerald-500 to-purple-600 blur-[120px]"></div>
      </div>
      {/* Start of the discover prompt seciont */}
      <div
        className={`relative z-10 max-w-4xl text-center space-y-6 transition-all duration-700 transform ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-white text-emerald-600 border border-emerald-200">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            Now with AI-powered recommendations
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight text-balance text-gray-900">
          Discover new music based on your{" "}
          <span className="text-gray-900">listening history</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto text-balance">
          Uncover your next favorite songs with AI-powered recommendations that
          learn from your unique music taste and listening patterns.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 items-center">
          <button
            onClick={() => {
              router.push("/home");
            }}
            className="bg-emerald-600 text-white hover:bg-emerald-700 text-base h-12 px-8 transition-all duration-200 rounded-lg"
          >
            Start discovering
          </button>
          <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 text-base h-12 px-8 transition-all duration-200 rounded-lg bg-white">
            Connect Spotify
          </button>
        </div>

        <div className="pt-6 text-sm text-gray-500">
          Free forever • Connect multiple streaming services
        </div>
      </div>

      {/* end of the discover prompt seciont */}

      {/* Music Dashboard integrated in hero section */}
      <div
        className={`w-full max-w-7xl mt-12 z-10 transition-all duration-1000 delay-500 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
        }`}
      >
        <div className="relative rounded-xl overflow-hidden border border-gray-200 backdrop-blur-sm bg-white/80 shadow-lg">
          {/* Dashboard Header */}
          <div className="bg-white/90 backdrop-blur-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-sm bg-gray-900"></div>
                </div>
                <span className="text-gray-900 font-medium">
                  Music Discovery Dashboard
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white"></div>
                  <div className="h-8 w-8 rounded-full bg-gray-300 border-2 border-white"></div>
                  <div className="h-8 w-8 rounded-full bg-gray-400 border-2 border-white"></div>
                  <div className="h-8 w-8 rounded-full bg-gray-500 border-2 border-white flex items-center justify-center text-xs text-white">
                    +3
                  </div>
                </div>

                <button className="h-8 px-3 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200">
                  Share
                </button>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="flex h-[600px] overflow-hidden">
              {/* Sidebar */}
              <div className="w-64 border-r border-gray-200 p-4 space-y-4 hidden md:block bg-gray-50/50">
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 uppercase font-medium">
                    Navigation
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-gray-900 text-white">
                      <div className="h-3 w-3 rounded-sm bg-white"></div>
                      <span>Discover</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 cursor-pointer">
                      <div className="h-3 w-3 rounded-sm bg-gray-400"></div>
                      <span>Your Music</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 cursor-pointer">
                      <div className="h-3 w-3 rounded-sm bg-gray-400"></div>
                      <span>Playlists</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 cursor-pointer">
                      <div className="h-3 w-3 rounded-sm bg-gray-400"></div>
                      <span>Analytics</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <div className="text-xs text-gray-500 uppercase font-medium">
                    Genres
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 cursor-pointer">
                      <div className="h-3 w-3 rounded-full bg-red-400"></div>
                      <span>Rock</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 cursor-pointer">
                      <div className="h-3 w-3 rounded-full bg-emerald-400"></div>
                      <span>Electronic</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 cursor-pointer">
                      <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                      <span>Jazz</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-4 bg-gray-50/30 overflow-hidden">
                {/* Board Header */}
                <div className="flex items-center justify-between mb-6 min-w-0">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <h3 className="font-medium text-gray-900">
                      Recommendations
                    </h3>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                      42
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button className="h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200">
                      <Plus className="h-4 w-4" />
                    </button>
                    <button className="h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button className="h-8 px-3 rounded-md bg-gray-900 text-white text-sm font-medium whitespace-nowrap hover:bg-gray-800">
                      Generate Playlist
                    </button>
                  </div>
                </div>

                {/* Kanban Board */}
                <div className="overflow-hidden">
                  <MusicBoard />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
