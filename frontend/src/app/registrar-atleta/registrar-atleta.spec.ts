import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarAtleta } from './registrar-atleta';

describe('RegistrarAtleta', () => {
  let component: RegistrarAtleta;
  let fixture: ComponentFixture<RegistrarAtleta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarAtleta],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrarAtleta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
