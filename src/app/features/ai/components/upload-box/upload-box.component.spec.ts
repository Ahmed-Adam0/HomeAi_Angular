import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadBox } from './upload-box.component';

describe('UploadBox', () => {
  let component: UploadBox;
  let fixture: ComponentFixture<UploadBox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadBox]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadBox);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
