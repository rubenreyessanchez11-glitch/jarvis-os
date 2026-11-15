// Central ARC reactor. Slow, quiet motion; disabled by prefers-reduced-motion (see app.css).
export default function ReactorCore() {
  return (
    <svg className="reactor" viewBox="0 0 200 200" role="img" aria-label="Animated arc reactor">
      <circle cx="100" cy="100" r="92" fill="none" stroke="var(--line)" strokeWidth="2" />
      <g className="r1"><circle cx="100" cy="100" r="82" fill="none" stroke="var(--acc)" strokeWidth="5" strokeDasharray="40 14 8 14" /></g>
      <g className="r2"><circle cx="100" cy="100" r="62" fill="none" stroke="var(--warm)" strokeWidth="4" strokeDasharray="90 20" /></g>
      <circle cx="100" cy="100" r="40" fill="none" stroke="var(--acc)" strokeWidth="2" />
      <circle className="core" cx="100" cy="100" r="24" fill="var(--acc)" />
      <circle cx="100" cy="100" r="10" fill="var(--bg)" />
    </svg>
  );
}
