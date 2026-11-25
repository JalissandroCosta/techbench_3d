import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { App } from './app';

describe('App', () => {
  it('renderiza o cabeçalho TECHBENCH 3D e o painel lateral', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.brand-title')?.textContent).toContain('TECHBENCH 3D');
    expect(compiled.querySelector('app-viewport-3d')).not.toBeNull();
    expect(compiled.querySelector('app-inspector-sidebar')).not.toBeNull();
    expect(compiled.textContent).toContain('Componentes');
    expect(compiled.textContent).toContain('Informações');
  });
});
