import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncioSesion } from './incio-sesion';

describe('IncioSesion', () => {
  let component: IncioSesion;
  let fixture: ComponentFixture<IncioSesion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncioSesion],
    }).compileComponents();

    fixture = TestBed.createComponent(IncioSesion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
