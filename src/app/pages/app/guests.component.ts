import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { PageHeaderComponent } from '@app/components/app/page-header.component';
import { EmptyStateComponent } from '@app/components/ui/empty-state.component';
import { FilterBarComponent } from '@app/components/ui/filter-bar.component';
import { FormFieldComponent } from '@app/components/ui/form-field.component';
import { IconComponent } from '@app/components/ui/icon-base.component';
import { ModalComponent } from '@app/components/ui/modal.component';
import { pcAvatar } from '@app/core/data/mock';
import { episodesOfGuest, slugify } from '@app/core/data/query';
import type { Guest } from '@app/core/data/types';
import { PodcastService } from '@app/core/services/podcast.service';
import { UiService } from '@app/core/services/ui.service';
import { usePageTitle } from '@app/core/page-title';

interface LinkRow {
  label: string;
  href: string;
}

@Component({
  selector: 'app-guests-admin-page',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    TranslocoModule,
    PageHeaderComponent,
    EmptyStateComponent,
    FilterBarComponent,
    FormFieldComponent,
    IconComponent,
    ModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *transloco="let t">
      <app-page-header [title]="t('guestsAdmin.title')" [subtitle]="t('guestsAdmin.subtitle')">
        <button
          type="button"
          (click)="openNew()"
          class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          <app-icon name="plus" [size]="16" />
          {{ t('guestsAdmin.new') }}
        </button>
      </app-page-header>

      <app-filter-bar
        [search]="term()"
        (searchChange)="term.set($event)"
        [searchPlaceholder]="t('guestsAdmin.searchPlaceholder')"
      />

      @if (rows().length === 0) {
        <div class="surface-card rounded-2xl border">
          <app-empty-state
            icon="users"
            [title]="t('guestsAdmin.emptyTitle')"
            [description]="t('guestsAdmin.emptyDesc')"
          >
            <button
              type="button"
              (click)="openNew()"
              class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
            >
              <app-icon name="plus" [size]="16" />
              {{ t('guestsAdmin.new') }}
            </button>
          </app-empty-state>
        </div>
      } @else {
        <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          @for (guest of rows(); track guest.id) {
            <article class="surface-card flex flex-col rounded-2xl border p-5">
              <div class="flex items-start gap-4">
                <img
                  [src]="guest.avatar"
                  [alt]="guest.name"
                  class="h-14 w-14 shrink-0 rounded-full object-cover"
                />
                <div class="min-w-0 flex-1">
                  <h3 class="truncate text-base font-semibold text-heading">{{ guest.name }}</h3>
                  <p class="truncate text-sm text-brand-600 dark:text-brand-400">{{ guest.role }}</p>
                </div>
              </div>

              <p class="mt-3 line-clamp-3 flex-1 text-sm text-muted">{{ guest.bio }}</p>

              <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                <span class="inline-flex items-center gap-1.5">
                  <app-icon name="mic" [size]="13" />
                  {{ t('guestsAdmin.episodes') }}: {{ episodeCount(guest.id) }}
                </span>
                <span class="inline-flex items-center gap-1.5">
                  <app-icon name="link" [size]="13" />
                  {{ guest.links.length }}
                </span>
              </div>

              <div class="mt-4 flex items-center gap-2 border-t border-themed pt-4">
                <button
                  type="button"
                  (click)="openEdit(guest)"
                  class="inline-flex h-9 items-center gap-2 rounded-lg border border-themed px-3 text-xs font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <app-icon name="edit" [size]="14" />
                  {{ t('common.edit') }}
                </button>
                <a
                  [routerLink]="['/convidado', guest.slug]"
                  class="inline-flex h-9 items-center gap-2 rounded-lg border border-themed px-3 text-xs font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <app-icon name="external-link" [size]="14" />
                  {{ t('guestsAdmin.viewPublic') }}
                </a>
                <button
                  type="button"
                  (click)="removing.set(guest)"
                  [attr.aria-label]="t('common.remove')"
                  class="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:text-error-500"
                >
                  <app-icon name="trash" [size]="15" />
                </button>
              </div>
            </article>
          }
        </div>
      }

      <!-- ---- Formulário ---- -->
      <app-modal
        [open]="creating() || editing() !== null"
        (closed)="closeForm()"
        size="lg"
        [title]="editing() ? t('guestsAdmin.editTitle') : t('guestsAdmin.newTitle')"
        [subtitle]="t('guestsAdmin.subtitle')"
      >
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field
              [control]="nameControl"
              name="name"
              [label]="t('guestsAdmin.form.name')"
              [errorText]="t('validation.required')"
            />
            <app-form-field
              [control]="roleControl"
              name="role"
              [label]="t('guestsAdmin.form.role')"
              [errorText]="t('validation.required')"
            />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field
              [control]="slugControl"
              name="slug"
              [label]="t('guestsAdmin.form.slug')"
              [hint]="t('common.optional')"
            />
            <app-form-field
              [control]="avatarControl"
              name="avatarSeed"
              [label]="t('guestsAdmin.form.avatar')"
              [hint]="t('guestsAdmin.form.avatarHint')"
            />
          </div>
          <app-form-field
            [control]="bioControl"
            name="bio"
            control-type="textarea"
            [rows]="4"
            [label]="t('guestsAdmin.form.bio')"
            [errorText]="bioError(t)"
          />

          <div>
            <p class="mb-2 text-sm font-medium text-heading">{{ t('guestsAdmin.form.links') }}</p>
            <div class="space-y-2">
              @for (link of links(); track $index; let i = $index) {
                <div class="flex flex-col gap-2 sm:flex-row">
                  <input
                    [ngModel]="link.label"
                    [ngModelOptions]="{ standalone: true }"
                    (ngModelChange)="patchLink(i, { label: $event })"
                    [placeholder]="t('guestsAdmin.form.linkLabel')"
                    class="focus-ring min-w-0 flex-1 rounded-lg border border-themed bg-transparent px-3 py-2 text-sm text-body"
                  />
                  <input
                    [ngModel]="link.href"
                    [ngModelOptions]="{ standalone: true }"
                    (ngModelChange)="patchLink(i, { href: $event })"
                    [placeholder]="t('guestsAdmin.form.linkHref')"
                    class="focus-ring min-w-0 flex-1 rounded-lg border border-themed bg-transparent px-3 py-2 text-sm text-body"
                  />
                  <button
                    type="button"
                    (click)="removeLink(i)"
                    [attr.aria-label]="t('common.remove')"
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:text-error-500"
                  >
                    <app-icon name="minus" [size]="15" />
                  </button>
                </div>
              }
            </div>
            <button
              type="button"
              (click)="addLink()"
              class="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              <app-icon name="plus" [size]="13" />
              {{ t('guestsAdmin.form.addLink') }}
            </button>
          </div>

          <div class="flex items-center justify-end gap-2 border-t border-themed pt-4">
            <button
              type="button"
              (click)="closeForm()"
              class="rounded-lg border border-themed px-4 py-2 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
            >
              {{ t('common.save') }}
            </button>
          </div>
        </form>
      </app-modal>

      <!-- ---- Remover ---- -->
      <app-modal
        [open]="removing() !== null"
        (closed)="removing.set(null)"
        [title]="t('guestsAdmin.confirmRemove')"
        [subtitle]="removing()?.name"
        [hasFooter]="true"
      >
        <p class="text-sm text-muted">{{ t('guestsAdmin.confirmRemoveDesc') }}</p>
        <ng-container modalFooter>
          <button
            type="button"
            (click)="removing.set(null)"
            class="rounded-lg border border-themed px-4 py-2 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            (click)="confirmRemove()"
            class="rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-error-600"
          >
            {{ t('common.remove') }}
          </button>
        </ng-container>
      </app-modal>
    </div>
  `,
})
export class GuestsAdminPageComponent {
  private podcast = inject(PodcastService);
  private ui = inject(UiService);
  private transloco = inject(TranslocoService);

  protected readonly term = signal('');
  protected readonly editing = signal<Guest | null>(null);
  protected readonly creating = signal(false);
  protected readonly removing = signal<Guest | null>(null);
  protected readonly links = signal<LinkRow[]>([]);

  protected readonly nameControl = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  protected readonly roleControl = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  protected readonly slugControl = new FormControl('', { nonNullable: true });
  protected readonly avatarControl = new FormControl('', { nonNullable: true });
  protected readonly bioControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(20)],
  });

  protected readonly form = new FormGroup({
    name: this.nameControl,
    role: this.roleControl,
    slug: this.slugControl,
    avatarSeed: this.avatarControl,
    bio: this.bioControl,
  });

  protected readonly rows = computed(() => {
    const q = this.term().trim().toLowerCase();
    const guests = this.podcast.guests();
    if (!q) return guests;
    return guests.filter((g) => `${g.name} ${g.role} ${g.bio}`.toLowerCase().includes(q));
  });

  constructor() {
    usePageTitle('guestsAdmin.title');
  }

  protected episodeCount(guestId: number) {
    return episodesOfGuest(this.podcast.episodes(), guestId).length;
  }

  protected bioError(t: (key: string, params?: Record<string, unknown>) => string) {
    return this.bioControl.hasError('minlength')
      ? t('validation.min', { count: 20 })
      : t('validation.required');
  }

  protected openNew() {
    this.editing.set(null);
    this.links.set([{ label: '', href: 'https://' }]);
    this.form.reset({ name: '', role: '', slug: '', avatarSeed: '', bio: '' });
    this.creating.set(true);
  }

  protected openEdit(guest: Guest) {
    this.creating.set(false);
    this.links.set(guest.links.map((l) => ({ ...l })));
    this.form.reset({
      name: guest.name,
      role: guest.role,
      slug: guest.slug,
      avatarSeed: guest.slug,
      bio: guest.bio,
    });
    this.editing.set(guest);
  }

  protected closeForm() {
    this.editing.set(null);
    this.creating.set(false);
  }

  protected addLink() {
    this.links.update((rows) => [...rows, { label: '', href: 'https://' }]);
  }

  protected patchLink(index: number, patch: Partial<LinkRow>) {
    this.links.update((rows) => rows.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  protected removeLink(index: number) {
    this.links.update((rows) => rows.filter((_, i) => i !== index));
  }

  protected submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const values = this.form.getRawValue();
    const cleanLinks = this.links().filter((l) => l.label.trim() && l.href.trim());
    const slug = values.slug || slugify(values.name);
    const avatar = pcAvatar(values.avatarSeed || slug);
    const editing = this.editing();
    if (editing) {
      this.podcast.updateGuest(editing.id, {
        name: values.name,
        role: values.role,
        bio: values.bio,
        slug,
        avatar,
        links: cleanLinks,
      });
      this.ui.notifySuccess(this.transloco.translate('guestsAdmin.updated'));
    } else {
      this.podcast.addGuest({
        name: values.name,
        slug,
        role: values.role,
        bio: values.bio,
        avatar,
        links: cleanLinks,
      });
      this.ui.notifySuccess(this.transloco.translate('guestsAdmin.created'));
    }
    this.closeForm();
  }

  protected confirmRemove() {
    const guest = this.removing();
    if (guest) this.podcast.removeGuest(guest.id);
    this.ui.notifySuccess(this.transloco.translate('guestsAdmin.removed'));
    this.removing.set(null);
  }
}
