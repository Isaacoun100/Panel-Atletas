import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Administrar } from './administrar';

describe('Administrar', () => {
  let component: Administrar;
  let fixture: ComponentFixture<Administrar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Administrar],
    }).compileComponents();

    fixture = TestBed.createComponent(Administrar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
