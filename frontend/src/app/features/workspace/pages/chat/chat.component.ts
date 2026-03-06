import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, effect, signal } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { combineLatest, debounceTime, map, tap } from 'rxjs';

import { ChatRoom } from '../../../../core/models/chat-room.model';
import { PresenceMember } from '../../../../core/models/user.model';
import { PresenceService } from '../../../../core/services/presence.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthStore } from '../../../../core/state/auth.store';
import { ChatStore } from '../../../../core/state/chat.store';
import { springIn, staggerList } from '../../../../shared/animations/motion.animations';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonBlockComponent } from '../../../../shared/components/skeleton-block/skeleton-block.component';
import { TypingIndicatorComponent } from '../../../../shared/components/typing-indicator/typing-indicator.component';
import { MATERIAL_IMPORTS } from '../../../../shared/material/material.imports';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, EmptyStateComponent, SkeletonBlockComponent, TypingIndicatorComponent, ...MATERIAL_IMPORTS],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  animations: [springIn, staggerList],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatComponent {
  @ViewChild('messageContainer')
  private messageContainer?: ElementRef<HTMLDivElement>;

  readonly baseRooms = signal<ChatRoom[]>([
    { id: 'general', name: 'General', unread: 0 },
    { id: 'engineering', name: 'Engineering', unread: 0 },
    { id: 'design', name: 'Design', unread: 0 },
    { id: 'product', name: 'Product', unread: 0 },
    { id: 'random', name: 'Random', unread: 0 }
  ]);

  readonly roomForm = this.formBuilder.nonNullable.group({
    roomId: ['general', [Validators.required]]
  });

  readonly messageForm = this.formBuilder.nonNullable.group({
    message: ['', [Validators.required, Validators.maxLength(2000)]]
  });

  readonly vm = toSignal(
    combineLatest([
      this.chatStore.state$,
      this.presenceService.members$,
      this.presenceService.loading$,
      this.authStore.state$.pipe(map((state) => state.session?.user.email ?? ''))
    ]).pipe(
      map(([chatState, members, membersLoading, senderEmail]) => ({
        chatState,
        members,
        membersLoading,
        senderEmail
      }))
    ),
    {
      initialValue: {
        chatState: {
          roomId: 'general',
          loading: false,
          typing: false,
          typingUsers: [],
          messages: [],
          unreadByRoom: {},
          error: null
        },
        members: [] as PresenceMember[],
        membersLoading: true,
        senderEmail: ''
      }
    }
  );

  readonly activeRoom = computed(() => this.vm().chatState.roomId);
  readonly rooms = computed(() =>
    this.baseRooms().map((room) => ({
      ...room,
      unread: this.vm().chatState.unreadByRoom[room.id] ?? 0
    }))
  );

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly chatStore: ChatStore,
    private readonly authStore: AuthStore,
    private readonly presenceService: PresenceService,
    private readonly toast: ToastService
  ) {
    const token = this.authStore.token;
    if (token) {
      this.chatStore.joinRoom('general', token);
    }

    this.messageForm.controls.message.valueChanges
      .pipe(
        tap(() => this.chatStore.setTyping(true)),
        debounceTime(700),
        tap(() => this.chatStore.setTyping(false)),
        takeUntilDestroyed()
      )
      .subscribe();

    effect(() => {
      this.vm().chatState.messages.length;
      queueMicrotask(() => this.scrollToBottom());
    });
  }

  selectRoom(roomId: string): void {
    this.roomForm.patchValue({ roomId });
    this.joinRoom();
  }

  joinRoom(): void {
    const token = this.authStore.token;
    if (!token) {
      this.toast.error('Session expired. Please login again.');
      return;
    }

    if (this.roomForm.invalid) {
      this.roomForm.markAllAsTouched();
      return;
    }

    this.chatStore.joinRoom(this.roomForm.controls.roomId.value, token);
    this.chatStore.setUnread(this.roomForm.controls.roomId.value, 0);
  }

  sendMessage(): void {
    const senderEmail = this.vm().senderEmail;
    if (this.messageForm.invalid || !senderEmail) {
      this.messageForm.markAllAsTouched();
      return;
    }

    this.chatStore.send(this.messageForm.controls.message.value, senderEmail);
    this.messageForm.reset({ message: '' });
    this.chatStore.setTyping(false);
  }

  trackMember(index: number, member: PresenceMember): string {
    return `${member.id}-${index}`;
  }

  statusLabel(member: PresenceMember): string {
    return member.status[0].toUpperCase() + member.status.slice(1);
  }

  private scrollToBottom(): void {
    if (!this.messageContainer) {
      return;
    }

    const container = this.messageContainer.nativeElement;
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 90;
    if (nearBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }
}

