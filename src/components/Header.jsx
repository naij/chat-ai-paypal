const bubbles = [
  ['fortune', 'Tell my fortune today', <>Tell my<br/>fortune today</>],
  ['others', 'Chat with others', <>Chat with<br/>others</>],
  ['source', 'Source a deal', <>Source<br/>A Deal</>],
  ['trip', 'Plan a trip', 'Plan a trip'],
  ['part-time', 'Look for part-time job opportunities', <>Look for part-time<br/>job opportunities</>],
  ['job', 'Search for a job', <>Search<br/>for a job</>]
];
export default function Header({ home, onStart, onTopic, onBack }) {
  const renderBubbles = items => items.map(([name, label, text]) => <button key={name} id={name === 'source' ? 'source-deal' : undefined} className={`bubble-hit ${name}`} aria-label={label} onClick={name === 'source' ? onStart : onTopic}><span>{text}</span></button>);
  return <>
    <section id="welcome" className="welcome" hidden={!home}><div className="home-art"><a className="chat-profile-entry" href="#/profile" aria-label="Open profile"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg></a><h1 className="page-title">Chat AI</h1>{renderBubbles(bubbles)}<div className="home-mascot" aria-hidden="true"/></div><h2 className="hello">Hello,<br/>I'm your INFJ AI assistant! Feel free<br/>to ask me anything!</h2></section>
    <header id="chat-header" className="chat-header" hidden={home}><h1 className="page-title">Chat AI</h1><button id="back" className="back" aria-label="Back to previous step" onClick={onBack}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 4-8 8 8 8"/></svg></button>{renderBubbles(bubbles.slice(0, 2))}<img className="chat-mascot" src="/assets/frog.png" alt="" aria-hidden="true"/></header>
  </>;
}
