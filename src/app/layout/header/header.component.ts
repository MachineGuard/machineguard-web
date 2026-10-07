import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs';
import { WorkspaceService } from '../../bounded-contexts/iam/application/services/workspace.service';
import { AlertService } from '../../bounded-contexts/alert-incident-management/application/services/alert.service';
import {
  inject,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AsyncPipe, IconComponent, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  readonly profile$ = inject(WorkspaceService).profile$;
  readonly notificationCount$ = inject(AlertService).latestAlerts$.pipe(
    map((alerts) => alerts.length),
  );
  readonly language = signal('EN');
  @Input() navigationOpen = false;
  @Output() menuToggle = new EventEmitter<void>();
  readonly notificationsOpen = signal(false);
  readonly menuOpen = signal(false);
}
