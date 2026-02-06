export interface TrainEvent {
  numero: string;
  categoria: string;
  destinazione?: string;
  provenienza?: string;
  orario: string; // "HH:mm"
  ritardo: string | number; // "X'" or "In Orario" or number
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

/**
 * Determines the simplified status of the level crossing (OPEN, CLOSED, WARNING)
 * based on the provided train arrival/departure data.
 * 
 * @param data - The raw response from Ferrotramviaria APIs containing arrivi/partenze.
 * @param now - Optional reference time (default: new Date()).
 * @returns An object containing the status, a user-facing message, and details of the relevant train.
 */
export function calculateCrossingStatus(data: FerrotramviariaResponse, now: Date = new Date()): CrossingStatus {
  // Logic to determine if crossing is likely closed
  // Simplistic heuristic:
  // If a train is departing in < 5 mins OR arriving in < 5 mins => CLOSED
  // If a train is delayed and expected time is NOW => CLOSED
  
  // Fix: Force 'Europe/Rome' timezone to match the API's wall clock time
  const italyTimeStr = now.toLocaleTimeString('en-US', { timeZone: 'Europe/Rome', hour12: false, hour: '2-digit', minute: '2-digit' });
  const [currentH, currentM] = italyTimeStr.split(':').map(Number);
  const currentMinutes = currentH * 60 + currentM;

  let minDiff = Infinity;
  let nearestTrain: TrainEvent | null = null;
  let trainType: 'arrival' | 'departure' = 'arrival';

  // Combine arrays to check all movements
  // Filter out trains without time
  const allMovements = [
    ...(data.arrivi || []).map(t => ({ ...t, type: 'arrival' as const })),
    ...(data.partenze || []).map(t => ({ ...t, type: 'departure' as const }))
  ].filter(t => t && t.orario && typeof t.orario === 'string' && t.orario.includes(':'));

  for (const train of allMovements) {
    // Parse time "HH:mm"
    const [h, m] = train.orario.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) continue;
    
    const trainMinutes = h * 60 + m;

    // Add delay
    let delayMinutes = 0;
    if (typeof train.ritardo === 'number') {
      delayMinutes = train.ritardo;
    } else if (typeof train.ritardo === 'string' && train.ritardo.includes("'")) {
      delayMinutes = parseInt(train.ritardo.replace("'", ''), 10) || 0;
    }
    
    // Handle day rollover roughly (not perfect but works for daytime)
    // If train is 00:10 and now is 23:50, we add 24h to train
    if (trainMinutes < currentMinutes - 720) { // If > 12h past, assume next day? 
       // Actually simpler: just focus on near future trains
    }

    const expectedMinutes = trainMinutes + delayMinutes;
    const diff = expectedMinutes - currentMinutes;

    // valid future or very recent past trains
    // If diff is between -2 (just passed) and +120 (next 2 hours)
    if (diff >= -5 && diff < minDiff) { 
        minDiff = diff;
        nearestTrain = train;
        trainType = train.type || 'arrival';
    }
  }

  // Determine status
  // CLOSED: Train expected in <= 5 mins or passed < 2 mins ago
  // WARNING: Train expected in 5-10 mins
  // OPEN: > 10 mins
  
  if (!nearestTrain) {
    return { state: 'OPEN', message: 'Nessun treno in arrivo a breve.', nextTrain: null };
  }

  // Construct label for critical train
  const dest = nearestTrain.destinazione || nearestTrain.provenienza || 'Unknown';
  // Check if we have explicit origin for arrival, otherwise default to destination-based label
  const label = nearestTrain.provenienza 
    ? `Treno da ${nearestTrain.provenienza}`
    : `Direzione ${dest}`;

  if (minDiff <= 5 && minDiff >= -5) {
     return { 
       state: 'CLOSED', 
       message: 'Attenzione! Passaggio a livello probabilmente CHIUSO.',
       nextTrain: { ...nearestTrain, minutesUntil: minDiff, label }
     };
  } else if (minDiff <= 12) {
     return { 
       state: 'WARNING', 
       message: 'Il passaggio a livello potrebbe chiudersi a breve.',
       nextTrain: { ...nearestTrain, minutesUntil: minDiff, label }
     };
  } else {
     return { 
       state: 'OPEN', 
       message: 'Via libera (per ora).',
       nextTrain: { ...nearestTrain, minutesUntil: minDiff, label }
     };
  }
}
