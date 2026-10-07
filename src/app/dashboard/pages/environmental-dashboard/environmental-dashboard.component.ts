import { AsyncPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { DashboardFacade } from '../../services/dashboard.facade';
import { DashboardViewModel } from '../../models/dashboard.view-model';
import { MonitoringZoneViewModel } from '../../../bounded-contexts/environmental-monitoring/application/models/monitoring-zone.view-model';
import { ZoneCardComponent } from '../../../bounded-contexts/environmental-monitoring/presentation/components/zone-card/zone-card.component';
import { LatestAlertsComponent } from '../../../bounded-contexts/alert-incident-management/presentation/components/latest-alerts/latest-alerts.component';
import { StatusSummaryComponent } from '../../components/status-summary/status-summary.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { STATUS_META } from '../../../bounded-contexts/environmental-monitoring/presentation/models/zone-status.presentation';
@Component({
  selector: 'app-environmental-dashboard',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    RouterLink,
    ZoneCardComponent,
    LatestAlertsComponent,
    StatusSummaryComponent,
    IconComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './environmental-dashboard.component.html',
  styleUrl: './environmental-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnvironmentalDashboardComponent {
  private readonly facade = inject(DashboardFacade);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild('detailsDialog')
  private detailsDialog?: ElementRef<HTMLDialogElement>;
  readonly loadError = signal(false);
  readonly busy = signal(false);
  readonly feedback = signal('');
  readonly selectedZone = signal<MonitoringZoneViewModel | null>(null);
  readonly statusMeta = STATUS_META;
  readonly viewModel$ = this.facade.viewModel$.pipe(
    catchError(() => {
      this.loadError.set(true);
      return of(null);
    }),
  );
  acknowledgeAlert(alertId: string | undefined): void {
    if (!alertId || this.busy()) return;
    this.busy.set(true);
    this.feedback.set('');
    this.facade
      .acknowledge(alertId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: () =>
          this.feedback.set(
            'Alert acknowledged in this demo session. The environmental deviation remains active.',
          ),
        error: () =>
          this.feedback.set(
            'Could not acknowledge the alert. Please try again.',
          ),
      });
  }
  showDetails(zoneId: string, vm: DashboardViewModel): void {
    this.selectedZone.set(vm.zones.find((z) => z.id === zoneId) ?? null);
    if (this.selectedZone()) this.detailsDialog?.nativeElement.showModal();
  }
  closeDetails(): void {
    this.detailsDialog?.nativeElement.close();
  }
}
