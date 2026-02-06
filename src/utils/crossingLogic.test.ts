import { describe, it, expect } from 'vitest';
import { calculateCrossingStatus, FerrotramviariaResponse, TrainEvent } from './crossingLogic';

describe('calculateCrossingStatus', () => {
    
    // Helper to create a date at specific HH:mm
    const createTime = (h: number, m: number) => {
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d;
    };

    it('should return OPEN when no trains are present', () => {
        const emptyData: FerrotramviariaResponse = { arrivi: [], partenze: [] };
        const status = calculateCrossingStatus(emptyData);
        expect(status.state).toBe('OPEN');
        expect(status.message).toContain('Nessun treno');
    });

    it('should return CLOSED when a train is arriving in 5 minutes', () => {
        const now = createTime(10, 0);
        const data: FerrotramviariaResponse = {
            arrivi: [{
                numero: '123',
                categoria: 'REG',
                destinazione: 'Bari',
                orario: '10:04', // 4 mins away
                ritardo: '',
                type: 'arrival'
            } as TrainEvent],
            partenze: []
        };
        
        const status = calculateCrossingStatus(data, now);
        expect(status.state).toBe('CLOSED');
        expect(status.nextTrain?.minutesUntil).toBe(4);
    });

    it('should return CLOSED when a train is departing in 5 minutes', () => {
        const now = createTime(10, 0);
        const data: FerrotramviariaResponse = {
            arrivi: [],
            partenze: [{
                numero: '124',
                categoria: 'REG',
                destinazione: 'Barletta',
                orario: '10:05', // 5 mins away
                ritardo: '',
                type: 'departure'
            } as TrainEvent]
        };
        
        const status = calculateCrossingStatus(data, now);
        expect(status.state).toBe('CLOSED');
        expect(status.nextTrain?.minutesUntil).toBe(5);
    });

    it('should return WARNING when a train is arriving in 10 minutes', () => {
        const now = createTime(10, 0);
        const data: FerrotramviariaResponse = {
            arrivi: [{
                numero: '125',
                categoria: 'REG',
                destinazione: 'Bari',
                orario: '10:10', // 10 mins away
                ritardo: '',
                type: 'arrival'
            } as TrainEvent],
            partenze: []
        };
        
        const status = calculateCrossingStatus(data, now);
        expect(status.state).toBe('WARNING');
        expect(status.nextTrain?.minutesUntil).toBe(10);
    });

    it('should return OPEN when a train is arriving in 15 minutes', () => {
        const now = createTime(10, 0);
        const data: FerrotramviariaResponse = {
            arrivi: [{
                numero: '126',
                categoria: 'REG',
                destinazione: 'Bari',
                orario: '10:15', // 15 mins away
                ritardo: '',
                type: 'arrival'
            } as TrainEvent],
            partenze: []
        };
        
        const status = calculateCrossingStatus(data, now);
        expect(status.state).toBe('OPEN');
        expect(status.nextTrain?.minutesUntil).toBe(15);
    });

    it('should account for delays', () => {
        const now = createTime(10, 0);
        const data: FerrotramviariaResponse = {
            arrivi: [{
                numero: '127',
                categoria: 'REG',
                destinazione: 'Bari',
                orario: '09:55', // Was 5 mins ago
                ritardo: "10'",  // But 10 min delay => 10:05 (5 mins away)
                type: 'arrival'
            } as TrainEvent],
            partenze: []
        };
        
        const status = calculateCrossingStatus(data, now);
        
        // Expected: 09:55 + 10 = 10:05. Now is 10:00. Diff = 5.
        expect(status.state).toBe('CLOSED');
        expect(status.nextTrain?.minutesUntil).toBe(5);
    });

    it('should handle "In Orario" delay correctly', () => {
        const now = createTime(10, 0);
        const data: FerrotramviariaResponse = {
            arrivi: [{
                numero: '128',
                categoria: 'REG',
                destinazione: 'Bari',
                orario: '10:04',
                ritardo: 'In Orario',
                type: 'arrival'
            } as TrainEvent],
            partenze: []
        };
        
        const status = calculateCrossingStatus(data, now);
        expect(status.state).toBe('CLOSED');
        expect(status.nextTrain?.minutesUntil).toBe(4);
    });

    it('should ignore trains that have already passed (more than 5 mins ago)', () => {
        const now = createTime(10, 0);
        const data: FerrotramviariaResponse = {
            arrivi: [{
                numero: '129',
                categoria: 'REG',
                destinazione: 'Bari',
                orario: '09:50', // 10 mins ago
                ritardo: '',
                type: 'arrival'
            } as TrainEvent],
            partenze: []
        };
        
        const status = calculateCrossingStatus(data, now);
        expect(status.state).toBe('OPEN');
    });

    it('should handle numeric delay correctly', () => {
        const now = createTime(10, 0);
        const data: FerrotramviariaResponse = {
            arrivi: [{
                numero: '130',
                categoria: 'REG',
                destinazione: 'Bari',
                orario: '09:55',
                ritardo: 10,  // Numeric delay: 10 mins => 10:05 (5 mins away)
                type: 'arrival'
            } as TrainEvent],
            partenze: []
        };
        
        const status = calculateCrossingStatus(data, now);
        expect(status.state).toBe('CLOSED');
        expect(status.nextTrain?.minutesUntil).toBe(5);
    });

    it('should return fallback train info when OPEN', () => {
        const now = createTime(10, 0);
        const data: FerrotramviariaResponse = {
            arrivi: [{
                numero: '131',
                categoria: 'REG',
                destinazione: 'Bari',
                orario: '10:30', // 30 mins away (OPEN)
                ritardo: 0,
                type: 'arrival'
            } as TrainEvent],
            partenze: []
        };
        
        const status = calculateCrossingStatus(data, now);
        expect(status.state).toBe('OPEN');
        expect(status.nextTrain).not.toBeNull();
        expect(status.nextTrain?.minutesUntil).toBe(30);
        expect(status.nextTrain?.label).toContain('Direzione Bari');
    });

    it('should use "Treno da" label when provenienza is available', () => {
        const now = createTime(10, 0);
        const data: FerrotramviariaResponse = {
            arrivi: [{
                numero: '132',
                categoria: 'REG',
                destinazione: 'Bari',
                provenienza: 'Bitonto',
                orario: '10:04',
                ritardo: 0,
                type: 'arrival'
            } as TrainEvent],
            partenze: []
        };
        
        const status = calculateCrossingStatus(data, now);
        expect(status.nextTrain?.label).toBe('Treno da Bitonto');
    });
});
