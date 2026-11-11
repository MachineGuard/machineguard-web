import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../../core/i18n/i18n.service';
import { alertFromDto } from '../infrastructure/mappers/alert-incident.mapper';
import { AlertDto } from '../infrastructure/api/alert-incident.dto';
import { alertText } from './incident.presentation';

describe('alertText', () => {
  const dto = (extra: Partial<AlertDto> = {}): AlertDto => ({
    id: 'a-1', incidentId: 'i-1', monitoringZoneId: 'zone-1', severity: 'HIGH', status: 'PENDING',
    message: 'HUMIDITY fuera de rango en la zona zone-1: medicion 67.50 (rango seguro 35.00 a 60.00)',
    raisedAt: '2026-11-11T12:37:00Z', acknowledgedAt: null, escalatedAt: null, historical: false, ...extra,
  });
  const reading = { environmentalVariable: 'HUMIDITY', measuredValue: 67.5, minimumValue: 35, maximumValue: 60 };
  let i18n: I18nService;

  beforeEach(() => { i18n = TestBed.inject(I18nService); });

  it('phrases the reading in Spanish and English', () => {
    const alert = alertFromDto(dto(reading));
    i18n.use('es');
    expect(alertText(alert, i18n)).toBe('Humedad relativa fuera de rango: 67.5 % HR (rango seguro 35 a 60 % HR)');
    i18n.use('en');
    expect(alertText(alert, i18n)).toBe('Relative humidity out of range: 67.5 % RH (safe range 35 to 60 % RH)');
  });

  it('marks historical deviations', () => {
    i18n.use('es');
    expect(alertText(alertFromDto(dto({ ...reading, historical: true })), i18n)).toMatch(/^Desviación histórica: /);
  });

  it('keeps the server message when the reading is missing', () => {
    const alert = alertFromDto(dto());
    expect(alert.reading).toBeNull();
    expect(alertText(alert, i18n)).toBe(alert.message);
  });
});
