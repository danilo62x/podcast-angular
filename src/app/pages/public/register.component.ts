import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AuthShellComponent } from '@app/components/layout/auth-shell.component';
import { AuthService } from '@app/core/services/auth.service';
import { UiService } from '@app/core/services/ui.service';
import { usePageTitle } from '@app/core/page-title';

const CONTROL =
  'h-11 w-full rounded-lg border border-themed bg-gray-50 px-3 text-sm text-body outline-none focus:border-brand-300 focus-ring dark:bg-gray-900';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslocoModule, AuthShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      <app-auth-shell
        [title]="t('auth.registerTitle')"
        [subtitle]="t('auth.registerSubtitle')"
        [hasFooter]="true"
      >
        <form (ngSubmit)="handleSubmit()" class="space-y-4">
          <div>
            <label class="mb-2 block text-sm font-medium text-heading" for="name">{{ t('auth.name') }}</label>
            <input
              id="name"
              name="name"
              required
              [ngModel]="name()"
              (ngModelChange)="name.set($event)"
              [class]="control"
            />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-heading" for="show">
              {{ t('auth.showName') }}
            </label>
            <input
              id="show"
              name="show"
              [ngModel]="showName()"
              (ngModelChange)="showName.set($event)"
              [class]="control"
            />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-heading" for="remail">{{ t('auth.email') }}</label>
            <input
              id="remail"
              name="remail"
              type="email"
              required
              [ngModel]="email()"
              (ngModelChange)="email.set($event)"
              [class]="control"
            />
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-heading" for="rpassword">
              {{ t('auth.password') }}
            </label>
            <input
              id="rpassword"
              name="rpassword"
              type="password"
              required
              [ngModel]="password()"
              (ngModelChange)="password.set($event)"
              [class]="control"
            />
          </div>

          <label class="flex items-start gap-2 text-sm text-body">
            <input
              type="checkbox"
              name="accepted"
              required
              [ngModel]="accepted()"
              (ngModelChange)="accepted.set($event)"
              class="mt-0.5 h-4 w-4 rounded border-themed accent-brand-500"
            />
            <span class="min-w-0">{{ t('auth.terms') }}</span>
          </label>

          <button
            type="submit"
            [disabled]="loading()"
            class="focus-ring flex h-11 w-full items-center justify-center rounded-lg bg-brand-500 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            {{ t('auth.registerCta') }}
          </button>
        </form>

        <ng-container authFooter>
          {{ t('auth.hasAccount') }}
          <a routerLink="/login" class="font-medium text-brand-500 hover:text-brand-600">
            {{ t('auth.loginLink') }}
          </a>
        </ng-container>
      </app-auth-shell>
    </ng-container>
  `,
})
export class RegisterPageComponent {
  private auth = inject(AuthService);
  private ui = inject(UiService);
  private router = inject(Router);
  private transloco = inject(TranslocoService);

  protected readonly control = CONTROL;
  protected readonly name = signal('');
  protected readonly showName = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly accepted = signal(false);
  protected readonly loading = signal(false);

  constructor() {
    usePageTitle('auth.registerTitle');
  }

  protected async handleSubmit() {
    this.loading.set(true);
    const ok = await this.auth.register(this.name(), this.email(), this.password());
    this.loading.set(false);
    if (!ok) return;
    this.ui.notifySuccess(this.transloco.translate('auth.registerSuccess'));
    this.router.navigate(['/app']);
  }
}
