function first(text, regex) {
  const match = String(text || '').match(regex);
  return match?.[1]?.replace(/\s+/g, ' ').trim() || null;
}

function money(value) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value)
    .replace(/R\$/gi, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function isoDate(value) {
  const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

function competenceFromRange(start, end) {
  const startMatch = String(start || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const endMatch = String(end || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!startMatch || !endMatch) return null;
  if (startMatch[2] !== endMatch[2] || startMatch[3] !== endMatch[3]) return null;
  return `${startMatch[2]}/${startMatch[3]}`;
}

function normalizeCompetence(value) {
  if (!value) return null;
  const months = {
    janeiro: '01', fevereiro: '02', marco: '03', março: '03', abril: '04',
    maio: '05', junho: '06', julho: '07', agosto: '08', setembro: '09',
    outubro: '10', novembro: '11', dezembro: '12'
  };
  const normalized = String(value).toLowerCase();
  for (const [name, month] of Object.entries(months)) {
    const match = normalized.match(new RegExp(`${name}\\/(\\d{4})`));
    if (match) return `${month}/${match[1]}`;
  }

  const date = String(value).match(/\b\d{2}\/(0[1-9]|1[0-2])\/(\d{4})\b/);
  if (date) return `${date[1]}/${date[2]}`;

  const direct = String(value).match(/\b(0[1-9]|1[0-2])\/(\d{4})\b/);
  if (direct) return `${direct[1]}/${direct[2]}`;
  return null;
}

function cnpj(text) {
  return String(text || '').match(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/)?.[0] || null;
}

function taxFrom(value) {
  const normalized = String(value || '').toUpperCase();
  if (/\bPIS(?:\/PASEP)?\b/.test(normalized)) return 'PIS';
  if (/\bCOFINS\b/.test(normalized)) return 'COFINS';
  if (/\bIRPJ\b/.test(normalized)) return 'IRPJ';
  if (/\bCSLL\b/.test(normalized)) return 'CSLL';
  return 'OUTRO';
}

function booleanPt(value) {
  if (!value) return null;
  const normalized = String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
  if (normalized === 'SIM') return true;
  if (normalized === 'NAO') return false;
  return null;
}

module.exports = {
  first,
  money,
  isoDate,
  competenceFromRange,
  normalizeCompetence,
  cnpj,
  taxFrom,
  booleanPt
};
