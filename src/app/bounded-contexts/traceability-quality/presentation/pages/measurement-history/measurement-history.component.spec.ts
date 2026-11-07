import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { MonitoringApiClient } from '../../../../environmental-monitoring/infrastructure/api/monitoring-api.client';
import { HistoryDto, TraceabilityApiClient } from '../../../infrastructure/api/traceability-api.client';
import { MeasurementHistoryComponent } from './measurement-history.component';

describe('General measurement history',()=>{
  let api:jasmine.SpyObj<TraceabilityApiClient>;
  beforeEach(()=>{
    api=jasmine.createSpyObj('TraceabilityApiClient',['history']);
    TestBed.configureTestingModule({imports:[MeasurementHistoryComponent],providers:[provideRouter([]),{provide:TraceabilityApiClient,useValue:api},
      {provide:MonitoringApiClient,useValue:{getZones:()=>of([])}}]});
  });
  const fill=(c:MeasurementHistoryComponent)=>{c.zone='z';c.from='2026-11-06T10:00';c.to='2026-11-06T11:00';};
  it('shows normal measurements and an empty result without requiring an excursion',()=>{
    const f=TestBed.createComponent(MeasurementHistoryComponent),c=f.componentInstance;fill(c);
    api.history.and.returnValue(of({monitoringZoneId:'z',from:'a',to:'b',count:1,measurements:[{monitoringPointId:'point',environmentalVariable:'TEMPERATURE',value:4.5,recordedAt:'2026-11-06T15:30:00Z'}]}));
    c.search();f.detectChanges();expect(f.nativeElement.textContent).toContain('4.5 °C');expect(f.nativeElement.textContent).toContain('point');
    api.history.and.returnValue(of({monitoringZoneId:'z',from:'a',to:'b',count:0,measurements:[]}));c.search();f.detectChanges();
    expect(c.data()?.count).toBe(0);expect(f.nativeElement.querySelector('table')).toBeNull();f.destroy();
  });
  it('validates dates, forwards variable and ignores a superseded query',()=>{
    const f=TestBed.createComponent(MeasurementHistoryComponent),c=f.componentInstance;
    c.search();expect(api.history).not.toHaveBeenCalled();fill(c);c.variable='HUMIDITY';
    const old=new Subject<HistoryDto>(),current=new Subject<HistoryDto>();api.history.and.returnValues(old,current);
    c.search();c.search();expect(api.history.calls.mostRecent().args[0].variable).toBe('HUMIDITY');
    old.next({count:99} as HistoryDto);expect(c.data()).toBeNull();
    current.error(new HttpErrorResponse({status:403}));expect(c.error()).toBe('trace.forbidden');expect(c.loading()).toBeFalse();f.destroy();
  });
});
