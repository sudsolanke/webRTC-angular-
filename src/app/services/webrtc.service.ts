import { Injectable, signal } from "@angular/core";
import { io, Socket } from 'socket.io-client';

@Injectable({providedIn:'root'})
export class  WebrtcService {
    private socket!: Socket;
    private peerConnection!: RTCPeerConnection;
    private localStream!: MediaStream;
    private videoSender!: RTCRtpSender;

    remoteStream = signal<MediaStream | null>(null);

    private iceConfig = {
        iceServers:[{urls:'stun:stun.l.google.com:19302'}]
    };

    connect(roomId:string) {
        this.socket = io('http://localhost:3000');

        this.socket.emit('join-room',roomId);

        this.socket.on('offer', async (offer) => {
            await this.handleOffer(offer, roomId);
        });

        this.socket.on('answer', async (answer) => {
            await this.peerConnection.setRemoteDescription(answer);
        });

        this.socket.on('ice-candidate', async (candidate) => {
            await this.peerConnection.addIceCandidate(candidate);
        });
    }

    async startLocalStream(videoElement: HTMLVideoElement) {
        this.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        videoElement.srcObject = this.localStream;
    }

    async createPeer(roomId:string) {
        this.peerConnection = new RTCPeerConnection(this.iceConfig);

        this.localStream.getTracks().forEach(track => {
            const sender = this.peerConnection.addTrack(track, this.localStream);

            if(track.kind == 'video') {
                this.videoSender = sender;
            }
        });

        this.peerConnection.ontrack = event => {
            this.remoteStream.set(event.streams[0]);
        }

        this.peerConnection.onicecandidate = event => {
            if(event.candidate){
                this.socket.emit('ice-candidate',{
                    roomId,
                    candidate:event.candidate
                })
            }
        }

        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        this.socket.emit('offer',{roomId,offer});
    }

    private async handleOffer(offer: RTCSessionDescriptionInit, roomId: string) {
        this.peerConnection = new RTCPeerConnection(this.iceConfig);

        this.localStream.getTracks().forEach(track =>{
            this.peerConnection.addTrack(track, this.localStream);
        });

        this.peerConnection.ontrack = event => {
            this.remoteStream.set(event.streams[0]);
        }

        this.peerConnection.setRemoteDescription(offer);

        const answer = this.peerConnection.createAnswer();
        await this.socket.emit('answer', {roomId, answer})
    }

    async shareScreen(videoElemnt: HTMLVideoElement) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({video:true});

        const screenTrack = screenStream.getVideoTracks()[0];

        await this.videoSender.replaceTrack(screenTrack);

        videoElemnt.srcObject = screenStream;

        screenTrack.onended = async () => {
            this.videoSender.replaceTrack(
                await this.localStream.getVideoTracks()[0]
            );
            videoElemnt.srcObject = this.localStream;
        }

    }
}