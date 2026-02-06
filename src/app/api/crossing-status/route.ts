import { NextResponse } from 'next/server';
import { calculateCrossingStatus, FerrotramviariaResponse } from '@/utils/crossingLogic';

export async function GET() {
  try {
    // Bitonto Centrale: S01145
    // Bitonto SS. Medici: S01144
    const [resCentrale, resMedici] = await Promise.all([
      fetch('https://eticket.ferrovienordbarese.it/b2c/json/realtime/dati?codSito=S01145&type=T', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        next: { revalidate: 15 }
      }),
      fetch('https://eticket.ferrovienordbarese.it/b2c/json/realtime/dati?codSito=S01144&type=T', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        next: { revalidate: 15 }
      })
    ]);

    const dataCentrale: FerrotramviariaResponse = resCentrale.ok ? await resCentrale.json() : { arrivi: [], partenze: [] };
    const dataMedici: FerrotramviariaResponse = resMedici.ok ? await resMedici.json() : { arrivi: [], partenze: [] };
    
    // Helper to format timestamp YYYYMMDDHHmmss to HH:mm
    const extractTime = (ts?: string) => {
      if (!ts || ts.length < 12) return 'ND';
      return `${ts.substring(8, 10)}:${ts.substring(10, 12)}`;
    };

    // Normalize data
    const normalizeTrain = (t: any, type: 'arrival' | 'departure'): any => ({
      ...t,
      type,
      // Map arrival/departure timestamp to 'orario'
      orario: type === 'arrival' ? extractTime(t.arrivo) : extractTime(t.partenza),
      // Ensure ritardo is preserved
      ritardo: t.ritardo,
      // Map destination
      destinazione: t.nomeDestinazione
    });

    const combinedData: FerrotramviariaResponse = {
        arrivi: [...(dataCentrale.arrivi || []), ...(dataMedici.arrivi || [])].map(t => normalizeTrain(t, 'arrival')),
        partenze: [...(dataCentrale.partenze || []), ...(dataMedici.partenze || [])].map(t => normalizeTrain(t, 'departure'))
    };
    
    const status = calculateCrossingStatus(combinedData);

    return NextResponse.json({
      status: status.state, // OPEN, CLOSED, WARNING
      message: status.message,
      nextTrain: status.nextTrain,
      lastUpdated: new Date().toISOString(),
      raw: process.env.NODE_ENV === 'development' ? combinedData : undefined
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      status: 'UNKNOWN', 
      message: 'Impossibile recuperare i dati.',
      error: String(error)
    }, { status: 500 });
  }
}
