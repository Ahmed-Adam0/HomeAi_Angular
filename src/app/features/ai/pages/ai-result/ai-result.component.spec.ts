import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiResult } from './ai-result.component';

describe('AiResult', () => {
  let component: AiResult;
  let fixture: ComponentFixture<AiResult>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiResult]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiResult);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
