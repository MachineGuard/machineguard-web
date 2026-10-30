import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { EnvironmentalMonitoringService } from '../../../../environmental-monitoring/application/services/environmental-monitoring.service';
import { AlertService } from '../../../application/services/alert.service';
import { IncidentService } from '../../../application/services/incident.service';
import { DETAIL_FIXTURE } from '../../../infrastructure/testing/alert-incident.fixtures';
import { OperationsListComponent } from './operations-list.component';

describe('OperationsListComponent', () => {
  let incidents: jasmine.SpyObj<IncidentService>;
  beforeEach(() => {
    incidents = jasmine.createSpyObj('incidents', ['list']); incidents.list.and.returnValue(of([DETAIL_FIXTURE.incident]));
    TestBed.configureTestingModule({ imports: [OperationsListComponent], providers: [provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { data: { kind: 'incidents' } } } },
      { provide: IncidentService, useValue: incidents }, { provide: AlertService, useValue: {} },
      { provide: EnvironmentalMonitoringService, useValue: { zones$: of([{ id: 'zone-1', name: 'Cold room' }]) } },
    ] });
  });
  it('queries filters on the server and links to the incident detail', fakeAsync(() => {
    const fixture = TestBed.createComponent(OperationsListComponent); tick(0);
    fixture.componentInstance.zoneFilter.set('zone-1'); fixture.componentInstance.statusFilter.set('OPEN'); fixture.componentInstance.apply(); tick(0); fixture.detectChanges();
    expect(incidents.list.calls.mostRecent().args[0].monitoringZoneId).toBe('zone-1');
    expect(fixture.nativeElement.querySelector('a.row-link').getAttribute('href')).toBe('/incidents/incident-1'); fixture.destroy();
  }));
  it('rejects a reversed period before issuing a new request', fakeAsync(() => {
    const fixture = TestBed.createComponent(OperationsListComponent); tick(0);
    fixture.componentInstance.from.set('2026-10-30T12:00'); fixture.componentInstance.to.set('2026-10-29T12:00'); fixture.componentInstance.apply();
    expect(fixture.componentInstance.invalidPeriod()).toBeTrue(); expect(incidents.list).toHaveBeenCalledTimes(1); fixture.destroy();
  }));
  it('preserves existing records and reports a failed background refresh', fakeAsync(() => {
    const fixture = TestBed.createComponent(OperationsListComponent); tick(0);
    incidents.list.and.returnValue(throwError(() => new Error('offline'))); tick(15_000);
    expect(fixture.componentInstance.rows().length).toBe(1); expect(fixture.componentInstance.error()).toBeTrue(); fixture.destroy();
  }));
  it('cancels the previous query so a late result cannot overwrite the new filter', fakeAsync(() => {
    const slow = new Subject<any[]>(); incidents.list.and.returnValue(slow);
    const fixture = TestBed.createComponent(OperationsListComponent); tick(0);
    incidents.list.and.returnValue(of([])); fixture.componentInstance.zoneFilter.set('other-zone'); fixture.componentInstance.apply(); tick(0);
    slow.next([DETAIL_FIXTURE.incident]); expect(fixture.componentInstance.rows()).toEqual([]); fixture.destroy();
  }));
});
