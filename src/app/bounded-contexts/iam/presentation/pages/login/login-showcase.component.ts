import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';

/** Decorative brand panel of the sign-in page; the reading shown is illustrative, not live data. */
@Component({
  selector: 'app-login-showcase',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './login-showcase.component.html',
  styleUrl: './login-showcase.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginShowcaseComponent {}
