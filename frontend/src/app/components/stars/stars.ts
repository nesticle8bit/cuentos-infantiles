import { Component, OnInit } from '@angular/core';
interface Star {
  top: string;
  left: string;
  size: string;
  delay: string;
  duration: string;
  opacity: string;
}

@Component({
  selector: 'app-stars',
  imports: [],
  template: `
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      @for (star of stars; track $index) {
        <div
          class="absolute rounded-full bg-white animate-twinkle"
          [style.top]="star.top"
          [style.left]="star.left"
          [style.width]="star.size"
          [style.height]="star.size"
          [style.animation-delay]="star.delay"
          [style.animation-duration]="star.duration"
          [style.opacity]="star.opacity"
        ></div>
      }
      <!-- Luna decorativa -->
      <div class="absolute top-8 right-8 text-6xl animate-float select-none" style="filter: drop-shadow(0 0 20px rgba(251,191,36,0.6))">
        🌙
      </div>
    </div>
  `,
})
export class StarsComponent implements OnInit {
  stars: Star[] = [];

  ngOnInit() {
    this.stars = Array.from({ length: 80 }, () => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 3 + 1}px`,
      delay: `${Math.random() * 4}s`,
      duration: `${Math.random() * 3 + 1.5}s`,
      opacity: `${Math.random() * 0.7 + 0.3}`,
    }));
  }
}
