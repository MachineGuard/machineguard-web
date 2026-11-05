import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject,map } from 'rxjs';
import { EnvironmentalMonitoringService } from '../../bounded-contexts/environmental-monitoring/application/services/environmental-monitoring.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { SidebarComponent } from './sidebar.component';

describe('Sidebar transport freshness',()=>{
  it('labels retained counters as last known during refresh failure and recovers',()=>{
    const zones=[{onlineNodes:8,offlineNodes:2}];
    const state=new BehaviorSubject<any>({status:'loaded',zones});
    TestBed.configureTestingModule({imports:[SidebarComponent],providers:[provideRouter([]),
      {provide:EnvironmentalMonitoringService,useValue:{state$:state,zones$:state.pipe(map(s=>s.zones))}}]});
    const i18n=TestBed.inject(I18nService);const previous=i18n.language();i18n.use('en');
    const fixture=TestBed.createComponent(SidebarComponent);fixture.detectChanges();
    state.next({status:'error',zones,error:new Error('Unavailable')});fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Last known:');
    expect(fixture.nativeElement.textContent).toContain('Connection status unconfirmed.');
    state.next({status:'loaded',zones});fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Last known:');fixture.destroy();i18n.use(previous);
  });
});
