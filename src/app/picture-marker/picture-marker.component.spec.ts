import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PictureMarkerComponent } from './picture-marker.component';

describe('PictureMarkerComponent', () => {
  let component: PictureMarkerComponent;
  let fixture: ComponentFixture<PictureMarkerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PictureMarkerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PictureMarkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
