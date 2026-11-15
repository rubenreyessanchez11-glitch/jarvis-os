import { useId } from 'react';

export default function ReactorCore() {
  const id = useId();
  return (
    <svg className="reactor" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-face`}>
          <stop offset="0" stopColor="var(--navy)" />
          <stop offset=".72" stopColor="var(--surface)" />
          <stop offset="1" stopColor="var(--navy)" />
        </radialGradient>
        <linearGradient id={`${id}-metal`} x2="1" y2="1">
          <stop stopColor="var(--acc)" stopOpacity=".55" />
          <stop offset=".52" stopColor="var(--line)" />
          <stop offset="1" stopColor="var(--acc)" stopOpacity=".35" />
        </linearGradient>
        <radialGradient id={`${id}-light`}>
          <stop stopColor="var(--white)" />
          <stop offset=".43" stopColor="var(--cyan)" />
          <stop offset="1" stopColor="var(--cyan)" stopOpacity=".12" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="93" fill={`url(#${id}-face)`} stroke={`url(#${id}-metal)`} strokeWidth="2" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="var(--acc)" strokeOpacity=".48" strokeWidth="3" strokeDasharray="1 6" />
      <g className="r1">
        <circle cx="100" cy="100" r="79" fill="none" stroke="var(--acc)" strokeWidth="6" strokeDasharray="39 10" strokeLinecap="round" />
      </g>
      <g className="r2">
        <circle cx="100" cy="100" r="66" fill="none" stroke="var(--warm)" strokeOpacity=".74" strokeWidth="2" strokeDasharray="58 46" />
        <circle cx="100" cy="100" r="58" fill="none" stroke="var(--acc)" strokeOpacity=".46" strokeWidth="5" strokeDasharray="6 9" />
      </g>
      <circle cx="100" cy="100" r="47" fill="var(--navy)" stroke={`url(#${id}-metal)`} strokeWidth="2" />
      <circle className="core" cx="100" cy="100" r="39" fill={`url(#${id}-light)`} />
      <path d="M100 74 123 87 123 113 100 126 77 113 77 87Z" fill="var(--navy)" fillOpacity=".77" stroke="var(--cyan)" strokeWidth="2" />
      <circle cx="100" cy="100" r="12" fill="var(--cyan)" />
      <circle cx="100" cy="100" r="5" fill="var(--white)" />
    </svg>
  );
}
