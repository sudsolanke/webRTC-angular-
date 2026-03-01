import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VideoCall } from './components/video-call/video-call';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,VideoCall],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('second-demo');
}
