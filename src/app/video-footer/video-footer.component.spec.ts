import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoFooterComponent } from './video-footer.component';

describe('VideoFooterComponent', () => {
  let component: VideoFooterComponent;
  let fixture: ComponentFixture<VideoFooterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VideoFooterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
