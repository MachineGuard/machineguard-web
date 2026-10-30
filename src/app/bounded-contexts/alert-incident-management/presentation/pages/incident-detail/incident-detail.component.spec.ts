import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { EnvironmentalMonitoringService } from '../../../../environmental-monitoring/application/services/environmental-monitoring.service';
import { SessionService } from '../../../../iam/application/services/session.service';
import { IncidentService } from '../../../application/services/incident.service';
import { incidentDetailFromDto } from '../../../infrastructure/mappers/alert-incident.mapper';
import { DETAIL_FIXTURE } from '../../../infrastructure/testing/alert-incident.fixtures';
import { IncidentDetailComponent } from './incident-detail.component';

describe('IncidentDetailComponent', () => {
  const user = signal({ user: { role: 'ADMIN' } });
  let service: jasmine.SpyObj<IncidentService>;
  beforeEach(() => {
    user.set({ user: { role: 'ADMIN' } });
    service = jasmine.createSpyObj('incidents', ['detail', 'acknowledge', 'registerAction', 'resolve']);
    service.detail.and.returnValue(of(incidentDetailFromDto(DETAIL_FIXTURE)));
    TestBed.configureTestingModule({ imports: [IncidentDetailComponent], providers: [provideRouter([]),
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ incidentId: 'incident-1' })) } },
      { provide: IncidentService, useValue: service }, { provide: SessionService, useValue: { session: user } },
      { provide: EnvironmentalMonitoringService, useValue: { zones$: of([{ id: 'zone-1', name: 'Cold room' }]) } },
    ] });
  });
  it('explains missing recovery and action instead of allowing premature resolution', fakeAsync(() => {
    const fixture = TestBed.createComponent(IncidentDetailComponent); tick(0); fixture.detectChanges();
    expect(fixture.componentInstance.resolutionHint()).toBe('incident.needsAction');
    fixture.componentInstance.resolve(); expect(service.resolve).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Cold room'); fixture.destroy();
  }));
  it('hides mutation forms for a VIEWER even if a stale response permits resolution', fakeAsync(() => {
    user.set({ user: { role: 'VIEWER' } });
    service.detail.and.returnValue(of({ ...incidentDetailFromDto(DETAIL_FIXTURE), resolutionAllowed: true }));
    const fixture = TestBed.createComponent(IncidentDetailComponent); tick(0); fixture.detectChanges();
    fixture.componentInstance.description = 'Repair'; fixture.componentInstance.registerAction(); fixture.componentInstance.acknowledge(); fixture.componentInstance.resolve();
    expect(service.registerAction).not.toHaveBeenCalled(); expect(service.acknowledge).not.toHaveBeenCalled(); expect(service.resolve).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('form')).toBeNull(); fixture.destroy();
  }));
  it('retains entered text and refreshes eligibility after a conflict', fakeAsync(() => {
    service.registerAction.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    const fixture = TestBed.createComponent(IncidentDetailComponent); tick(0);
    fixture.componentInstance.description = 'Repaired seal'; fixture.componentInstance.actionNotes = 'Recheck later';
    fixture.componentInstance.registerAction(); tick(0);
    expect(fixture.componentInstance.description).toBe('Repaired seal'); expect(fixture.componentInstance.actionNotes).toBe('Recheck later');
    expect(fixture.componentInstance.actionError()).toBe('incident.conflict'); expect(service.detail).toHaveBeenCalledTimes(2); fixture.destroy();
  }));
  it('prevents duplicate submissions and clears text only after confirmation', fakeAsync(() => {
    const response = new Subject<any>(); service.registerAction.and.returnValue(response);
    const fixture = TestBed.createComponent(IncidentDetailComponent); tick(0);
    fixture.componentInstance.description = 'Repaired seal'; fixture.componentInstance.registerAction(); fixture.componentInstance.registerAction();
    expect(service.registerAction).toHaveBeenCalledTimes(1); expect(fixture.componentInstance.description).toBe('Repaired seal');
    response.next({}); response.complete(); tick(0);
    expect(fixture.componentInstance.description).toBe(''); expect(fixture.componentInstance.busy()).toBeFalse(); fixture.destroy();
  }));
});
