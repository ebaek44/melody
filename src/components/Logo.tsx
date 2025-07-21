import React from 'react';

const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
        <div className="h-4 w-4">
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-primary-foreground">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor"/>
          </svg>
        </div>
      </div>
      <span className="text-xl font-bold tracking-tight text-foreground">MusicMap</span>
    </div>
  );
};

export default Logo;
