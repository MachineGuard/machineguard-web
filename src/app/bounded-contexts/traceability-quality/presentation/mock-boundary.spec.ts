import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { MonitoringApiClient } from '../../environmental-monitoring/infrastructure/api/monitoring-api.client';
import { SessionService } from '../../iam/application/services/session.service';
import { ReportDownloadService } from '../application/services/report-download.service';
import { TraceabilityApiClient } from '../infrastructure/api/traceability-api.client';
import { MeasurementHistoryComponent } from './pages/measurement-history/measurement-history.component';
import { SealedReportsComponent } from './pages/sealed-reports/sealed-reports.component';
import { SealedReportDetailComponent } from './pages/sealed-report-detail/sealed-report-detail.component';

describe('Traceability connection boundary in demo mode',()=>{
  it('explains the connection limit and never synthesizes official history or reports',()=>{
    const previous=environment.monitoringSource;environment.monitoringSource='mock';
    const api=jasmine.createSpyObj('api',['history','reports','report','generate']);
    const zones=jasmine.createSpyObj('zones',['getZones']);
    try {
      TestBed.configureTestingModule({providers:[provideRouter([]),{provide:TraceabilityApiClient,useValue:api},
        {provide:MonitoringApiClient,useValue:zones},{provide:ReportDownloadService,useValue:{}},
        {provide:SessionService,useValue:{session:signal({user:{role:'ADMIN'}})}}]});
      const history=TestBed.createComponent(MeasurementHistoryComponent),reports=TestBed.createComponent(SealedReportsComponent),detail=TestBed.createComponent(SealedReportDetailComponent);
      for(const f of [history,reports,detail]){f.detectChanges();expect(f.nativeElement.querySelector('[role=status]')).not.toBeNull();}
      history.componentInstance.search();reports.componentInstance.generate();reports.componentInstance.load();
      expect(zones.getZones).not.toHaveBeenCalled();expect(api.history).not.toHaveBeenCalled();expect(api.reports).not.toHaveBeenCalled();expect(api.report).not.toHaveBeenCalled();expect(api.generate).not.toHaveBeenCalled();
      history.destroy();reports.destroy();detail.destroy();
    } finally {environment.monitoringSource=previous;}
  });
});
