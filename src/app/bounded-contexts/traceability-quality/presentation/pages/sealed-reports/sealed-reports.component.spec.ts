import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { SessionService } from '../../../../iam/application/services/session.service';
import { MonitoringApiClient } from '../../../../environmental-monitoring/infrastructure/api/monitoring-api.client';
import { ReportDto, TraceabilityApiClient } from '../../../infrastructure/api/traceability-api.client';
import { SealedReportsComponent } from './sealed-reports.component';

describe('Sealed report generation safety', () => {
  const user=signal({user:{role:'ADMIN'}});
  let api: jasmine.SpyObj<TraceabilityApiClient>;
  beforeEach(()=>{
    user.set({user:{role:'ADMIN'}});
    api=jasmine.createSpyObj('TraceabilityApiClient',['reports','generate']);api.reports.and.returnValue(of([]));
    TestBed.configureTestingModule({imports:[SealedReportsComponent],providers:[provideRouter([]),
      {provide:TraceabilityApiClient,useValue:api},{provide:MonitoringApiClient,useValue:{getZones:()=>of([])}},{provide:SessionService,useValue:{session:user}}]});
  });
  const fill=(c:SealedReportsComponent)=>{c.zone='z';c.from='2026-11-06T10:00';c.to='2026-11-06T11:00';c.confirmed=true;};
  it('requires a valid period and explicit confirmation before sending',()=>{
    const f=TestBed.createComponent(SealedReportsComponent),c=f.componentInstance;
    c.generate();expect(api.generate).not.toHaveBeenCalled();fill(c);c.confirmed=false;c.generate();expect(c.commandError()).toBe('trace.confirmRequired');expect(api.generate).not.toHaveBeenCalled();f.destroy();
  });
  it('blocks double submission and preserves an uncertain form without automatic replay',()=>{
    const response=new Subject<ReportDto>();api.generate.and.returnValue(response);
    const f=TestBed.createComponent(SealedReportsComponent),c=f.componentInstance;fill(c);c.generate();c.generate();
    expect(api.generate).toHaveBeenCalledTimes(1);expect(c.busy()).toBeTrue();
    response.error(new HttpErrorResponse({status:0}));
    expect(c.busy()).toBeFalse();expect(c.uncertain()).toBeTrue();expect(c.confirmed).toBeFalse();
    expect(c.zone).toBe('z');expect(c.from).toBe('2026-11-06T10:00');expect(c.to).toBe('2026-11-06T11:00');
    c.generate();expect(api.generate).toHaveBeenCalledTimes(1);f.destroy();
  });
  it('refreshes the list only after confirmed success and links the created evidence',()=>{
    const response=new Subject<ReportDto>();api.generate.and.returnValue(response);
    const f=TestBed.createComponent(SealedReportsComponent),c=f.componentInstance;fill(c);c.generate();
    expect(api.reports).toHaveBeenCalledTimes(1);
    response.next({id:'r'} as ReportDto);response.complete();
    expect(api.reports).toHaveBeenCalledTimes(2);expect(c.generated()?.id).toBe('r');expect(c.confirmed).toBeFalse();f.destroy();
  });
  it('keeps VIEWER read-only even when generate is invoked directly',()=>{
    user.set({user:{role:'VIEWER'}});const f=TestBed.createComponent(SealedReportsComponent),c=f.componentInstance;fill(c);c.generate();f.detectChanges();
    expect(api.generate).not.toHaveBeenCalled();expect(f.nativeElement.querySelector('#generate-zone')).toBeNull();f.destroy();
  });
});
