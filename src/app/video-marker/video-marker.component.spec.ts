import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoMarkerComponent } from './video-marker.component';

describe('VideoMarkerComponent', () => {
  let component: VideoMarkerComponent;
  let fixture: ComponentFixture<VideoMarkerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VideoMarkerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoMarkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
