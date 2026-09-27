"use client";

import { useEffect, useRef, useState } from "react";

// Plays the hero videos one after another: 1 → 2 → 3 → 1 …
export const HERO_VIDEOS = [
  { src: "/videos/hero-1.mp4", webm: "/videos/hero-1.webm", poster: "/videos/hero-1.jpg" },
  { src: "/videos/hero-2.mp4", webm: "/videos/hero-2.webm", poster: "/videos/hero-2.jpg" },
  { src: "/videos/hero-3.mp4", webm: "/videos/hero-3.webm", poster: "/videos/hero-3.jpg" },
];

export default function HeroVideo() {
  const refs = useRef([]);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Play the active video, pause the others
  useEffect(() => {
    if (reduced) return;
    refs.current.forEach((v, i) => {
      if (!v) return;
      v.muted = true; // required for autoplay on mobile
      if (i === active) {
        v.currentTime = 0;
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [active, reduced]);

  const next = () => setActive((i) => (i + 1) % HERO_VIDEOS.length);

  return (
    <div className="hero-video" aria-hidden="true">
      {HERO_VIDEOS.map((v, i) => (
        <video
          key={v.src}
          ref={(el) => (refs.current[i] = el)}
          className={i === active ? "on" : ""}
          poster={v.poster}
          muted
          playsInline
          preload={i === 0 ? "auto" : "metadata"}
          onEnded={() => i === active && next()}
          onTimeUpdate={(e) => i === active && e.currentTarget.duration && setProgress(e.currentTarget.currentTime / e.currentTarget.duration)}
        >
          {!reduced && (
            <>
              {/* MP4 for Safari/Chrome/Edge/Firefox, WebM as a fallback for browsers without H.264 */}
              <source src={v.src} type={'video/mp4; codecs="avc1.640028"'} />
              <source src={v.webm} type="video/webm" onError={() => i === active && setTimeout(next, 800)} />
            </>
          )}
        </video>
      ))}
      <div className="hero-video-shade" />

      <div className="hero-video-dots">
        {HERO_VIDEOS.map((v, i) => (
          <button key={v.src} aria-label={`Play video ${i + 1}`} onClick={() => setActive(i)} className={i === active ? "on" : i < active ? "done" : ""}>
            <span style={{ width: i === active ? `${progress * 100}%` : i < active ? "100%" : "0%" }} />
          </button>
        ))}
      </div>
    </div>
  );
}
