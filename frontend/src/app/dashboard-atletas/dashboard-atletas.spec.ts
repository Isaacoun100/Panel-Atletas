import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAtletas } from './dashboard-atletas';

describe('DashboardAtletas', () => {
  let component: DashboardAtletas;
  let fixture: ComponentFixture<DashboardAtletas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardAtletas],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardAtletas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
