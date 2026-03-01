import { Component, effect, ElementRef, ViewChild } from '@angular/core';
import { WebrtcService } from '../../services/webrtc.service';

@Component({
  selector: 'app-video-call',
  imports: [],
  templateUrl: './video-call.html',
  styleUrl: './video-call.scss',
})
export class VideoCall {
  @ViewChild ('localVideo') localVideo!:ElementRef<HTMLVideoElement>;
  @ViewChild ('remoteVideo') remoteVideo!:ElementRef<HTMLVideoElement>; 

  roomId = 'room1';

  constructor(private webrtc: WebrtcService) {
    effect(() => {
      const stream = this.webrtc.remoteStream();
      if(stream && this.remoteVideo) {
        this.remoteVideo.nativeElement.srcObject = stream;
      }
    });
  }

  async start() {
    this.webrtc.connect(this.roomId);
    await this.webrtc.startLocalStream(this.localVideo.nativeElement);
    await this.webrtc.createPeer(this.roomId);
  }
}
