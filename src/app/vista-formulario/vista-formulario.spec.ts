import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VistaFormulario } from './vista-formulario';

describe('VistaFormulario', () => {
  let component: VistaFormulario;
  let fixture: ComponentFixture<VistaFormulario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VistaFormulario],
    }).compileComponents();

    fixture = TestBed.createComponent(VistaFormulario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
