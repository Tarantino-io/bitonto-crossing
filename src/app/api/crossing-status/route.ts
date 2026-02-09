import { NextResponse } from 'next/server';
import {
  calculateCrossingStatus,
  FerrotramviariaResponse,
  TrainEvent,
} from '@/utils/crossingLogic';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FERRO_BASE_URL = 'https://eticket.ferrovienordbarese.it/b2c/json/realtime/dati';
const SOURCE_TIMEOUT_MS = 6500;
const STATIONS = ['S01145', 'S01144'] as const;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

type SourceStatus = 'FULL' | 'PARTIAL' | 'UNAVAILABLE';
type RawTrain = Record<string, unknown>;

function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

function extractTime(rawValue: unknown): string {
  if (typeof rawValue !== 'string') {
    return 'ND';
  }

  const normalized = rawValue.trim();
  if (!normalized) {
    return 'ND';
  }

  if (/^\d{1,2}:\d{2}$/.test(normalized)) {
    const [hours, minutes] = normalized.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }

  if (/^\d{1,2}:\d{2}:\d{2}$/.test(normalized)) {
    return normalized.slice(0, 5);
  }

  if (/^\d{12,14}$/.test(normalized)) {
    return `${normalized.slice(8, 10)}:${normalized.slice(10, 12)}`;
  }

  return 'ND';
}

function getString(raw: unknown): string | undefined {
  return typeof raw === 'string' && raw.trim().length > 0 ? raw : undefined;
}

function toTrainEvent(raw: RawTrain, type: 'arrival' | 'departure'): TrainEvent {
  const rawTimestamp =
    type === 'arrival'
      ? (raw.arrivo ?? raw.orarioArrivo ?? raw.orario ?? raw.oraArrivo)
      : (raw.partenza ?? raw.orarioPartenza ?? raw.orario ?? raw.oraPartenza);

  return {
    numero: String(raw.numero ?? raw.numTreno ?? raw.idTreno ?? ''),
    categoria: String(raw.categoria ?? raw.tipoTreno ?? ''),
    type,
    orario: extractTime(rawTimestamp),
    ritardo: (raw.ritardo ?? raw.ritardoMinuti ?? raw.statoRitardo ?? 0) as string | number,
    destinazione: getString(raw.nomeDestinazione ?? raw.destinazione),
    provenienza: getString(raw.nomeProvenienza ?? raw.provenienza),
    binarioReale: getString(raw.binarioReale),
  };
}

function normalizeResponse(raw: unknown): FerrotramviariaResponse {
  if (!raw || typeof raw !== 'object') {
    return { arrivi: [], partenze: [] };
  }

  const source = raw as { arrivi?: unknown; partenze?: unknown };
  const rawArrivals = Array.isArray(source.arrivi) ? source.arrivi : [];
  const rawDepartures = Array.isArray(source.partenze) ? source.partenze : [];

  return {
    arrivi: rawArrivals
      .filter((entry): entry is RawTrain => typeof entry === 'object' && entry !== null)
      .map((entry) => toTrainEvent(entry, 'arrival')),
    partenze: rawDepartures
      .filter((entry): entry is RawTrain => typeof entry === 'object' && entry !== null)
      .map((entry) => toTrainEvent(entry, 'departure')),
  };
}

async function fetchStationData(stationCode: string): Promise<FerrotramviariaResponse | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SOURCE_TIMEOUT_MS);
  const url = `${FERRO_BASE_URL}?codSito=${stationCode}&type=T`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BitontoCrossingMonitor/1.0',
      },
      cache: 'no-store',
      next: { revalidate: 0 },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return normalizeResponse(payload);
  } catch (error) {
    console.warn(`Failed to fetch station ${stationCode}:`, error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function mergeSources(sources: FerrotramviariaResponse[]): FerrotramviariaResponse {
  return {
    arrivi: sources.flatMap((source) => source.arrivi ?? []),
    partenze: sources.flatMap((source) => source.partenze ?? []),
  };
}

export async function GET() {
  const lastUpdated = new Date().toISOString();

  try {
    const results = await Promise.all(STATIONS.map((stationCode) => fetchStationData(stationCode)));
    const available = results.filter(
      (result): result is FerrotramviariaResponse => result !== null,
    );
    const sourceStatus: SourceStatus =
      available.length === 0
        ? 'UNAVAILABLE'
        : available.length === STATIONS.length
          ? 'FULL'
          : 'PARTIAL';

    if (available.length === 0) {
      return jsonNoStore(
        {
          status: 'UNKNOWN',
          message: 'Dati treni non disponibili al momento.',
          nextTrain: null,
          sourceStatus,
          lastUpdated,
        },
        503,
      );
    }

    const combined = mergeSources(available);
    const status = calculateCrossingStatus(combined);
    const partialSuffix = sourceStatus === 'PARTIAL' ? ' (dati parziali)' : '';

    return jsonNoStore({
      status: status.state,
      message: `${status.message}${partialSuffix}`,
      nextTrain: status.nextTrain,
      sourceStatus,
      lastUpdated,
      raw: process.env.NODE_ENV === 'development' ? combined : undefined,
    });
  } catch (error) {
    console.error('API Error:', error);
    return jsonNoStore(
      {
        status: 'UNKNOWN',
        message: 'Impossibile recuperare i dati.',
        nextTrain: null,
        sourceStatus: 'UNAVAILABLE',
        lastUpdated,
        error: String(error),
      },
      500,
    );
  }
}
