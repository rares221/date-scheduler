import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { APP_CONFIG } from '../../data/config';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
  selector: 'app-story',
  imports: [RevealDirective],
  templateUrl: './story.html',
  styleUrl: './story.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Story {
  protected readonly cfg = inject(APP_CONFIG);
}
