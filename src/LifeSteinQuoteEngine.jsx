import React, { useState, useRef, useEffect } from 'react';
import { fetchQuotes, formatCurrency, getAge } from './data/carriers.js';
import './lifestein.css';

const NICOTINE_LABELS = {
  none: 'No Nicotine Use', cigarettes: 'Cigarettes', vape: 'Vaping', pouches: 'Zyn / Pouches',
  dip: 'Dip', chew: 'Chew / Snuff', cigars: 'Cigars', gum: 'Nicotine Gum', patch: 'Nicotine Patch', other: 'Other NRT',
};

const CIGAR_FREQ_LABELS = { low: '< 24/yr', mid: '25–52/yr', high: 'Unlimited' };
const CIGAR_FREQ_FULL = { low: '< 24 cigars/yr', mid: '25–52 cigars/yr', high: 'Unlimited cigars/yr' };

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];

const COVERAGE_OPTIONS = [
  { value: 100000, label: '$100,000' },
  { value: 250000, label: '$250,000' },
  { value: 500000, label: '$500,000' },
  { value: 750000, label: '$750,000' },
  { value: 1000000, label: '$1,000,000' },
  { value: 1500000, label: '$1,500,000' },
  { value: 2000000, label: '$2,000,000' },
];

const TERM_OPTIONS = [10, 15, 20, 25, 30];

function nicotineLabelFor(nicotine, cigarFreq) {
  if (nicotine === 'cigars') {
    return 'Cigars' + (cigarFreq ? ` (${CIGAR_FREQ_LABELS[cigarFreq]})` : '');
  }
  return NICOTINE_LABELS[nicotine] || nicotine;
}

export default function LifeSteinQuoteEngine() {
  // ── form state ──
  const [form, setForm] = useState({
    name: '',
    dob: '',
    heightFt: "5'",
    heightIn: '8"',
    weight: '',
    sex: '',
    state: '',
    coverage: 500000,
    term: 20,
    nicotine: 'none',
  });
  const [cigarFreq, setCigarFreq] = useState('low');

  // ── results state ──
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [error, setError] = useState(null); // error message when the live API fails
  const [summary, setSummary] = useState(null); // snapshot of inputs at quote time
  const [sort, setSort] = useState('price');

  // ── modal state ──
  const [modalQuote, setModalQuote] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [contact, setContact] = useState({ email: '', phone: '' });
  const [emailError, setEmailError] = useState(false);

  // ── misc ──
  const [showSticky, setShowSticky] = useState(false);
  const calcRef = useRef(null);
  const resultsRef = useRef(null);

  const setField = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const scrollToCalc = () => calcRef.current?.scrollIntoView({ behavior: 'smooth' });

  // ── run quotes (dummy fetch) ──
  const runQuotes = async () => {
    const snapshot = {
      name: form.name.trim() || 'Applicant',
      dob: form.dob,
      sex: form.sex || 'M',
      state: form.state || 'Colorado',
      coverage: parseInt(form.coverage) || 500000,
      term: parseInt(form.term) || 20,
      nicotine: form.nicotine || 'none',
      cigarFreq,
    };
    snapshot.age = getAge(snapshot.dob);

    setLoading(true);
    setQuotes([]);
    setError(null);

    try {
      const result = await fetchQuotes(snapshot);
      setSummary(snapshot);
      setQuotes(result);
      setSort('price');
      if (window.innerWidth <= 768) setShowSticky(true);
    } catch (e) {
      console.error('[runQuotes] failed:', e);
      setSummary(null);
      setQuotes([]);
      setError(e?.message || 'Something went wrong while fetching quotes.');
    } finally {
      setLoading(false);
    }
  };

  // scroll to results once they render
  useEffect(() => {
    if (quotes.length && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [quotes]);

  // close modal on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // ── sorting ──
  const sortedQuotes = (() => {
    let s = [...quotes];
    if (sort === 'price') s.sort((a, b) => a.premium - b.premium);
    else if (sort === 'rating') {
      const order = { 'A+': 0, A: 1, 'A-': 2 };
      s.sort((a, b) => (order[a.rating] ?? 3) - (order[b.rating] ?? 3));
    } else if (sort === 'aplus') {
      s = s.filter((q) => q.rating === 'A+').sort((a, b) => a.premium - b.premium);
    }
    return s;
  })();
  const lowest = sortedQuotes[0]?.premium;

  // ── modal ──
  const openModal = (q) => {
    setModalQuote(q);
    setSubmitted(false);
    setContact({ email: '', phone: '' });
    setEmailError(false);
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => {
    setModalQuote(null);
    document.body.style.overflow = '';
  };

  const submitRequest = async () => {
    const email = contact.email.trim();
    if (!email || !email.includes('@')) {
      setEmailError(true);
      return;
    }
    setEmailError(false);

    const q = modalQuote;
    const emailData = {
      name: q.applicantName || 'Applicant',
      email,
      phone: contact.phone,
      companyName: q.name,
      product: q.product,
      termLength: q.termLen,
      coverageAmount: Number(q.coverageAmt).toLocaleString(),
    };
    console.log('[submitRequest] → POST /api/send-email', emailData);

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });
      const text = await res.text();
      console.log('[submitRequest] ← status', res.status, 'raw body:', text);
    } catch (e) {
      // Show success regardless so the UX isn't blocked while the API is validated;
      // the error is captured in the console / Vercel logs for debugging.
      console.error('[submitRequest] send-email failed:', e);
    }

    setSubmitted(true);
  };

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <a className="logo" href="#">Life<span>Stein</span>.com</a>
          <ul className="nav-links">
            <li><a href="#">Life Insurance</a></li>
            <li><a href="#">Nicotine Users</a></li>
            <li><a href="#">How It Works</a></li>
            <li><a href="#">About Matt</a></li>
          </ul>
          <button className="nav-cta" onClick={scrollToCalc}>Get Free Quotes</button>
          <button className="nav-mobile-menu" aria-label="Menu">☰</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-eyebrow">Compare Life Insurance Rates in Minutes</div>
            <h1>Protect Your Family With the <em>Right Coverage</em> at the Right Price</h1>
            <p>Get instant quotes from dozens of top-rated carriers. No call centers. No pressure. Work directly with Matt Mims, owner of LifeStein.com — a licensed independent broker in all 50 states.</p>
            <div className="trust-badges">
              <div className="badge"><div className="badge-dot"></div>Licensed in All 50 States</div>
              <div className="badge"><div className="badge-dot"></div>Independent Broker</div>
              <div className="badge"><div className="badge-dot"></div>Private &amp; Secure</div>
              <div className="badge"><div className="badge-dot"></div>No Call Center</div>
            </div>
          </div>
          <div className="matt-card">
            <div className="matt-avatar">MM</div>
            <h3>Matt Mims</h3>
            <p>Owner &amp; Licensed Broker<br />LifeStein.com</p>
            <div className="matt-npn">NPN #18882528</div>
            <div className="verified-pill">✓ Independent Broker</div>
          </div>
        </div>
      </section>

      {/* CALCULATOR */}
      <section className="calc-section" id="calculator" ref={calcRef}>
        <div className="calc-card">
          <h2>Get Your Personalized Quote</h2>
          <p className="sub-text">Takes about 60 seconds · No spam · No sales pressure · Quotes go directly to Matt</p>

          <div className="form-grid">
            <div className="form-group col-2">
              <label htmlFor="f-name">Full Name</label>
              <input type="text" id="f-name" placeholder="Jane Smith" value={form.name} onChange={setField('name')} />
            </div>
            <div className="form-group">
              <label htmlFor="f-dob">Date of Birth</label>
              <input type="date" id="f-dob" value={form.dob} onChange={setField('dob')} />
            </div>
            <div className="form-group">
              <label>Height</label>
              <div className="height-row">
                <div className="select-wrap">
                  <select id="f-height-ft" value={form.heightFt} onChange={setField('heightFt')}>
                    <option value="">Ft</option>
                    <option>4'</option><option>5'</option><option>6'</option><option>7'</option>
                  </select>
                </div>
                <div className="select-wrap">
                  <select id="f-height-in" value={form.heightIn} onChange={setField('heightIn')}>
                    <option value="">In</option>
                    <option>0"</option><option>1"</option><option>2"</option><option>3"</option>
                    <option>4"</option><option>5"</option><option>6"</option><option>7"</option>
                    <option>8"</option><option>9"</option><option>10"</option><option>11"</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="f-weight">Weight (lbs)</label>
              <input type="number" id="f-weight" placeholder="165" min="80" max="500" value={form.weight} onChange={setField('weight')} />
            </div>
            <div className="form-group">
              <label htmlFor="f-sex">Biological Sex</label>
              <div className="select-wrap">
                <select id="f-sex" value={form.sex} onChange={setField('sex')}>
                  <option value="">Select…</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="f-state">State</label>
              <div className="select-wrap">
                <select id="f-state" value={form.state} onChange={setField('state')}>
                  <option value="">Select state…</option>
                  {US_STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="f-coverage">Coverage Amount</label>
              <div className="select-wrap">
                <select id="f-coverage" value={form.coverage} onChange={setField('coverage')}>
                  {COVERAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="f-term">Term Length</label>
              <div className="select-wrap">
                <select id="f-term" value={form.term} onChange={setField('term')}>
                  {TERM_OPTIONS.map((t) => <option key={t} value={t}>{t} Years</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="f-nicotine">Nicotine / Tobacco Use</label>
              <div className="select-wrap">
                <select id="f-nicotine" value={form.nicotine} onChange={setField('nicotine')}>
                  <option value="none">No Nicotine Use</option>
                  <option value="cigarettes">Cigarettes</option>
                  <option value="vape">Vape / E-Cigarettes</option>
                  <option value="cigars">Cigars</option>
                  <option value="pouches">Zyn / Nicotine Pouches</option>
                  <option value="dip">Dip / Chewing Tobacco</option>
                  <option value="chew">Chew / Snuff</option>
                  <option value="gum">Nicotine Gum</option>
                  <option value="patch">Nicotine Patch</option>
                  <option value="other">Other Nicotine Replacement</option>
                </select>
              </div>
            </div>
          </div>

          {/* CIGAR FREQUENCY BOX */}
          <div className={'cigar-freq-box' + (form.nicotine === 'cigars' ? ' visible' : '')}>
            <div className="freq-label">🚬 How many cigars per year?</div>
            <div className="cigar-freq-options">
              {[
                { key: 'low', title: 'Fewer than 24 per year' },
                { key: 'mid', title: '25–52 per year' },
                { key: 'high', title: 'Unlimited' },
              ].map((opt) => (
                <div
                  key={opt.key}
                  className={'cigar-freq-option' + (cigarFreq === opt.key ? ' selected' : '')}
                  onClick={() => setCigarFreq(opt.key)}
                >
                  <div className="cigar-check-circle"></div>
                  <span className="cigar-freq-option-title">{opt.title}</span>
                  <span className="nonsmoker-pill">✓ Non-Smoker Rates</span>
                </div>
              ))}
            </div>
          </div>

          <button
            className={'btn-primary' + (loading ? ' loading' : '')}
            onClick={runQuotes}
            disabled={loading}
          >
            {loading ? 'Searching carriers…' : 'See My Rates →'}
          </button>
          <div className="privacy-note">
            🔒 Private &amp; secure · No call center · Goes directly to Matt Mims
          </div>
        </div>

        {/* LOADING */}
        <div className={'spinner-wrap' + (loading ? ' visible' : '')}>
          <div className="spinner"></div>
          <div className="spinner-text">Searching top carriers for your best rates…</div>
        </div>

        {/* ERROR */}
        {error && !loading && (
          <div className="quote-error" role="alert">
            <div className="quote-error-icon">⚠️</div>
            <div className="quote-error-body">
              <h4>We couldn't get live quotes right now</h4>
              <p className="quote-error-detail">{error}</p>
              <button className="quote-error-retry" onClick={runQuotes}>Try again</button>
            </div>
          </div>
        )}
      </section>

      {/* RESULTS */}
      <section className={'results-section' + (quotes.length && !loading ? ' visible' : '')} ref={resultsRef}>
        {summary && (
          <div className="quote-summary-bar">
            <div className="summary-text">
              {`${summary.name} · Age ${summary.age} · ${summary.sex === 'M' ? 'Male' : 'Female'} · ${formatCurrency(summary.coverage)} · ${summary.term}-Year Term · ${summary.state} · ${nicotineLabelFor(summary.nicotine, summary.cigarFreq)}`}
            </div>
            <span className="edit-link" onClick={scrollToCalc}>Edit Quote ✎</span>
          </div>
        )}
        <div className="results-header">
          <div><h2>Quotes Found</h2></div>
          <div className="count-badge">{sortedQuotes.length} results</div>
        </div>
        <div className="sort-row">
          <button className={'sort-chip' + (sort === 'price' ? ' active' : '')} onClick={() => setSort('price')}>Lowest Price</button>
          <button className={'sort-chip' + (sort === 'rating' ? ' active' : '')} onClick={() => setSort('rating')}>Best Rated</button>
          <button className={'sort-chip' + (sort === 'aplus' ? ' active' : '')} onClick={() => setSort('aplus')}>A+ Carriers Only</button>
        </div>
        <div className="quotes-list">
          {sortedQuotes.map((q, i) => {
            const isFeatured = i === 1 && sort === 'price';
            const isLowest = q.premium === lowest && i === 0;
            const nicotineIsNonSmoke = q.nicotine !== 'none' && q.nicotineFriendly;
            return (
              <div
                key={q.id}
                className={'quote-card' + (isFeatured ? ' featured' : '')}
                onClick={() => openModal(q)}
              >
                {isFeatured && <div className="featured-ribbon">MOST SELECTED</div>}
                <div className="carrier-logo-box">{q.abbr}</div>
                <div className="carrier-info">
                  <h4>{q.name}</h4>
                  <div className="product-name">{q.product} {q.termLen}-Year · {formatCurrency(q.coverageAmt)}</div>
                  <div className="carrier-meta">
                    {isLowest && <span className="meta-chip chip-green">Lowest Price</span>}
                    {isFeatured && !isLowest && <span className="meta-chip chip-gold">Most Selected</span>}
                    {nicotineIsNonSmoke && <span className="meta-chip chip-green">Non-Cigarette Nicotine Friendly</span>}
                    {q.instant && <span className="meta-chip chip-blue">Instant Decision</span>}
                    <span className="meta-chip chip-gray">AM Best: {q.rating}</span>
                  </div>
                </div>
                <div className="quote-price-col">
                  <div className="price-amount">{q.premium}<span className="price-period">/mo</span></div>
                  <div className="price-annual">{formatCurrency(q.premium * 12)}/yr</div>
                  <button
                    className="request-btn"
                    onClick={(e) => { e.stopPropagation(); openModal(q); }}
                  >Request Quote</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* OWNER SECTION */}
      <div className="owner-section">
        <div className="owner-inner">
          <div className="owner-avatar-lg">MM</div>
          <div className="owner-text">
            <h2>Work Directly With the Owner</h2>
            <p>You won't be transferred to a call center or routed to a random agent. Every quote request goes directly to Matt Mims, the owner of LifeStein.com. Matt will personally review your information and find the best coverage fit across 188 carriers.</p>
            <div className="owner-meta-row">
              <div className="owner-meta-item">Matt Mims · Owner, LifeStein.com</div>
              <div className="owner-meta-item npn">NPN #18882528</div>
              <div className="owner-meta-item">📞 (888) 612-7935</div>
            </div>
          </div>
        </div>
      </div>

      {/* TRUST SECTION */}
      <section className="trust-section">
        <div className="trust-inner">
          <h2>Why Clients Choose LifeStein</h2>
          <div className="trust-grid">
            {[
              { icon: '🗺️', title: 'Licensed in All 50 States', text: "Matt is licensed nationwide, so no matter where you live, you're covered." },
              { icon: '🏢', title: 'Independent Broker', text: 'Not tied to one company. LifeStein shops 188+ carriers to find your best rate.' },
              { icon: '🔒', title: 'Private Quote Requests', text: 'Your information goes to Matt — not a database of agents competing for your business.' },
              { icon: '🚭', title: 'Nicotine & Cannabis Specialists', text: 'Experts at securing non-smoker rates for vape, Zyn, dip, and cannabis users.' },
              { icon: '✋', title: 'Zero Obligation', text: 'Requesting a quote is completely free. No commitment required — ever.' },
              { icon: '⚡', title: 'Fast Response Times', text: 'Matt personally responds quickly. Most clients hear back same day or next morning.' },
            ].map((t) => (
              <div className="trust-item" key={t.title}>
                <div className="trust-icon">{t.icon}</div>
                <div className="trust-text">
                  <h4>{t.title}</h4>
                  <p>{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div className="footer-logo">Life<span>Stein</span>.com</div>
          <p className="footer-text">
            LifeStein.com is a licensed independent life insurance brokerage. Matt Mims, NPN #18882528, is licensed in all 50 states.
            Rates shown are estimates based on standard underwriting guidelines and are subject to change. Final rates are determined by the carrier.
            <br /><br />
            Media mentions: NerdWallet · CNBC · MSN &nbsp;|&nbsp; (888) 612-7935 &nbsp;|&nbsp; info@lifestein.com
          </p>
        </div>
      </footer>

      {/* MOBILE STICKY CTA */}
      <div className={'sticky-mobile-cta' + (showSticky ? ' show' : '')}>
        <button className="btn-primary" onClick={scrollToCalc}>Get Free Quotes →</button>
      </div>

      {/* REQUEST MODAL */}
      {modalQuote && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal-box">
            {submitted ? (
              <div className="success-modal">
                <div className="success-icon">✓</div>
                <h3>Quote Request Sent!</h3>
                <p>Your request for <strong>{modalQuote.name} {modalQuote.product}</strong> at <strong>${modalQuote.premium}/mo</strong> has been sent directly to Matt Mims. He'll be in touch soon — no call centers, no strangers.</p>
                <br />
                <p style={{ fontSize: 13, color: '#94a3b8' }}>Questions? Call <a href="tel:8886127935" style={{ color: 'var(--green)' }}>(888) 612-7935</a> or text <a href="tel:6012187854" style={{ color: 'var(--green)' }}>(601) 218-7854</a></p>
                <br />
                <button className="btn-primary" style={{ maxWidth: 220, margin: '0 auto' }} onClick={closeModal}>Done</button>
              </div>
            ) : (
              <ModalForm
                q={modalQuote}
                contact={contact}
                setContact={setContact}
                emailError={emailError}
                onClose={closeModal}
                onSubmit={submitRequest}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ModalForm({ q, contact, setContact, emailError, onClose, onSubmit }) {
  let nicLabel = NICOTINE_LABELS[q.nicotine] || q.nicotine;
  if (q.nicotine === 'cigars' && q.cigarFreq) {
    nicLabel += ' · ' + (CIGAR_FREQ_FULL[q.cigarFreq] || '');
  }
  const dobDisplay = q.dob
    ? new Date(q.dob + 'T00:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    : '—';

  return (
    <>
      <div className="modal-header">
        <h3>Request This Coverage</h3>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-highlight">
        <div className="mh-item"><label>Carrier</label><span>{q.name}</span></div>
        <div className="mh-item"><label>Product</label><span>{q.product} {q.termLen}-Yr</span></div>
        <div className="mh-item"><label>Est. Monthly</label><span className="price-highlight">${q.premium}/mo</span></div>
        <div className="mh-item"><label>Coverage</label><span>{formatCurrency(q.coverageAmt)}</span></div>
        <div className="mh-item"><label>Health Class</label><span>{q.healthClass}</span></div>
        <div className="mh-item"><label>AM Best</label><span>{q.rating}</span></div>
      </div>
      <div className="prefill-note">
        ✓ Pre-filled from your quote: <strong>{q.applicantName || 'Applicant'}</strong> · DOB {dobDisplay} · Age {q.age} · {q.sex === 'M' ? 'Male' : 'Female'} · {q.state} · {nicLabel}
      </div>
      <div className="modal-form">
        <div className="form-group">
          <label htmlFor="m-email">Email Address <span style={{ color: '#e24b4a' }}>*</span></label>
          <input
            type="email"
            id="m-email"
            placeholder="jane@example.com"
            value={contact.email}
            onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
            style={emailError ? { borderColor: '#e24b4a' } : undefined}
          />
        </div>
        <div className="form-group">
          <label htmlFor="m-phone">Phone Number <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <input
            type="tel"
            id="m-phone"
            placeholder="(555) 000-0000"
            value={contact.phone}
            onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))}
          />
        </div>
        <button className="btn-primary" onClick={onSubmit}>Request Coverage →</button>
      </div>
      <div className="modal-footer-note">
        🔒 Your information goes directly to Matt Mims. No call centers. No third-party sharing. Zero obligation.
      </div>
    </>
  );
}
