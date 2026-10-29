import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { readJson, writeJson } from './storage';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  readonly theme = signal<Theme>(
    readJson<Theme | null>('rx.theme', null) ??
      (globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  );

  constructor() {
    effect(() => {
      const t = this.theme();
      this.doc.documentElement.classList.toggle('dark', t === 'dark');
      writeJson('rx.theme', t);
    });
  }

  toggle(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }
}
