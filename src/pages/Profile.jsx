import { ensureDefaultLogin } from '../api/auth';
import { useEffect, useRef, useState } from 'react';
import { mockProfile } from './profileData.js';
import './profile.css';

function Icon({ name, className = '' }) { return <img className={`profile-icon ${className}`} src={`/assets/profile/${name}.svg`} alt=""/>; }
function Arrow() { return <svg className="profile-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>; }
function Panel({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog ref={ref} className="profile-dialog" aria-labelledby="profile-panel-title" onCancel={onClose}><button className="dialog-close" aria-label="Close panel" onClick={onClose}>×</button><h2 id="profile-panel-title">{title}</h2>{children}</dialog>;
}

export default function Profile({ payments = [] }) {
  const [loginState, setLoginState] = useState('loading');
  const [loginError, setLoginError] = useState('');
  const [loginAttempt, setLoginAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoginState('loading'); setLoginError('');
    ensureDefaultLogin().then(() => { if (active) setLoginState('ready'); }).catch(error => {
      if (active) { setLoginState('error'); setLoginError(error.message); }
    });
    return () => { active = false; };
  }, [loginAttempt]);
  const pyusd = payments.filter(payment => payment.method === 'pyusd').reduce((sum, payment) => sum + payment.amount, 0);
  const creditPoints = payments.reduce((sum, payment) => sum + (payment.credit ?? 100), 0);
  const [profile, setProfile] = useState(mockProfile), [menu, setMenu] = useState(null), [panel, setPanel] = useState(null), [notice, setNotice] = useState('');
  const timer = useRef(null), pageRef = useRef(null);
  function notify(text) { setNotice(text); clearTimeout(timer.current); timer.current = setTimeout(() => setNotice(''), 3500); }
  useEffect(() => {
    const close = event => { if (event.key === 'Escape') setMenu(null); };
    const resize = () => pageRef.current?.style.setProperty('--profile-height', `${window.visualViewport?.height ?? window.innerHeight}px`);
    resize(); window.visualViewport?.addEventListener('resize', resize); window.addEventListener('resize', resize); document.addEventListener('keydown', close);
    return () => { clearTimeout(timer.current); window.visualViewport?.removeEventListener('resize', resize); window.removeEventListener('resize', resize); document.removeEventListener('keydown', close); };
  }, []);
  function open(name) { setMenu(null); setPanel(name); }
  async function share() {
    try { await navigator.clipboard.writeText(`${location.origin}${location.pathname}#/profile`); notify('Profile link copied.'); }
    catch { open('Share profile'); }
  }
  const propertyRows = profile.properties.map(item => <div className="profile-detail-row" key={item.name}><img src={item.image} alt=""/><div><strong>{item.name}</strong><small>{item.location}</small></div></div>);
  function panelContent() {
    switch (panel) {
      case 'Following': case 'Followers': return <><p className="profile-muted">Sample members from this demo profile.</p>{profile.people.map(person => <div className="profile-detail-row" key={person.name}><span className="profile-initials">{person.initials}</span><div><strong>{person.name}</strong><small>{person.location}</small></div></div>)}</>;
      case 'Wallet': case 'Assets': return <>{payments.length > 0 && <div className="profile-detail-row"><img src="/assets/pyusd.svg" alt=""/><strong>PYUSD</strong><b className="profile-amount">{pyusd.toFixed(2)}</b></div>}<p className="profile-muted">Demo balances · No real assets</p>{profile.balances.map(balance => <div className="profile-detail-row" key={balance.label}><Icon name={balance.icon}/><strong>{balance.label}</strong><b className="profile-amount">{balance.amount.toLocaleString('en-US')}</b></div>)}</>;
      case 'Properties': return propertyRows;
      case 'Posts': return profile.posts.map(post => <article className="profile-post" key={post.title}><img src={post.image} alt=""/><small>{post.date}</small><h3>{post.title}</h3><p>{post.body}</p></article>);
      case 'Gallery': return <><p className="profile-muted">Your demo collection</p><div className="profile-gallery">{profile.properties.map(item => <figure key={item.name}><img src={item.image} alt={item.name}/><figcaption>{item.name}</figcaption></figure>)}</div></>;
      case 'Mastercard': return <div className="mastercard-eligibility"><div className="mastercard-mark" aria-hidden="true"><i/><i/></div><h3>You’re eligible to apply</h3><p>Your credit level has been upgraded. Credit Score +{creditPoints}.</p><p className="profile-muted">Demo eligibility only. No real credit application has been submitted.</p><button className="profile-primary" onClick={() => setPanel(null)}>Done</button></div>;
      case 'Equipment': return <div className="profile-equipment"><img src="/assets/frog.png" alt="Pink flower frog outfit"/><h3>Flower Frog</h3><p>Currently equipped in this demo.</p><button className="profile-primary" onClick={() => setPanel(null)}>Done</button></div>;
      case 'Poll': case 'Help & Earn': return <><p className="profile-muted">Sample tasks for {profile.displayName}</p>{(panel === 'Poll' ? profile.polls : profile.tasks).map(item => <div className="profile-detail-row" key={item.title}><Icon name={panel === 'Poll' ? 'poll' : 'task'}/><div><strong>{item.title}</strong><small>{item.detail}</small></div></div>)}</>;
      case 'Settings': return <form className="profile-settings" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); setProfile(previous => ({ ...previous, displayName: String(data.get('name')).trim() || previous.displayName, bio: String(data.get('bio')).trim() })); setPanel(null); notify('Demo profile updated.'); }}><p className="profile-muted">Changes stay in this page and reset on reload.</p><label>Display name<input name="name" required maxLength={40} defaultValue={profile.displayName}/></label><label>Bio<textarea name="bio" rows={4} maxLength={240} defaultValue={profile.bio}/></label><button className="profile-primary" type="submit">Save changes</button></form>;
      case 'Log out': return <><p>This is a demo profile. Reset your local changes and return to Chat AI?</p><div className="profile-dialog-actions"><button className="profile-secondary" onClick={() => setPanel(null)}>Cancel</button><button className="profile-primary" onClick={() => { setProfile(mockProfile); location.hash = '/chat'; }}>Log out of demo</button></div></>;
      case 'Share profile': return <><p>Copy this link to open the demo profile.</p><input className="profile-share-url" aria-label="Profile link" readOnly value={`${location.origin}${location.pathname}#/profile`} onFocus={event => event.target.select()}/></>;
      default: return null;
    }
  }
  return <main ref={pageRef} className="profile-page" aria-label="Demo profile">
    <div className="profile-scroll" onScroll={() => setMenu(null)}>
      {loginState !== 'ready' && <div className="profile-login-status" role={loginState === 'error' ? 'alert' : 'status'}>{loginState === 'loading' ? 'Signing in…' : <>{loginError} <button onClick={() => setLoginAttempt(value => value + 1)}>Retry sign in</button></>}</div>}
      <section className="profile-hero">
        <img className="profile-cover" src={profile.avatar} alt={`${profile.displayName} profile photo`}/>
        <div className="profile-cover-fade"/>
        <header className="profile-nav"><a href="#/chat" className="profile-round" aria-label="Back to Chat AI"><svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg></a><a className="profile-dashboard-link" href="#/dashboard">Dashboard</a><div><button className="profile-round" aria-label="Share profile" onClick={share}><Icon name="share"/></button><button className="profile-round" aria-label="Profile options" aria-expanded={menu === 'settings'} onClick={() => setMenu(menu === 'settings' ? null : 'settings')}><Icon name="ddd"/></button></div></header>
        <div className="profile-traits"><span title={profile.constellation}><Icon name="constellation_virgo"/><span className="sr-only">Virgo</span></span><span title={profile.gender}><Icon name="gender_male"/><span className="sr-only">Male</span></span><span title={profile.mbti}><Icon name="mbti_INFJ"/><span className="sr-only">INFJ</span></span></div>
        <div className="profile-identity"><span className="profile-demo">Demo profile</span><h1><span className="profile-platform"><Icon name="sns_logo_google"/></span>{profile.displayName}</h1><p><Icon name="location"/>{profile.country}</p></div>
        <button className="profile-outfit" aria-label="Open Chat AI" onClick={() => { location.hash = '/chat'; }}><img src="/assets/frog.png" alt="Pink frog outfit"/></button>
        {menu === 'settings' && <><button className="profile-dismiss" aria-label="Dismiss options" onClick={() => setMenu(null)}/><div className="profile-popover profile-options"><button onClick={() => open('Settings')}><Icon name="setting"/>Settings</button><button onClick={() => open('Log out')}><Icon name="logout"/>Log out</button></div></>}
      </section>
      <div className="profile-body"><button className="profile-entry" onClick={() => { location.hash = '/dashboard'; }}><strong>Business dashboard</strong><Arrow/></button>
        <p className="profile-bio"><b>BIO:</b> {profile.bio}</p>
        <div className="profile-social"><div className="profile-follow"><button onClick={() => open('Following')}><strong>{profile.followings}</strong><span>Following</span></button><button onClick={() => open('Followers')}><strong>{profile.followers}</strong><span>Followers</span></button></div><div className="profile-task-wrap"><button className="profile-primary" aria-expanded={menu === 'tasks'} onClick={() => setMenu(menu === 'tasks' ? null : 'tasks')}>Task management</button>{menu === 'tasks' && <><button className="profile-dismiss" aria-label="Dismiss tasks" onClick={() => setMenu(null)}/><div className="profile-popover profile-task-menu"><button onClick={() => open('Poll')}><Icon name="poll"/>Poll</button><button onClick={() => open('Help & Earn')}><Icon name="task"/>Help &amp; Earn</button></div></>}</div></div>
        {payments.length > 0 && <section className="profile-credit-dashboard" aria-label="Payment dashboard"><div><span>Rosen wallet · Demo</span><strong>{pyusd.toFixed(2)} PYUSD</strong></div><button onClick={() => open('Wallet')}>View wallet <Arrow/></button><p>Credit Score <b>+{creditPoints}</b><span>Level upgraded</span></p><button className="profile-primary" onClick={() => open('Mastercard')}>Mastercard · Eligible to apply</button></section>}
        <section className="profile-wallet" aria-label="Assets"><button className="profile-refresh" aria-label="Refresh balances" onClick={() => notify('Demo balances are up to date.')}><svg viewBox="0 0 24 24"><path d="M20 7v5h-5M4 17v-5h5M19 11a7 7 0 0 0-12-5L4 9m16 6-3 3a7 7 0 0 1-12-5"/></svg></button><button className="profile-wallet-main" aria-label="Open wallet" onClick={() => open('Wallet')}><span className="profile-wallet-mark"><Icon name="wallet2"/></span>{profile.balances.map(balance => <span className="profile-balance" key={balance.label}><strong>{balance.amount.toLocaleString('en-US')}</strong><span><i><Icon name={balance.icon}/></i>{balance.label}</span></span>)}</button></section>
        <button className="profile-entry" onClick={() => open('Properties')}><strong>Properties</strong><span className="profile-thumbnails">{profile.properties.map(item => <img key={item.name} src={item.image} alt=""/>)}</span><Arrow/></button>
        <button className="profile-entry profile-post-entry" onClick={() => open('Posts')}><strong>Posts</strong><span className="profile-thumbnails">{profile.posts.map(item => <img key={item.title} src={item.image} alt=""/>)}</span><Arrow/></button>
        <div className="profile-tags-section">{[['Want', 'want', profile.wants], ['Offer', 'offer', profile.offers]].map(([label, icon, tags]) => <section className="profile-tags-card" key={label}><h2><Icon name={icon}/>{label}</h2><div className="profile-tags">{tags.map(tag => <span key={tag.label}><Icon name={tag.icon}/>{tag.label}</span>)}</div></section>)}</div>
        <nav className="profile-shortcuts" aria-label="Profile collections">{[['Properties','cell_property'],['Gallery','cell_nft'],['Assets','cell_assets']].map(([label,icon]) => <button key={label} onClick={() => open(label)}><Icon name={icon}/>{label}</button>)}</nav>
      </div>
    </div>
    {notice && <div className="profile-toast" role="status">{notice}</div>}
    {panel && <Panel title={panel} onClose={() => setPanel(null)}>{panelContent()}</Panel>}
  </main>;
}
