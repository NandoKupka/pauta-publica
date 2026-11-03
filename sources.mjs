import { createHash } from 'node:crypto';
export const sources = {
  camara: { name: 'Câmara dos Deputados', short: 'Câmara', label: 'Leis e fiscalização', power: 'Deputados federais', url: 'https://www.camara.leg.br/agenda', note: 'Projetos, emendas e fiscalização do Executivo federal.' },
  senado: { name: 'Senado Federal', short: 'Senado', label: 'Leis e indicações', power: 'Senadores', url: 'https://www25.senado.leg.br/web/atividade/agenda', note: 'Projetos, indicações a cargos e fiscalização federal.' },
  congresso: { name: 'Congresso Nacional', short: 'Congresso', label: 'Vetos e orçamento', power: 'Deputados e senadores em sessão conjunta', url: 'https://www.congressonacional.leg.br/sessoes/agenda-do-congresso-nacional', note: 'Sessões conjuntas, vetos presidenciais e orçamento.' },
  stf: { name: 'Supremo Tribunal Federal', short: 'STF', label: 'Constituição', power: 'Ministros do STF', url: 'https://portal.stf.jus.br/pauta/pesquisarCalendario.asp?aba=processo', note: 'Julgamentos constitucionais e controle de constitucionalidade.' },
  stj: { name: 'Superior Tribunal de Justiça', short: 'STJ', label: 'Leis federais', power: 'Ministros do STJ', url: 'https://www.stj.jus.br/sites/portalp/Paginas/RSS.aspx', note: 'Interpretação das leis federais em casos julgados pelo tribunal.' },
  tse: { name: 'Tribunal Superior Eleitoral', short: 'TSE', label: 'Eleições', power: 'Ministros do TSE', url: 'https://www.tse.jus.br/noticias-em-rss', note: 'Julgamentos e regras da Justiça Eleitoral.' }
};

export const day = (date = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(date);
export const shift = (date, offset) => {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};
export const asList = value => Array.isArray(value) ? value : value ? [value] : [];
const entities = { amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',ndash:'–',mdash:'—',rsquo:'’',lsquo:'‘',rdquo:'”',ldquo:'“' };
export const decode = text => String(text ?? '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, token) => {
  if (token[0] !== '#') return entities[token.toLowerCase()] ?? whole;
  const code = /^#x/i.test(token) ? parseInt(token.slice(2), 16) : Number(token.slice(1));
  return code <= 0x10ffff && code > 0 ? String.fromCodePoint(code) : whole;
});
export const plain = value => decode(String(value ?? '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
export const official = (value, base) => {
  try {
    const url = new URL(value, base);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.port || !/\.(leg|jus)\.br$|(^|\.)senado\.gov\.br$/i.test(url.hostname)) return '';
    url.protocol = 'https:';
    return url.href;
  } catch { return ''; }
};

export function parseFeed(xml, org) {
  if (!/<(?:rss|rdf:RDF)\b/i.test(xml)) throw new Error('Formato RSS inesperado');
  const get = (item, key) => plain(new RegExp('<'+key+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+key+'>','i').exec(item)?.[1]);
  const result = [];
  for (const [i, match] of [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].entries()) {
    const item = match[1], title = get(item,'title'), url = official(get(item,'link'), sources[org].url);
    const rawDate = get(item,'pubDate') || get(item,'dc:date');
    const br = /^(?:[\p{L}]+,\s*)?([\p{L}]{3})\s+(\d{1,2})\s+(\d{4})\s+(\d{2}:\d{2}:\d{2})$/iu.exec(rawDate);
    const month = br ? ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'].indexOf(br[1].toLowerCase())+1 : 0;
    const date = new Date(month ? br[3]+'-'+String(month).padStart(2,'0')+'-'+br[2].padStart(2,'0')+'T'+br[4]+'-03:00' : rawDate);
    if (!title || !url || !Number.isFinite(+date)) continue;
    result.push({ id: org+'-'+createHash('sha256').update(url).digest('hex').slice(0,20), org, type: 'noticias', title, date: day(date), status: 'Notícia oficial', url });
  }
  if (!result.length) throw new Error('Feed sem itens válidos');
  return [...new Map(result.map(row=>[row.url,row])).values()];
}

export function parseCalendar(ics) {
  if (!/^BEGIN:VCALENDAR/m.test(ics)) throw new Error('Calendário inválido');
  const out = [];
  for (const [, event] of ics.replace(/\r?\n[ \t]/g, '').matchAll(/BEGIN:VEVENT\r?\n([\s\S]*?)END:VEVENT/g)) {
    const get = key => new RegExp('^'+key+'(?:;[^:\\r\\n]+)?:([^\\r\\n]*)','m').exec(event)?.[1]?.replace(/\\([,;\\])/g,'$1').replace(/\\n/gi,'\n') ?? '';
    const [raw, y,m,d,h,min] = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/.exec(get('DTSTART')) ?? [];
    const uid = get('UID'), house = get('ORGANIZER');
    if (!raw || !/^\d+$/.test(uid) || !['CN','SF'].includes(house)) continue;
    const org = house === 'CN' ? 'congresso' : 'senado';
    const date = y+'-'+m+'-'+d;
    const url = org === 'senado' ? 'https://legis.senado.leg.br/ordiaportal/casa/SF/'+d+'/'+m+'/'+y : 'https://legis.senado.leg.br/ordiaportal/casa/CN/'+d+'/'+m+'/'+y;
    const description = get('DESCRIPTION');
    const status = description.match(/Situação:\s*([^\n]+)/i)?.[1] ?? 'Sessão prevista';
    const title = get('SUMMARY').replace(/\s+às\s+\d{1,2}[:h]\d{2}h?\.?$/i, '').trim();
    if (!title) continue;
    out.push({ id: org+'-'+uid, uid, org, type:'agenda', date, time: h ? h+':'+min : '', title, status, url, body: get('LOCATION'), items: description.split('\n').filter(line => /^\d+\.\s/.test(line)).map(line => line.replace(/^\d+\.\s*/,'')) });
  }
  return out;
}
