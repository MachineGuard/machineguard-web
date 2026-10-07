import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
@Component({
  selector: 'app-feature-placeholder',
  standalone: true,
  imports: [RouterLink, IconComponent, TranslatePipe],
  templateUrl: './feature-placeholder.component.html',
  styleUrl: './feature-placeholder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title = this.route.snapshot.data['title'] as string;
  readonly context = this.route.snapshot.data['context'] as string;
  readonly description = this.route.snapshot.data['description'] as string;
}
