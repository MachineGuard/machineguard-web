import { effect, inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { I18nService } from './i18n.service';

/** Route `title` values are translation keys; the tab title follows the selected language. */
@Injectable()
export class I18nTitleStrategy extends TitleStrategy {
  private readonly i18n = inject(I18nService);
  private readonly title = inject(Title);
  private key = 'title.app';

  constructor() {
    super();
    effect(() => this.title.setTitle(this.i18n.t(this.key)));
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.key = this.buildTitle(snapshot) ?? 'title.app';
    this.title.setTitle(this.i18n.t(this.key));
  }
}
