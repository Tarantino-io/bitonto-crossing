export interface TrainEvent {
  numero: string;
  categoria: string;
  destinazione?: string;
  provenienza?: string;
  orario: string; // "HH:mm"
  ritardo: string | number;
  binarioReale?: string;
  type?: 'arrival' | 'departure';
}

export interface FerrotramviariaResponse {
  arrivi: TrainEvent[];
  partenze: TrainEvent[];
}

export interface CrossingStatus {
  state: 'OPEN' | 'CLOSED' | 'WARNING';
  message: string;
  nextTrain: {
    orario: string;
    ritardo: string | number;
    minutesUntil: number;
    label: string;
    destinazione?: string;
    provenienza?: string;
  } | null;
}

const CLOSED_PAST_GRACE_MINUTES = 1;
const CLOSED_WINDOW_MINUTES = 2;
const WARNING_WINDOW_MINUTES = 7;
const LOOKAHEAD_WINDOW_MINUTES = 90;

interface CandidateTrain {
  train: TrainEvent;
  minutesUntil: number;
}

function parseDelayMinutes(delay: string | number): number {
  if (typeof delay === 'number' && Number.isFinite(delay)) {
    return Math.max(0, delay);
  }

  if (typeof delay !== 'string') {
    return 0;
  }

  const normalized = delay.trim().toLowerCase();
  if (!normalized || normalized.includes('orario')) {
    return 0;
  }

  const extracted = normalized.match(/-?\d+/);
  if (!extracted) {
    return 0;
  }

  const value = Number.parseInt(extracted[0], 10);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function parseMinutesOfDay(orario: string): number | null {
  const parsed = orario.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!parsed) {
    return null;
  }

  const hour = Number.parseInt(parsed[1], 10);
  const minute = Number.parseInt(parsed[2], 10);

  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return hour * 60 + minute;
}

function getMinutesUntilTrain(
  trainMinutes: number,
  currentMinutes: number,
): { upcoming: number | null; recent: number | null } {
  const directDiff = trainMinutes - currentMinutes;

  const upcomingCandidates = [directDiff, directDiff + 1440]
    .filter((diff) => diff >= 0 && diff <= LOOKAHEAD_WINDOW_MINUTES)
    .sort((a, b) => a - b);

  const recentCandidates = [directDiff, directDiff - 1440]
    .filter((diff) => diff < 0 && diff >= -CLOSED_PAST_GRACE_MINUTES)
    .sort((a, b) => b - a);

  return {
    upcoming: upcomingCandidates[0] ?? null,
    recent: recentCandidates[0] ?? null,
  };
}

/**
 * Determines the simplified status of the level crossing (OPEN, CLOSED, WARNING)
 * based on the provided train arrival/departure data.
 */
export function calculateCrossingStatus(
  data: FerrotramviariaResponse,
  now: Date = new Date(),
): CrossingStatus {
  // Force Europe/Rome to match the source wall-clock.
  const italyTimeStr = now.toLocaleTimeString('en-GB', {
    timeZone: 'Europe/Rome',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
  const [currentH, currentM] = italyTimeStr.split(':').map(Number);
  const currentMinutes = currentH * 60 + currentM;

  let nearestUpcoming: CandidateTrain | null = null;
  let nearestRecent: CandidateTrain | null = null;

  const allMovements = [
    ...(data.arrivi || []).map((train) => ({ ...train, type: 'arrival' as const })),
    ...(data.partenze || []).map((train) => ({ ...train, type: 'departure' as const })),
  ].filter(
    (train) =>
      train && train.orario && typeof train.orario === 'string' && train.orario.includes(':'),
  );

  for (const train of allMovements) {
    const parsedMinutes = parseMinutesOfDay(train.orario);
    if (parsedMinutes === null) {
      continue;
    }

    const delayMinutes = parseDelayMinutes(train.ritardo);
    const expectedMinutes = (((parsedMinutes + delayMinutes) % 1440) + 1440) % 1440;
    const { upcoming, recent } = getMinutesUntilTrain(expectedMinutes, currentMinutes);

    if (upcoming !== null && (!nearestUpcoming || upcoming < nearestUpcoming.minutesUntil)) {
      nearestUpcoming = { train, minutesUntil: upcoming };
    }

    if (recent !== null && (!nearestRecent || recent > nearestRecent.minutesUntil)) {
      nearestRecent = { train, minutesUntil: recent };
    }
  }

  const nearestTrainData = nearestUpcoming ?? nearestRecent;
  if (!nearestTrainData) {
    return { state: 'OPEN', message: 'Nessun treno in arrivo a breve.', nextTrain: null };
  }

  const nearestTrain = nearestTrainData.train;
  const minutesUntil = nearestTrainData.minutesUntil;
  const destinationOrOrigin =
    nearestTrain.destinazione || nearestTrain.provenienza || 'sconosciuta';
  const label = nearestTrain.provenienza
    ? `Treno da ${nearestTrain.provenienza}`
    : `Direzione ${destinationOrOrigin}`;

  if (minutesUntil <= CLOSED_WINDOW_MINUTES && minutesUntil >= -CLOSED_PAST_GRACE_MINUTES) {
    return {
      state: 'CLOSED',
      message: 'Attenzione! Passaggio a livello probabilmente CHIUSO.',
      nextTrain: { ...nearestTrain, minutesUntil, label },
    };
  }

  if (minutesUntil <= WARNING_WINDOW_MINUTES) {
    return {
      state: 'WARNING',
      message: 'Il passaggio a livello potrebbe chiudersi a breve.',
      nextTrain: { ...nearestTrain, minutesUntil, label },
    };
  }

  return {
    state: 'OPEN',
    message: 'Via libera (per ora).',
    nextTrain: { ...nearestTrain, minutesUntil, label },
  };
}
