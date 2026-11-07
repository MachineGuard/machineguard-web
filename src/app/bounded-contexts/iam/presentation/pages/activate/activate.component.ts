import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../../core/i18n/translate.pipe';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { LanguageSwitchComponent } from '../../../../../shared/components/language-switch/language-switch.component';
import { AccountActivationService } from '../../../application/services/account-activation.service';
import { passwordLengthIssue } from '../../../domain/models/password-policy';
import { LoginShowcaseComponent } from '../login/login-showcase.component';

/** Client-side copy of Core's password length rule; Core still validates on submit. */
function passwordRule(control: AbstractControl): ValidationErrors | null {
  const issue = control.value ? passwordLengthIssue(control.value) : null;
  return issue ? { [issue]: true } : null;
}

@Component({
  selector: 'app-activate',
  imports: [ReactiveFormsModule, RouterLink, IconComponent, LoginShowcaseComponent, TranslatePipe, LanguageSwitchComponent],
  templateUrl: './activate.component.html',
  styleUrl: './activate.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivateComponent implements OnInit {
  private readonly activation = inject(AccountActivationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  /** Kept in memory only: never rendered, logged or copied into the address bar. */
  private token: string | null = null;

  readonly form = inject(FormBuilder).nonNullable.group({
    password: ['', [Validators.required, passwordRule]],
    confirmPassword: ['', Validators.required],
  });
  readonly tokenMissing = signal(false);
  readonly tokenRejected = signal(false);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly completed = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.token = params.get('token')?.trim() || null;
    this.tokenMissing.set(this.token === null);
    if (params.has('token')) {
      // Removes the invitation from the address bar and history as soon as it has been read.
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { token: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  passwordErrorKey(): string | null {
    if (!this.shown('password')) return null;
    const errors = this.form.controls.password.errors;
    if (!errors) return null;
    if (errors['required']) return 'activate.passwordRequired';
    return errors['short'] ? 'activate.passwordShort' : 'activate.passwordLong';
  }

  confirmErrorKey(): string | null {
    if (!this.shown('confirmPassword')) return null;
    const { password, confirmPassword } = this.form.getRawValue();
    if (!confirmPassword) return 'activate.confirmRequired';
    return password === confirmPassword ? null : 'activate.confirmMismatch';
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (!this.token || this.submitting() || this.form.invalid || this.confirmErrorKey()) return;
    this.submitting.set(true);
    const { password } = this.form.getRawValue();
    this.activation.activate(this.token, password).subscribe({
      next: () => {
        this.token = null;
        this.form.reset();
        this.submitting.set(false);
        this.completed.set(true);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.token = null;
          this.tokenRejected.set(true);
          return;
        }
        this.error.set(messageFor(error));
      },
    });
  }

  private shown(field: 'password' | 'confirmPassword'): boolean {
    return this.submitted() || this.form.controls[field].touched;
  }
}

function messageFor(error: unknown): string {
  const status = error instanceof HttpErrorResponse ? error.status : -1;
  if (status === 400) return 'activate.error.password';
  if (status === 0 || status >= 502) return 'activate.error.connection';
  return 'activate.error.generic';
}
