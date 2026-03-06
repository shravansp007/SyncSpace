import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-typing-indicator',
  standalone: true,
  templateUrl: './typing-indicator.component.html',
  styleUrl: './typing-indicator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TypingIndicatorComponent {
  @Input() users: string[] = [];

  get label(): string {
    if (this.users.length === 0) {
      return 'Someone is typing...';
    }

    if (this.users.length === 1) {
      return `${this.users[0]} is typing...`;
    }

    return `${this.users[0]} and ${this.users.length - 1} others are typing...`;
  }
}

