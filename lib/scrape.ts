import * as cheerio from 'cheerio';

export type BridgeStatusResult = {
  bridgeName: string;
  status: 'UP' | 'DOWN' | 'UNKNOWN';
  rawStatus: string;
  location?: string;
  roadway?: string;
  county?: string;
  checkedAt: string;
  sourceUrl: string;
  note?: string;
};

const SOURCE_URL = process.env.FL511_SOURCE_URL || 'https://fl511.com/list/bridge';
const BRIDGE_NAME_MATCH = (process.env.BRIDGE_NAME_MATCH || 'Brickell Avenue Bridge').toLowerCase();

function normalizeWhitespace(input: string) {
  return input.replace(/\s+/g, ' ').trim();
}

function mapStatus(rawStatus: string): 'UP' | 'DOWN' | 'UNKNOWN' {
  const s = rawStatus.toLowerCase();
  if (s.includes('bridge up') || s === 'up') return 'UP';
  if (s.includes('bridge down') || s === 'down') return 'DOWN';
  return 'UNKNOWN';
}

function extractStructuredRow($: cheerio.CheerioAPI): Omit<BridgeStatusResult, 'checkedAt' | 'sourceUrl'> | null {
  const tables = $('table');

  for (let i = 0; i < tables.length; i += 1) {
    const table = tables.eq(i);
    const rows = table.find('tr').toArray();

    for (const row of rows) {
      const cells = $(row)
        .find('th,td')
        .map((__, cell) => normalizeWhitespace($(cell).text()))
        .get()
        .filter(Boolean);

      if (cells.length >= 2 && cells.join(' ').toLowerCase().includes(BRIDGE_NAME_MATCH)) {
        const joined = cells.join(' | ');
        const rawStatus = cells[cells.length - 1] || 'Unknown';

        return {
          bridgeName: cells[0] || 'Brickell Avenue Bridge',
          location: cells[1],
          roadway: cells[2],
          county: cells.length >= 5 ? cells[cells.length - 2] : undefined,
          rawStatus,
          status: mapStatus(rawStatus),
          note: `Matched structured table row: ${joined}`
        };
      }
    }
  }

  return null;
}

function extractLooseText(html: string): Omit<BridgeStatusResult, 'checkedAt' | 'sourceUrl'> | null {
  const normalized = normalizeWhitespace(html);
  const idx = normalized.toLowerCase().indexOf(BRIDGE_NAME_MATCH);
  if (idx === -1) return null;

  const window = normalized.slice(Math.max(0, idx - 120), idx + 360);
  const rawStatusMatch = window.match(/(Bridge\s+Up|Bridge\s+Down|\bUp\b|\bDown\b)/i);
  const rawStatus = rawStatusMatch?.[1] || 'Unknown';

  return {
    bridgeName: 'Brickell Avenue Bridge',
    rawStatus,
    status: mapStatus(rawStatus),
    note: `Matched loose text window: ${window}`
  };
}

export async function getBridgeStatus(): Promise<BridgeStatusResult> {
  const response = await fetch(SOURCE_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; BrickellBridgeStatus/1.0)'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`FL511 request failed with ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const structured = extractStructuredRow($);
  const loose = extractLooseText(html);
  const base = structured || loose;

  if (!base) {
    return {
      bridgeName: 'Brickell Avenue Bridge',
      status: 'UNKNOWN',
      rawStatus: 'Unavailable',
      checkedAt: new Date().toISOString(),
      sourceUrl: SOURCE_URL,
      note:
        'Could not reliably parse the bridge row from FL511. Check whether the HTML structure changed or supply a dedicated data endpoint via FL511_SOURCE_URL.'
    };
  }

  return {
    ...base,
    checkedAt: new Date().toISOString(),
    sourceUrl: SOURCE_URL
  };
}
