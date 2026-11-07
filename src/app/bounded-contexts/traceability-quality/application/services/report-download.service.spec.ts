import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TraceabilityApiClient } from '../../infrastructure/api/traceability-api.client';
import { ReportDownloadService } from './report-download.service';

describe('Report download file lifecycle', () => {
  it('saves the exact received blob, uses disposition and frees its object URL', fakeAsync(() => {
    const blob = new Blob(['{"content":{"original":true}}'],{type:'application/json'});
    TestBed.configureTestingModule({providers:[{provide:TraceabilityApiClient,useValue:{download:()=>of(new HttpResponse({body:blob,headers:new HttpHeaders({'Content-Disposition':'attachment; filename="stored.json"'})}))}}]});
    const create = spyOn(URL,'createObjectURL').and.returnValue('blob:test');
    const revoke = spyOn(URL,'revokeObjectURL');
    const click = spyOn(HTMLAnchorElement.prototype,'click').and.callFake(function(this: HTMLAnchorElement) {
      expect(this.download).toBe('stored.json');expect(this.href).toBe('blob:test');expect(this.isConnected).toBeTrue();
    });
    TestBed.inject(ReportDownloadService).download('id').subscribe();
    expect(create).toHaveBeenCalledOnceWith(blob);expect(click).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a[download="stored.json"]')).toBeNull();tick();expect(revoke).toHaveBeenCalledOnceWith('blob:test');
  }));
  it('does not create a file from a failed download', () => {
    TestBed.configureTestingModule({providers:[{provide:TraceabilityApiClient,useValue:{download:()=>throwError(()=>new Error('offline'))}}]});
    const create=spyOn(URL,'createObjectURL');let failed=false;
    TestBed.inject(ReportDownloadService).download('id').subscribe({error:()=>failed=true});
    expect(failed).toBeTrue();expect(create).not.toHaveBeenCalled();
  });
});
