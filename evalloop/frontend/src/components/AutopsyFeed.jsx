import { useEffect, useRef } from 'react';

export default function AutopsyFeed({ lines, running }) {
  const terminalRef = useRef();

  useEffect(() => {
    terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
  }, [lines]);

  return (
    <section className="feed fade">
      <div className="feed-head">
        <h3>LIVE AUTOPSY FEED</h3>
        <span className={running ? 'dot blink' : 'dot'} />
      </div>
      <div className="terminal" ref={terminalRef}>
        {lines.map((line, index) => (
          <pre className={line.type} key={`${line.text}-${index}`}>
            {line.text}
          </pre>
        ))}
      </div>
    </section>
  );
}
