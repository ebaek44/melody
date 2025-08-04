"use client";

import React, { useEffect, useState } from "react";

const TypingText = ({
  text,
  speed = 100,
  className = "",
}: {
  text: string;
  speed?: number;
  className?: string;
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [index, text, speed]);

  // Reset animation if text changes
  useEffect(() => {
    setDisplayedText("");
    setIndex(0);
  }, [text]);

  return (
    <span className={`${className}`}>
      {displayedText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

export default TypingText;
