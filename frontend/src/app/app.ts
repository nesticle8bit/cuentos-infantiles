import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlayerComponent } from './components/player/player';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PlayerComponent],
  template: `
    <router-outlet />
    <app-player />
  `,
  styles: [],
})
export class App {}
