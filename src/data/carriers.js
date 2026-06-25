// ── CARRIER DATA + QUOTE ENGINE (DUMMY) ──
// This module replicates the local pricing logic from the original HTML mockup.
// When the real API is ready, replace `fetchQuotes()` with a network call and
// keep the same return shape so the UI doesn't need to change.

export const carriers = [
  { id: 'banner',     name: 'Banner Life Insurance',  abbr: 'BAN\nNER',  product: 'OPTerm',            rating: 'A+', nicotineFriendly: true,  instant: false, base: { M: { 10: 16, 15: 21, 20: 27, 25: 34, 30: 40 }, F: { 10: 13, 15: 17, 20: 22, 25: 28, 30: 33 } } },
  { id: 'symetra',    name: 'Symetra Life Insurance', abbr: 'SYM\nETR',  product: 'SwiftTerm',         rating: 'A',  nicotineFriendly: true,  instant: true,  base: { M: { 10: 18, 15: 23, 20: 31, 25: 39, 30: 46 }, F: { 10: 15, 15: 19, 20: 25, 25: 31, 30: 37 } } },
  { id: 'protective', name: 'Protective Life',         abbr: 'PRO\nTEC',  product: 'Classic Choice Term', rating: 'A+', nicotineFriendly: false, instant: false, base: { M: { 10: 19, 15: 24, 20: 33, 25: 41, 30: 48 }, F: { 10: 16, 15: 20, 20: 26, 25: 33, 30: 39 } } },
  { id: 'pacific',    name: 'Pacific Life',            abbr: 'PAC\nLIF',  product: 'PL Promise Term',   rating: 'A+', nicotineFriendly: false, instant: false, base: { M: { 10: 20, 15: 26, 20: 36, 25: 44, 30: 52 }, F: { 10: 17, 15: 21, 20: 28, 25: 35, 30: 42 } } },
  { id: 'corebridge', name: 'Corebridge Financial',    abbr: 'CORE\nBRG', product: 'AG Select-a-Term',  rating: 'A',  nicotineFriendly: true,  instant: false, base: { M: { 10: 21, 15: 27, 20: 37, 25: 45, 30: 53 }, F: { 10: 17, 15: 22, 20: 29, 25: 37, 30: 44 } } },
  { id: 'cincinnati', name: 'Cincinnati Life',         abbr: 'CIN\nLIF',  product: 'LifeHorizons Term', rating: 'A+', nicotineFriendly: true,  instant: false, base: { M: { 10: 22, 15: 28, 20: 38, 25: 47, 30: 55 }, F: { 10: 18, 15: 23, 20: 31, 25: 39, 30: 46 } } },
  { id: 'mutual',     name: 'Mutual of Omaha',         abbr: 'MUT\nOMA',  product: 'Term Life Answers', rating: 'A+', nicotineFriendly: false, instant: true,  base: { M: { 10: 23, 15: 30, 20: 41, 25: 50, 30: 58 }, F: { 10: 19, 15: 25, 20: 33, 25: 41, 30: 49 } } },
  { id: 'nationwide', name: 'Nationwide Life',         abbr: 'NAT\nWID',  product: 'YourLife Term',     rating: 'A+', nicotineFriendly: false, instant: false, base: { M: { 10: 24, 15: 31, 20: 43, 25: 53, 30: 62 }, F: { 10: 20, 15: 26, 20: 35, 25: 43, 30: 51 } } },
  { id: 'penn',       name: 'Penn Mutual Life',        abbr: 'PENN\nMUT', product: 'Guaranteed Choice',  rating: 'A+', nicotineFriendly: false, instant: false, base: { M: { 10: 25, 15: 33, 20: 45, 25: 55, 30: 65 }, F: { 10: 21, 15: 27, 20: 36, 25: 45, 30: 54 } } },
  { id: 'legal',      name: 'Legal & General',         abbr: 'L&G\nUSA',  product: 'Banner Term',        rating: 'A+', nicotineFriendly: true,  instant: true,  base: { M: { 10: 17, 15: 22, 20: 30, 25: 38, 30: 44 }, F: { 10: 14, 15: 18, 20: 24, 25: 30, 30: 36 } } },
];

export function getAge(dob) {
  if (!dob) return 38;
  const d = new Date(dob), now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

function getAgeFactor(age) {
  if (age < 30) return 0.65;
  if (age < 35) return 0.80;
  if (age < 40) return 1.00;
  if (age < 45) return 1.30;
  if (age < 50) return 1.70;
  if (age < 55) return 2.20;
  if (age < 60) return 2.90;
  return 3.80;
}

function getCoverageFactor(coverage) {
  return coverage / 500000;
}

function getNicotineFactor(type, carrier, cigarFreq) {
  if (type === 'none') return 1.0;
  if (type === 'cigarettes') return carrier.nicotineFriendly ? 2.4 : 2.8;
  if (type === 'vape') return carrier.nicotineFriendly ? 1.3 : 1.6;
  if (['pouches', 'gum', 'patch'].includes(type)) return carrier.nicotineFriendly ? 1.0 : 1.25;
  if (['dip', 'chew'].includes(type)) return carrier.nicotineFriendly ? 1.1 : 1.4;
  if (type === 'cigars') {
    // All three tiers qualify for non-smoker rates at the right carrier
    if (cigarFreq === 'low') return carrier.nicotineFriendly ? 1.0 : 1.10;
    if (cigarFreq === 'mid') return carrier.nicotineFriendly ? 1.0 : 1.20;
    if (cigarFreq === 'high') return carrier.nicotineFriendly ? 1.05 : 1.30;
  }
  return 1.15;
}

function getHealthClass(nicotine, carrier, cigarFreq) {
  if (nicotine === 'none') return 'Preferred Plus';
  if (['pouches', 'gum', 'patch'].includes(nicotine) && carrier.nicotineFriendly) return 'Preferred (Non-Tobacco)';
  if (nicotine === 'cigarettes') return 'Standard Tobacco';
  if (nicotine === 'cigars') {
    if (carrier.nicotineFriendly) {
      if (cigarFreq === 'low') return 'Preferred Plus (Non-Tobacco)';
      if (cigarFreq === 'mid') return 'Preferred (Non-Tobacco)';
      return 'Standard Plus (Non-Tobacco)';
    }
    if (cigarFreq === 'low') return 'Preferred (Non-Tobacco)';
    return 'Standard Plus';
  }
  if (carrier.nicotineFriendly) return 'Preferred (Non-Tobacco)';
  return 'Standard Plus';
}

function calcPremium(carrier, sex, term, coverage, age, nicotine, cigarFreq) {
  const base = carrier.base[sex]?.[term] || carrier.base['M'][20];
  const price = Math.round(base * getAgeFactor(age) * getCoverageFactor(coverage) * getNicotineFactor(nicotine, carrier, cigarFreq));
  return Math.max(price, 14);
}

export function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

/**
 * DUMMY quote generator — computes quotes locally (no network).
 * Used as a fallback while the real CompuLife API is being validated.
 */
export function computeDummyQuotes(input) {
  const { name, dob, sex, state, coverage, term, nicotine, cigarFreq } = input;
  const age = getAge(dob);
  return carriers.map((c) => ({
    ...c, // keeps carrier `name`, `abbr`, `rating`, etc.
    premium: calcPremium(c, sex, term, coverage, age, nicotine, cigarFreq),
    healthClass: getHealthClass(nicotine, c, cigarFreq),
    coverageAmt: coverage,
    termLen: term,
    applicantName: name,
    age, sex, state, dob, nicotine, cigarFreq,
  }));
}

const TERM_TO_CATEGORY = { 10: '3', 15: '4', 20: '5', 25: '6', 30: '7', 35: '9', 40: '0' };

// Build the CompuLife payload from the form inputs (best-effort; refine once we
// see the real response shape in the Vercel logs).
function buildCompulifePayload(input) {
  const { dob, sex, coverage, term, nicotine, heightFt, heightIn, weight } = input;
  const age = getAge(dob);
  const birthYear = new Date().getFullYear() - age;
  const feet = parseInt(heightFt) || 5;
  const inches = parseInt(heightIn) || 8;
  const lbs = parseInt(weight) || 180;
  const heightInInches = feet * 12 + inches;
  const bmi = (lbs / (heightInInches * heightInInches)) * 703;

  const nicotinePouch = nicotine === 'pouches' ? 'Y' : 'N';
  let health;
  if (nicotinePouch === 'Y') health = bmi < 30 ? 'RP' : 'R';
  else health = bmi < 25 ? 'PP' : bmi < 30 ? 'P' : bmi < 35 ? 'RP' : 'R';

  return {
    State: 5,
    BirthMonth: 1,
    Birthday: 1,
    BirthYear: birthYear,
    Sex: sex || 'M',
    Smoker: nicotine === 'cigarettes' ? 'Y' : 'N',
    Health: health,
    NewCategory: TERM_TO_CATEGORY[term] || '5',
    FaceAmount: String(coverage),
    ModeUsed: 'M',
    SortOverride1: 'A',
    LANGUAGE: 'E',
    UserLocation: 'json',
    CompRating: '4',
    DoHeightWeight: 'ON',
    Feet: feet,
    Inches: inches,
    Weight: lbs,
    DoSubAbuse: 'ON',
    NitocinePouch: nicotinePouch,
  };
}

// Map a raw CompuLife result row into the shape the UI cards expect.
// NOTE: rating / nicotineFriendly / instant aren't returned by CompuLife yet —
// we'll finalize this mapping after seeing the real logged response.
function mapCompulifeResult(row, input, idx) {
  const { name, dob, sex, state, coverage, term, nicotine, cigarFreq } = input;
  const company = row.Compulife_company || `Carrier ${idx + 1}`;
  const monthly = parseFloat(row.Compulife_premiumM);
  const annual = parseFloat(row.Compulife_premiumAnnual);
  const premium = !isNaN(monthly) ? Math.round(monthly) : Math.round((annual || 0) / 12);
  return {
    id: `cl-${idx}`,
    name: company,
    abbr: company.replace(/[^A-Za-z]/g, '').slice(0, 6).toUpperCase() || 'CARRIER',
    product: row.Compulife_product || 'Term Life',
    rating: row.Compulife_amBest || row.Compulife_rating || 'A',
    nicotineFriendly: false,
    instant: false,
    premium,
    healthClass: getHealthClass(nicotine, { nicotineFriendly: false }, cigarFreq),
    coverageAmt: coverage,
    termLen: term,
    applicantName: name,
    age: getAge(dob), sex, state, dob, nicotine, cigarFreq,
    _raw: row,
  };
}

/**
 * Fetch quotes from the real backend (/api/quote → CompuLife).
 * Logs the request and response to the browser console, and falls back to
 * locally-computed dummy quotes if the API fails or returns nothing — so the
 * UI keeps working while the API is being validated on the hosting platform.
 *
 * @param {{ name, dob, sex, state, coverage, term, nicotine, cigarFreq, heightFt, heightIn, weight }} input
 * @returns {Promise<Array>} list of quote objects in the UI shape
 */
export async function fetchQuotes(input) {
  const payload = buildCompulifePayload(input);
  console.log('[fetchQuotes] → POST /api/quote', { COMPULIFE: payload });

  try {
    const res = await fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ COMPULIFE: payload }),
    });

    const text = await res.text();
    console.log('[fetchQuotes] ← status', res.status, 'raw body:', text);

    if (!res.ok) {
      console.warn('[fetchQuotes] API returned an error — using dummy data fallback.');
      return computeDummyQuotes(input);
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      console.warn('[fetchQuotes] Response was not JSON — using dummy data fallback.');
      return computeDummyQuotes(input);
    }
    console.log('[fetchQuotes] parsed response:', json);

    const rows = json?.Compulife_ComparisonResults?.Compulife_Results || [];
    console.log('[fetchQuotes] result rows found:', rows.length);

    if (!rows.length) {
      console.warn('[fetchQuotes] No quote rows in response — using dummy data fallback.');
      return computeDummyQuotes(input);
    }

    return rows.map((row, i) => mapCompulifeResult(row, input, i));
  } catch (e) {
    console.error('[fetchQuotes] Network/exception — using dummy data fallback:', e);
    return computeDummyQuotes(input);
  }
}
