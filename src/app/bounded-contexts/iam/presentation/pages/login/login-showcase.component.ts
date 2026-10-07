import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '../../../../../core/i18n/translate.pipe';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';

/** Decorative brand panel of the sign-in page. */
@Component({
  selector: 'app-login-showcase',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  templateUrl: './login-showcase.component.html',
  styleUrl: './login-showcase.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginShowcaseComponent {}
