import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanRoom } from './scan-room.component';

describe('ScanRoom', () => {
  let component: ScanRoom;
  let fixture: ComponentFixture<ScanRoom>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanRoom]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScanRoom);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
