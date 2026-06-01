import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InicioAtleta } from './inicio-atleta';

describe('InicioAtleta', () => {
  let component: InicioAtleta;
  let fixture: ComponentFixture<InicioAtleta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioAtleta],
    }).compileComponents();

    fixture = TestBed.createComponent(InicioAtleta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
