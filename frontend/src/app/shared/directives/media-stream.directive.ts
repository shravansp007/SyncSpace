import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({
  selector: '[appMediaStream]',
  standalone: true
})
export class MediaStreamDirective implements OnChanges {
  @Input() appMediaStream: MediaStream | null = null;

  constructor(private readonly elementRef: ElementRef<HTMLVideoElement>) {}

  ngOnChanges(): void {
    const element = this.elementRef.nativeElement;
    if (element.srcObject !== this.appMediaStream) {
      element.srcObject = this.appMediaStream;
    }
  }
}
