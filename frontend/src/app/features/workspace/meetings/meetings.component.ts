import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { MeetingService, WorkspaceMeeting } from '../../../core/services/meeting.service';

@Component({
  selector: 'app-meetings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './meetings.component.html'
})
export class MeetingsComponent implements OnInit {
  meetings: WorkspaceMeeting[] = [];
  loading = true;

  constructor(
    private readonly router: Router,
    private readonly meetingService: MeetingService
  ) {}

  ngOnInit(): void {
    this.meetingService.list()
      .pipe(catchError(() => of([])))
      .subscribe((meetings) => {
        this.meetings = meetings;
        this.loading = false;
      });
  }

  createMeeting(): void {
    this.router.navigate(['/workspace/meetings/create']);
  }

  joinMeeting(meetingId: number): void {
    this.meetingService.join(meetingId)
      .pipe(catchError(() => of({ meetingId })))
      .subscribe(() => {
        this.router.navigate(['/workspace/meeting', meetingId]);
      });
  }
}
