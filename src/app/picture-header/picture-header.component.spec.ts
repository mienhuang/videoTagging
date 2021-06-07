import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PictureHeaderComponent } from './picture-header.component';

describe('PictureHeaderComponent', () => {
  let component: PictureHeaderComponent;
  let fixture: ComponentFixture<PictureHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PictureHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PictureHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
