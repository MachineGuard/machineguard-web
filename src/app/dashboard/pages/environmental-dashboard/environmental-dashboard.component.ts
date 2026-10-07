import { AsyncPipe } from '@angular/common';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
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
    TranslatePipe,
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
  readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild('detailsDialog')
  private detailsDialog?: ElementRef<HTMLDialogElement>;
  readonly loadError = signal(false);
  readonly busy = signal(false);
  /** Translation key of the notification, or '' when there is none. */
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
            'dashboard.ackOk',
          ),
        error: () =>
          this.feedback.set(
            'dashboard.ackFail',
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
