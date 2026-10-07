import { LanguageSwitchComponent } from '../../../../../shared/components/language-switch/language-switch.component';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '../../../../../core/i18n/translate.pipe';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { LoginShowcaseComponent } from './login-showcase.component';
import { SessionService } from '../../../application/services/session.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, LoginShowcaseComponent, TranslatePipe, LanguageSwitchComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly passwordVisible = signal(false);
  readonly error = signal<string | null>(null);

  invalid(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitted());
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    const { email, password } = this.form.getRawValue();
    this.session.login({ email: email.trim(), password }).subscribe({
      next: () => void this.router.navigateByUrl(this.returnUrl()),
      error: (error: unknown) => {
        this.submitting.set(false);
        this.error.set(messageFor(error));
      },
    });
  }

  /** Only in-app paths are honoured, so a crafted link cannot redirect elsewhere after sign-in. */
  private returnUrl(): string {
    const target = this.route.snapshot.queryParamMap.get('returnUrl');
    return target && target.startsWith('/') && !target.startsWith('//') ? target : '/dashboard';
  }
}

function messageFor(error: unknown): string {
  const status = error instanceof HttpErrorResponse ? error.status : -1;
  if (status === 401 || status === 400) return 'login.error.credentials';
  if (status === 0 || status >= 502) return 'login.error.connection';
  return 'login.error.generic';
}
