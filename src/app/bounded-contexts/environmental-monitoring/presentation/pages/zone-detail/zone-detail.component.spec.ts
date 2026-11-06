import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute,convertToParamMap,provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SessionService } from '../../../../iam/application/services/session.service';
import { MonitoringApiClient } from '../../../infrastructure/api/monitoring-api.client';
import { zoneFixture } from '../../../infrastructure/api/monitoring-zone.fixture';
import { ZoneDetailComponent } from './zone-detail.component';

describe('Zone physical evidence display',()=>{
  it('selects the newest eligible physical capture including microseconds',()=>{
    const zone=zoneFixture();
    zone.sensors.push({...zone.sensors[0],id:'s3'});
    zone.points.push({...zone.points[0],id:'inactive',status:'INACTIVE'});
    zone.sensors.push({...zone.sensors[0],id:'s4',monitoringPointId:'inactive'});
    zone.latestPhysicalMeasurements=[
      {...zone.latestMeasurements[0],id:'older',source:'SENSOR',freshness:'FRESH',recordedAt:'2026-10-01T12:00:00.100000Z'},
      {...zone.latestMeasurements[0],id:'current',sensorNodeId:'s3',measuredValue:5,source:'SENSOR',freshness:'FRESH',recordedAt:'2026-10-01T12:00:00.100001Z'},
      {...zone.latestMeasurements[0],id:'disabled-point',sensorNodeId:'s4',monitoringPointId:'inactive',source:'SENSOR',freshness:'FRESH',recordedAt:'2026-10-01T12:00:00.100002Z'},
    ];
    TestBed.configureTestingModule({imports:[ZoneDetailComponent],providers:[provideRouter([]),
      {provide:ActivatedRoute,useValue:{snapshot:{paramMap:convertToParamMap({zoneId:zone.id})}}},
      {provide:SessionService,useValue:{session:signal({user:{role:'ADMIN'}})}},
      {provide:MonitoringApiClient,useValue:{getZone:()=>of(zone)}}]});
    const fixture=TestBed.createComponent(ZoneDetailComponent);
    expect(fixture.componentInstance.ranges()[0].reading?.id).toBe('current');fixture.destroy();
  });
});
