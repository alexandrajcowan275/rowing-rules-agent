"use client";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
export default function SiteNav() {
  const path = usePathname();
  return (
    <header className="site-nav">
      <a className="brand" href="/" aria-label="Rowing Rules Agent home">
        <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
          <path
            d="M5 7L27 25M5 25L27 7"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M2 3l6 3-3 5-4-5ZM30 3l-6 3 3 5 4-5ZM2 29l6-3-3-5-4 5ZM30 29l-6-3 3-5 4 5Z"
            fill="currentColor"
          />
        </svg>
        <span>
          ROWING RULES<span>AGENT / ALEX COWAN</span>
        </span>
      </a>
      <nav aria-label="Main navigation">
        <a aria-current={path === "/" ? "page" : undefined} href="/">
          Ask the Agent
        </a>
        <a
          aria-current={path.startsWith("/how-it-works") ? "page" : undefined}
          href="/how-it-works/"
        >
          How it works
        </a>
      </nav>
      <div className="nav-out">
        <a href="https://github.com/alexandrajcowan275/rowing-rules-agent">
          GitHub ↗
        </a>
        <a href="https://www.linkedin.com/in/alexandra-cowan-24705331b/">
          LinkedIn ↗
        </a>
      </div>
      <ThemeToggle />
    </header>
  );
}
