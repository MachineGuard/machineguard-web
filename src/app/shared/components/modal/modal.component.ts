import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

let nextId = 0;

/** Native modal dialog: the browser traps focus, closes on Escape and returns focus to the opener. */
@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<dialog
    #dialog
    class="modal"
    [attr.aria-labelledby]="titleId"
    (close)="closed.emit()"
    (click)="closeOnBackdrop($event)"
  >
    <h2 [id]="titleId">{{ heading }}</h2>
    <ng-content />
  </dialog>`,
})
export class ModalComponent implements AfterViewInit {
  @Input({ required: true }) heading!: string;
  @Output() closed = new EventEmitter<void>();
  @ViewChild('dialog') private dialog!: ElementRef<HTMLDialogElement>;
  readonly titleId = `modal-title-${nextId++}`;

  ngAfterViewInit(): void {
    this.dialog.nativeElement.showModal();
  }

  /** A click on the dialog element itself lands on the backdrop; clicks inside hit its children. */
  closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog.nativeElement) this.dialog.nativeElement.close();
  }
}
