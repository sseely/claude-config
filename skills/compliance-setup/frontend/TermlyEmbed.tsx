import { useEffect, useRef } from 'react';

interface TermlyEmbedProps {
  dataId: string;
}

/**
 * Renders a Termly policy embed. Termly identifies its container via a
 * non-standard `name` attribute on a div — React/TypeScript won't allow that
 * in JSX, so we set it via ref.
 */
export function TermlyEmbed({ dataId }: TermlyEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.setAttribute('name', 'termly-embed');

    const scriptId = 'termly-jssdk';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://app.termly.io/embed-policy.min.js';
    document.body.appendChild(script);

    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] py-12 px-4 sm:px-6 lg:px-8">
      <div
        className="max-w-4xl mx-auto rounded-lg p-8"
        style={{ colorScheme: 'light', backgroundColor: '#ffffff', color: '#111827' }}
      >
        <div ref={containerRef} data-id={dataId} />
      </div>
    </div>
  );
}