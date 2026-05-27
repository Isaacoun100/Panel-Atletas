import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Atletas } from './atletas';

describe('Atletas', () => {
  let component: Atletas;
  let fixture: ComponentFixture<Atletas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Atletas],
    }).compileComponents();

    fixture = TestBed.createComponent(Atletas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
