import React, { useState } from 'react';
import { Play, Plus, Heart, Share, Music2, Clock } from 'lucide-react';

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  confidence: number;
  reason: string;
  coverUrl?: string;
}

interface MusicColumn {
  id: string;
  title: string;
  color: string;
  songs: Song[];
}

const initialColumns: MusicColumn[] = [
  {
    id: 'daily-mix',
    title: 'Daily Discovery',
    color: 'primary',
    songs: [
      {
        id: 's1',
        title: 'Midnight City',
        artist: 'M83',
        album: 'Hurry Up, We\'re Dreaming',
        duration: '4:03',
        confidence: 96,
        reason: 'Similar to your electronic favorites'
      },
      {
        id: 's2',
        title: 'Do I Wanna Know?',
        artist: 'Arctic Monkeys',
        album: 'AM',
        duration: '4:32',
        confidence: 89,
        reason: 'Based on your rock preferences'
      },
      {
        id: 's3',
        title: 'Young Folks',
        artist: 'Peter Bjorn and John',
        album: 'Writer\'s Block',
        duration: '4:38',
        confidence: 94,
        reason: 'Matches your indie taste'
      }
    ]
  },
  {
    id: 'mood-based',
    title: 'Focus Vibes',
    color: 'blue',
    songs: [
      {
        id: 's4',
        title: 'Weightless',
        artist: 'Marconi Union',
        album: 'Ambient Music',
        duration: '8:08',
        confidence: 92,
        reason: 'Perfect for concentration'
      },
      {
        id: 's5',
        title: 'Svefn-g-englar',
        artist: 'Sigur Rós',
        album: 'Ágætis byrjun',
        duration: '10:04',
        confidence: 87,
        reason: 'Ambient and atmospheric'
      }
    ]
  },
  {
    id: 'genre-expansion',
    title: 'Genre Explorer',
    color: 'purple',
    songs: [
      {
        id: 's6',
        title: 'Blue Train',
        artist: 'John Coltrane',
        album: 'Blue Train',
        duration: '10:42',
        confidence: 73,
        reason: 'Expanding into jazz based on your taste'
      },
      {
        id: 's7',
        title: 'La Vie En Rose',
        artist: 'Édith Piaf',
        album: 'The Voice of the Sparrow',
        duration: '3:28',
        confidence: 68,
        reason: 'French classics recommendation'
      }
    ]
  },
  {
    id: 'saved',
    title: 'Saved for Later',
    color: 'accent',
    songs: [
      {
        id: 's8',
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        album: 'A Night at the Opera',
        duration: '5:55',
        confidence: 100,
        reason: 'Added to queue'
      }
    ]
  }
];

const MusicBoard = () => {
  const [columns] = useState<MusicColumn[]>(initialColumns);
  const [playingSong, setPlayingSong] = useState<string | null>(null);

  const handlePlay = (songId: string) => {
    setPlayingSong(playingSong === songId ? null : songId);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 75) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(column => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80 bg-card border border-border rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Music2 size={16} className={`text-${column.color}`} />
              <h3 className="font-medium text-foreground">{column.title}</h3>
              <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                {column.songs.length}
              </span>
            </div>
            <button className="p-1.5 rounded-md hover:bg-muted">
              <Plus size={16} className="text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-3">
            {column.songs.map(song => (
              <div
                key={song.id}
                className="p-3 rounded-lg bg-background border border-border hover:border-border/60 transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-12 h-12 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                    <Music2 size={20} className="text-muted-foreground" />
                    <button
                      onClick={() => handlePlay(song.id)}
                      className="absolute inset-0 bg-black/60 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Play size={16} className="text-white" fill="white" />
                    </button>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate text-sm">
                      {song.title}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {song.artist}
                    </p>
                    <p className="text-xs text-muted-foreground/80 truncate">
                      {song.album}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={10} />
                        {song.duration}
                      </span>
                      <span className={`text-xs font-medium ${getConfidenceColor(song.confidence)}`}>
                        {song.confidence}% match
                      </span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground/70 mt-1 italic">
                      {song.reason}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 rounded text-muted-foreground hover:text-foreground">
                      <Heart size={14} />
                    </button>
                    <button className="p-1 rounded text-muted-foreground hover:text-foreground">
                      <Share size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-3 p-2 border border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-border/60 transition-colors text-sm">
            + Add new recommendation
          </button>
        </div>
      ))}
    </div>
  );
};

export default MusicBoard;