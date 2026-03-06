import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-block',
  standalone: true,
  templateUrl: './skeleton-block.component.html',
  styleUrl: './skeleton-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonBlockComponent {
  @Input() height = 96;
}
