import type { ReactNode } from 'react';

type Props = { id?: string; title?: string; wide?: boolean; children: ReactNode };

export default function GlassCard({ id, title, wide, children }: Props) {
  return (
    <section className={wide ? 'card wide' : 'card'} id={id} aria-label={title}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
