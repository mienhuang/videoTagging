import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FaceSettingComponent } from './face-setting.component';

describe('FaceSettingComponent', () => {
  let component: FaceSettingComponent;
  let fixture: ComponentFixture<FaceSettingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FaceSettingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FaceSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
