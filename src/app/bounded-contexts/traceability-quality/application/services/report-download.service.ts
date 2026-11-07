import { DOCUMENT, inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { TraceabilityApiClient } from '../../infrastructure/api/traceability-api.client';
import { reportFilename } from '../../infrastructure/report-filename';

@Injectable({ providedIn: 'root' })
export class ReportDownloadService {
  private readonly api = inject(TraceabilityApiClient);
  private readonly document = inject(DOCUMENT);
  download(id: string) {
    return this.api.download(id).pipe(map(response => {
      if (!response.body) throw new Error('Missing report body');
      const url = URL.createObjectURL(response.body);
      const anchor = this.document.createElement('a');
      try {
        anchor.href = url;
        anchor.download = reportFilename(response.headers.get('Content-Disposition'), `traceability-report-${id}.json`);
        this.document.body.appendChild(anchor);
        anchor.click();
      } finally {
        anchor.remove();
        // Keep the URL alive until the browser has started consuming the download.
        setTimeout(() => URL.revokeObjectURL(url), 0);
      }
    }));
  }
}
