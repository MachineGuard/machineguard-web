import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { TranslatePipe } from '../../../../../core/i18n/translate.pipe';
import { ReportDownloadService } from '../../../application/services/report-download.service';
import { ReportDto, TraceabilityApiClient } from '../../../infrastructure/api/traceability-api.client';
import { traceabilityError } from '../../traceability.presentation';

@Component({ selector: 'app-sealed-report-detail', imports: [RouterLink, TranslatePipe],
  templateUrl: './sealed-report-detail.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class SealedReportDetailComponent {
  private readonly api = inject(TraceabilityApiClient);
  private readonly downloads = inject(ReportDownloadService);
  private readonly destroyRef = inject(DestroyRef);
  readonly mock = environment.monitoringSource === 'mock';
  readonly report = signal<ReportDto | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly downloadError = signal('');
  readonly downloaded = signal(false);
  constructor() {
    const route = inject(ActivatedRoute);
    if (!this.mock) route.paramMap.pipe(switchMap(params => {
      this.report.set(null); this.loading.set(true); this.error.set(''); this.downloadError.set(''); this.downloaded.set(false);
      return this.api.report(params.get('reportId')!).pipe(catchError(e => { this.error.set(traceabilityError(e)); return of(null); }));
    }), takeUntilDestroyed(this.destroyRef)).subscribe(report => { this.report.set(report); this.loading.set(false); });
  }
  content(report: ReportDto): string { return JSON.stringify(report.content, null, 2) ?? ''; }
  download(): void {
    const report = this.report();
    if (!report || this.busy() || !report.integrityVerified) return;
    this.busy.set(true); this.downloadError.set(''); this.downloaded.set(false);
    this.downloads.download(report.id).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false))).subscribe({
      next: () => this.downloaded.set(true), error: e => this.downloadError.set(traceabilityError(e)),
    });
  }
}
