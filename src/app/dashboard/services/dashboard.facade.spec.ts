import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { DashboardFacade } from './dashboard.facade';
import { MONITORING_REPOSITORY } from '../../bounded-contexts/environmental-monitoring/domain/repositories/monitoring.repository';
import { MockMonitoringRepository } from '../../bounded-contexts/environmental-monitoring/infrastructure/repositories/mock-monitoring.repository';
import { ALERT_REPOSITORY } from '../../bounded-contexts/alert-incident-management/domain/repositories/alert.repository';
import { MockAlertRepository } from '../../bounded-contexts/alert-incident-management/infrastructure/repositories/mock-alert.repository';

describe('Dashboard composition', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        { provide: MONITORING_REPOSITORY, useClass: MockMonitoringRepository },
        { provide: ALERT_REPOSITORY, useClass: MockAlertRepository },
      ],
    }),
  );

  it('acknowledges an alert while preserving the environmental deviation', async () => {
    const facade = TestBed.inject(DashboardFacade);
    await firstValueFrom(facade.acknowledge('alert-cold-room'));
    const vm = await firstValueFrom(facade.viewModel$);
    expect(vm.alerts[0].status).toBe('ACKNOWLEDGED');
    expect(vm.zones[0].status).toBe('OUT_OF_RANGE');
    expect(vm.summary.map((item) => item.count)).toEqual([1, 1, 1, 1]);
  });

  it('recalculates counts for a changed repository dataset', async () => {
    const snapshot = await firstValueFrom(
      new MockMonitoringRepository().watchSnapshot(),
    );
    snapshot.zones = snapshot.zones.slice(0, 2);
    TestBed.overrideProvider(MONITORING_REPOSITORY, {
      useValue: { watchSnapshot: () => of(snapshot) },
    });
    const vm = await firstValueFrom(TestBed.inject(DashboardFacade).viewModel$);
    expect(vm.summary.map((item) => item.count)).toEqual([1, 0, 1, 0]);
  });

  it('rejects duplicate acknowledgements', async () => {
    const facade = TestBed.inject(DashboardFacade);
    await firstValueFrom(facade.acknowledge('alert-cold-room'));
    await expectAsync(
      firstValueFrom(facade.acknowledge('alert-cold-room')),
    ).toBeRejected();
  });
});
