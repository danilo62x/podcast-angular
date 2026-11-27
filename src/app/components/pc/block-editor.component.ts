import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '@app/components/ui/icon-base.component';
import type { Block, BlockType } from '@app/core/data/types';

const TYPES: BlockType[] = ['paragraph', 'heading', 'list', 'quote', 'link'];

const TYPE_ICON: Record<BlockType, string> = {
  paragraph: 'file-text',
  heading: 'tag',
  list: 'list',
  quote: 'message-circle',
  link: 'link',
};

function emptyBlock(type: BlockType): Block {
  if (type === 'list') return { type, items: [''] };
  if (type === 'link') return { type, href: 'https://', label: '' };
  return { type, text: '' };
}

const CONTROL = 'focus-ring w-full rounded-lg border border-themed bg-transparent px-3 py-2 text-sm text-body';

/** Editor das notas do episódio em blocos — parágrafo, título, lista, citação e link. */
@Component({
  selector: 'app-block-editor',
  standalone: true,
  imports: [FormsModule, TranslocoModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3" *transloco="let t">
      @for (block of blocks; track $index; let i = $index) {
        <div class="surface-card rounded-xl border p-3">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
              <app-icon [name]="typeIcon(block.type)" [size]="14" />
              {{ t('editor.notes.blocks.' + block.type) }}
            </span>
            <div class="flex items-center gap-1">
              <button
                type="button"
                (click)="move(i, -1)"
                [disabled]="i === 0"
                [attr.aria-label]="t('editor.notes.moveUp')"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:text-heading disabled:opacity-30"
              >
                <app-icon name="arrow-up" [size]="14" />
              </button>
              <button
                type="button"
                (click)="move(i, 1)"
                [disabled]="i === blocks.length - 1"
                [attr.aria-label]="t('editor.notes.moveDown')"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:text-heading disabled:opacity-30"
              >
                <app-icon name="arrow-down" [size]="14" />
              </button>
              <button
                type="button"
                (click)="remove(i)"
                [attr.aria-label]="t('common.remove')"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:text-error-500"
              >
                <app-icon name="trash" [size]="14" />
              </button>
            </div>
          </div>

          @if (block.type === 'list') {
            <div class="space-y-2">
              @for (item of block.items ?? []; track $index; let j = $index) {
                <div class="flex items-center gap-2">
                  <input
                    [ngModel]="item"
                    (ngModelChange)="patchItem(i, j, $event)"
                    [placeholder]="t('editor.notes.itemPlaceholder')"
                    [class]="control"
                  />
                  <button
                    type="button"
                    (click)="removeItem(i, j)"
                    [attr.aria-label]="t('common.remove')"
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:text-error-500"
                  >
                    <app-icon name="minus" [size]="14" />
                  </button>
                </div>
              }
              <button
                type="button"
                (click)="addItem(i)"
                class="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                <app-icon name="plus" [size]="13" />
                {{ t('editor.notes.addItem') }}
              </button>
            </div>
          } @else if (block.type === 'link') {
            <div class="grid gap-2 sm:grid-cols-2">
              <input
                [ngModel]="block.label ?? ''"
                (ngModelChange)="patch(i, { label: $event })"
                [placeholder]="t('editor.notes.linkLabel')"
                [class]="control"
              />
              <input
                [ngModel]="block.href ?? ''"
                (ngModelChange)="patch(i, { href: $event })"
                placeholder="https://"
                [class]="control"
              />
            </div>
          } @else {
            <textarea
              [ngModel]="block.text ?? ''"
              (ngModelChange)="patch(i, { text: $event })"
              [rows]="block.type === 'heading' ? 1 : 3"
              [placeholder]="t('editor.notes.placeholders.' + block.type)"
              [class]="control"
            ></textarea>
          }
        </div>
      }

      <div class="flex flex-wrap gap-2">
        @for (type of types; track type) {
          <button
            type="button"
            (click)="add(type)"
            class="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-themed px-3 text-xs font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <app-icon name="plus" [size]="13" />
            {{ t('editor.notes.blocks.' + type) }}
          </button>
        }
      </div>
    </div>
  `,
})
export class BlockEditorComponent {
  @Input({ required: true }) blocks: Block[] = [];
  @Output() blocksChange = new EventEmitter<Block[]>();

  protected readonly types = TYPES;
  protected readonly control = CONTROL;

  protected typeIcon(type: BlockType) {
    return TYPE_ICON[type];
  }

  protected patch(index: number, next: Partial<Block>) {
    this.blocksChange.emit(this.blocks.map((b, i) => (i === index ? { ...b, ...next } : b)));
  }

  protected patchItem(index: number, itemIndex: number, value: string) {
    const items = (this.blocks[index].items ?? []).map((it, k) => (k === itemIndex ? value : it));
    this.patch(index, { items });
  }

  protected addItem(index: number) {
    this.patch(index, { items: [...(this.blocks[index].items ?? []), ''] });
  }

  protected removeItem(index: number, itemIndex: number) {
    this.patch(index, { items: (this.blocks[index].items ?? []).filter((_, k) => k !== itemIndex) });
  }

  protected move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= this.blocks.length) return;
    const next = [...this.blocks];
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row);
    this.blocksChange.emit(next);
  }

  protected remove(index: number) {
    this.blocksChange.emit(this.blocks.filter((_, i) => i !== index));
  }

  protected add(type: BlockType) {
    this.blocksChange.emit([...this.blocks, emptyBlock(type)]);
  }
}
