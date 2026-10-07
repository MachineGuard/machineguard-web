import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService, Language } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

/** EN | ES selector shared by the header and the sign-in page. */
@Component({
  selector: 'app-language-switch',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="language" role="group" [attr.aria-label]="'header.language' | t">
    @for (option of options; track option.code) {
      <button
        type="button"
        [class.selected]="language() === option.code"
        [attr.aria-pressed]="language() === option.code"
        [attr.aria-label]="option.label | t"
        (click)="i18n.use(option.code)"
      >
        {{ option.code.toUpperCase() }}
      </button>
    }
  </div>`,
  styles: `
    .language {
      display: flex;
      border-radius: 999px;
      background: #e4f1fb;
      padding: 4px;
    }
    button {
      border: 0;
      color: var(--muted);
      background: transparent;
      border-radius: 999px;
      min-height: 32px;
      min-width: 32px;
      font-size: 11px;
    }
    button.selected {
      background: white;
      color: var(--primary);
      font-weight: 600;
      box-shadow: 0 1px 3px #0b1f2a12;
    }
  `,
})
export class LanguageSwitchComponent {
  readonly i18n = inject(I18nService);
  readonly language = this.i18n.language;
  readonly options: { code: Language; label: string }[] = [
    { code: 'es', label: 'header.spanish' },
    { code: 'en', label: 'header.english' },
  ];
}
