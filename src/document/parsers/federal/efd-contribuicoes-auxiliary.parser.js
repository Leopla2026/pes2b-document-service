const crypto = require('node:crypto');

function md5(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex').toUpperCase();
}

function isoDate(value) {
  const match = String(value || '').match(/^(\d{2})(\d{2})(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function parseTxt(buffer) {
  const text = new TextDecoder('windows-1252').decode(buffer);
  const record = text.split(/\r?\n/).find(line => line.startsWith('|0000|'));

  if (!record) throw new Error('Registro 0000 não encontrado no arquivo TXT.');

  const fields = record.split('|');
  const start = fields[6];
  const end = fields[7];
  const startMatch = String(start || '').match(/^(\d{2})(\d{2})(\d{4})$/);
  const endMatch = String(end || '').match(/^(\d{2})(\d{2})(\d{4})$/);

  if (!startMatch || !endMatch || !fields[8] || !/^\d{14}$/.test(fields[9] || '')) {
    throw new Error('Registro 0000 incompleto ou inválido.');
  }

  const competence = startMatch[2] === endMatch[2] && startMatch[3] === endMatch[3]
    ? `${startMatch[2]}/${startMatch[3]}`
    : null;

  return {
    success: true,
    tipoArquivo: 'EFD_CONTRIBUICOES_TXT',
    cnpj: fields[9],
    empresa: fields[8],
    dataInicial: isoDate(start),
    dataFinal: isoDate(end),
    competencia: competence,
    md5: md5(buffer)
  };
}

function parseRec(buffer) {
  const text = buffer.toString('ascii').trim();
  const match = text.match(
    /^RCP01(\d{14})(\d{14})([A-F0-9]+)\s+([A-F0-9]{32})\s+(.+)$/i
  );

  if (!match) throw new Error('Arquivo REC não corresponde ao layout RCP01 suportado.');

  const dateTime = match[2].match(
    /^(\d{2})(\d{2})(\d{4})(\d{2})(\d{2})(\d{2})$/
  );

  return {
    success: true,
    tipoArquivo: 'EFD_CONTRIBUICOES_REC',
    formato: 'RCP01',
    cnpj: match[1],
    dataHora: dateTime
      ? `${dateTime[3]}-${dateTime[2]}-${dateTime[1]}T${dateTime[4]}:${dateTime[5]}:${dateTime[6]}`
      : null,
    md5TxtReferenciado: match[4].toUpperCase(),
    identificadorTecnico1: match[3],
    identificadorTecnico2: match[5].trim()
  };
}

module.exports = { parseTxt, parseRec };
