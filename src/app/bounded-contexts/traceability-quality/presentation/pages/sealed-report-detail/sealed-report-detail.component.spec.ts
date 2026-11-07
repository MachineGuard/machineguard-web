import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReportDownloadService } from '../../../application/services/report-download.service';
import { ReportDto, TraceabilityApiClient } from '../../../infrastructure/api/traceability-api.client';
import { SealedReportDetailComponent } from './sealed-report-detail.component';

describe('Stored sealed report detail',()=>{
  let api:jasmine.SpyObj<TraceabilityApiClient>,downloads:jasmine.SpyObj<ReportDownloadService>;
  beforeEach(()=>{
    api=jasmine.createSpyObj('TraceabilityApiClient',['report']);downloads=jasmine.createSpyObj('ReportDownloadService',['download']);
    TestBed.configureTestingModule({imports:[SealedReportDetailComponent],providers:[provideRouter([]),
      {provide:ActivatedRoute,useValue:{paramMap:of(convertToParamMap({reportId:'r'}))}},
      {provide:TraceabilityApiClient,useValue:api},{provide:ReportDownloadService,useValue:downloads}]});
  });
  it('escapes stored content and disables download for failed server integrity',()=>{
    api.report.and.returnValue(of({id:'r',integrityVerified:false,content:{text:'<img src=x onerror=alert(1)>'}} as ReportDto));
    const f=TestBed.createComponent(SealedReportDetailComponent);f.detectChanges();f.componentInstance.download();
    expect(f.nativeElement.querySelector('pre').textContent).toContain('<img');expect(f.nativeElement.querySelector('pre img')).toBeNull();
    expect(downloads.download).not.toHaveBeenCalled();expect(f.nativeElement.querySelector('button').disabled).toBeTrue();f.destroy();
  });
  for(const status of [401,403,404,409])it(`shows the ${status} state without stale report content`,()=>{
    api.report.and.returnValue(throwError(()=>new HttpErrorResponse({status})));
    const f=TestBed.createComponent(SealedReportDetailComponent);f.detectChanges();
    expect(f.componentInstance.report()).toBeNull();expect(f.nativeElement.querySelector('[role=alert]')).not.toBeNull();expect(f.nativeElement.querySelector('pre')).toBeNull();f.destroy();
  });
});
