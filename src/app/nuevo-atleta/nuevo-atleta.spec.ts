import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { NuevoAtleta } from './nuevo-atleta';

describe('NuevoAtleta', () => {
  let component: NuevoAtleta;
  let fixture: ComponentFixture<NuevoAtleta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevoAtleta],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(NuevoAtleta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
