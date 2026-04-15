import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearAtleta } from './crear-atleta';

describe('CrearAtleta', () => {
  let component: CrearAtleta;
  let fixture: ComponentFixture<CrearAtleta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearAtleta],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearAtleta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
