import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VistaAtletas } from './vista-atletas';

describe('VistaAtletas', () => {
  let component: VistaAtletas;
  let fixture: ComponentFixture<VistaAtletas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VistaAtletas],
    }).compileComponents();

    fixture = TestBed.createComponent(VistaAtletas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
