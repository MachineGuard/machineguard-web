import { TestBed } from '@angular/core/testing';
import { provideHttpClient,withInterceptors,HttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { of,Subject } from 'rxjs';
import { SessionService } from '../../application/services/session.service';
import { sessionRefreshInterceptor } from './session-refresh.interceptor';

describe('Session refresh request safety',()=>{
  let http:HttpTestingController;let client:HttpClient;let session:any;
  beforeEach(()=>{
    session={isAuthenticated:()=>true,refresh:jasmine.createSpy().and.returnValue(of({})),end:jasmine.createSpy()};
    TestBed.configureTestingModule({providers:[provideHttpClient(withInterceptors([sessionRefreshInterceptor])),provideHttpClientTesting(),
      {provide:SessionService,useValue:session}]});
    http=TestBed.inject(HttpTestingController);client=TestBed.inject(HttpClient);
  });
  afterEach(()=>http.verify());
  for(const method of ['POST','PUT','PATCH','DELETE'])it('does not replay '+method+' after a 401',()=>{
    let failed=false;
    client.request(method,'/api/v1/incidents/i/resolve',{body:{notes:'Keep text'}}).subscribe({error:()=>failed=true});
    http.expectOne('/api/v1/incidents/i/resolve').flush({},{status:401,statusText:'Unauthorized'});
    http.expectNone('/api/v1/incidents/i/resolve');expect(failed).toBeTrue();
    expect(session.end).not.toHaveBeenCalled();
  });
  it('replays a GET once after refresh',()=>{
    client.get('/api/v1/environmental-monitoring/zones').subscribe();
    http.expectOne('/api/v1/environmental-monitoring/zones').flush({},{status:401,statusText:'Unauthorized'});
    http.expectOne('/api/v1/environmental-monitoring/zones').flush([]);
    expect(session.refresh).toHaveBeenCalledTimes(1);
  });
  it('does not enqueue a failed command while a query refresh is pending',()=>{
    const renewal=new Subject<any>();session.refresh.and.returnValue(renewal);let failed=false;
    client.get('/api/v1/incidents/i').subscribe();
    http.expectOne('/api/v1/incidents/i').flush({},{status:401,statusText:'Unauthorized'});
    client.post('/api/v1/incidents/i/resolve',{}).subscribe({error:()=>failed=true});
    http.expectOne('/api/v1/incidents/i/resolve').flush({},{status:401,statusText:'Unauthorized'});
    expect(failed).toBeTrue();renewal.next({});renewal.complete();
    http.expectOne('/api/v1/incidents/i').flush({});http.expectNone('/api/v1/incidents/i/resolve');
  });
});
