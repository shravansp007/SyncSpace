import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WebsocketService } from './websocket.service';

interface SignalPayload {
  meetingId: string;
  from: string;
  to?: string;
  payload: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class WebrtcVideoService {
  private readonly rtcConfig: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  private meetingId = '';
  private selfId = '';
  private localStream: MediaStream | null = null;
  private readonly peers = new Map<string, RTCPeerConnection>();
  private readonly remoteStreams = new Map<string, MediaStream>();

  readonly localStream$ = new BehaviorSubject<MediaStream | null>(null);
  readonly remoteStreams$ = new BehaviorSubject<Map<string, MediaStream>>(new Map());

  constructor(private readonly websocketService: WebsocketService) {}

  async init(meetingId: string, selfId: string): Promise<void> {
    this.meetingId = meetingId;
    this.selfId = selfId;
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.localStream$.next(this.localStream);

    this.websocketService.watch<SignalPayload>('/topic/video-offer')
      .subscribe((signal) => this.onOffer(signal));
    this.websocketService.watch<SignalPayload>('/topic/video-answer')
      .subscribe((signal) => this.onAnswer(signal));
    this.websocketService.watch<SignalPayload>('/topic/video-candidate')
      .subscribe((signal) => this.onCandidate(signal));
    this.websocketService.watch<{ event: string; meetingId: string; email: string }>('/topic/meetings')
      .subscribe((event) => {
        if (event.event === 'MEETING_JOINED' && String(event.meetingId) === this.meetingId && event.email !== this.selfId) {
          this.createOffer(event.email);
        }
      });
  }

  async createOffer(target: string): Promise<void> {
    const peer = this.getOrCreatePeer(target);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    this.websocketService.publish('/app/video-offer', {
      meetingId: this.meetingId,
      from: this.selfId,
      to: target,
      payload: { sdp: offer }
    });
  }

  disconnect(): void {
    this.peers.forEach((peer) => peer.close());
    this.peers.clear();
    this.remoteStreams.clear();
    this.remoteStreams$.next(new Map());
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;
    this.localStream$.next(null);
  }

  private getOrCreatePeer(peerId: string): RTCPeerConnection {
    const existing = this.peers.get(peerId);
    if (existing) {
      return existing;
    }

    const connection = new RTCPeerConnection(this.rtcConfig);
    this.localStream?.getTracks().forEach((track) => connection.addTrack(track, this.localStream!));

    connection.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }
      this.websocketService.publish('/app/video-candidate', {
        meetingId: this.meetingId,
        from: this.selfId,
        to: peerId,
        payload: { candidate: event.candidate }
      });
    };

    connection.ontrack = (event) => {
      const stream = event.streams[0];
      if (!stream) {
        return;
      }
      this.remoteStreams.set(peerId, stream);
      this.remoteStreams$.next(new Map(this.remoteStreams));
    };

    this.peers.set(peerId, connection);
    return connection;
  }

  private async onOffer(signal: SignalPayload): Promise<void> {
    if (!this.isForCurrentMeeting(signal) || signal.from === this.selfId || (signal.to && signal.to !== this.selfId)) {
      return;
    }

    const peer = this.getOrCreatePeer(signal.from);
    const sdp = signal.payload?.['sdp'] as RTCSessionDescriptionInit | undefined;
    if (!sdp) {
      return;
    }
    await peer.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    this.websocketService.publish('/app/video-answer', {
      meetingId: this.meetingId,
      from: this.selfId,
      to: signal.from,
      payload: { sdp: answer }
    });
  }

  private async onAnswer(signal: SignalPayload): Promise<void> {
    if (!this.isForCurrentMeeting(signal) || signal.from === this.selfId || (signal.to && signal.to !== this.selfId)) {
      return;
    }

    const peer = this.peers.get(signal.from);
    const sdp = signal.payload?.['sdp'] as RTCSessionDescriptionInit | undefined;
    if (!peer || !sdp) {
      return;
    }
    await peer.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  private async onCandidate(signal: SignalPayload): Promise<void> {
    if (!this.isForCurrentMeeting(signal) || signal.from === this.selfId || (signal.to && signal.to !== this.selfId)) {
      return;
    }

    const peer = this.getOrCreatePeer(signal.from);
    const candidate = signal.payload?.['candidate'] as RTCIceCandidateInit | undefined;
    if (!candidate) {
      return;
    }
    await peer.addIceCandidate(new RTCIceCandidate(candidate));
  }

  private isForCurrentMeeting(signal: SignalPayload): boolean {
    return String(signal.meetingId) === this.meetingId;
  }
}
