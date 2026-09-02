// Lightweight icon set — pure SVG, no external dependencies.
const I = (paths, viewBox = "0 0 24 24") => (
  <svg width="20" height="20" viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {paths}
  </svg>
);

export const SearchIcon = (props) => I(<><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>, props?.vb);
export const SunIcon = () => I(<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>);
export const MoonIcon = () => I(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>);
export const ArrowRight = () => I(<><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>);
export const CloseIcon = () => I(<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>);
export const ExternalIcon = () => I(<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></>);
export const GithubIcon = () => I(<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>);
export const MenuIcon = () => I(<><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></>);
export const StarIcon = () => I(<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>);
