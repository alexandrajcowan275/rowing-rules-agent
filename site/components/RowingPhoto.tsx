"use client";
import { useState } from "react";
export default function RowingPhoto({
  file,
  alt,
  orientation,
  available,
}: {
  file: string;
  alt: string;
  orientation: "landscape" | "portrait";
  available: boolean;
}) {
  const [missing, setMissing] = useState(!available);
  return (
    <figure className={`rowing-photo ${orientation}`}>
      {!missing && (
        <img
          src={`/photos/${file}`}
          alt={alt}
          loading="lazy"
          onError={() => setMissing(true)}
        />
      )}
      {missing && (
        <div className="photo-placeholder">
          <svg viewBox="0 0 200 160" aria-hidden="true">
            <path
              d="M15 120H185M15 130H185M15 140H185"
              stroke="currentColor"
              strokeWidth=".6"
            />
            <path
              d="M40 98Q100 110 160 98Q100 120 40 98Z"
              fill="none"
              stroke="currentColor"
            />
            <path d="M77 94L56 66M114 94L135 66" stroke="currentColor" />
            <path
              d="M50 62L60 70M131 70L141 62"
              stroke="currentColor"
              strokeWidth="5"
            />
          </svg>
          <span className="mono">A PLACE FOR A MEMORY</span>
          <p>Your rowing photograph here.</p>
        </div>
      )}
      <figcaption className="mono">
        {orientation === "landscape" ? "01 / ON THE WATER" : "02 / IN THE BOAT"}
      </figcaption>
    </figure>
  );
}
