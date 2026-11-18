import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FxService } from '../../services/fx.service';

@Component({
  selector: 'app-fx-layer',
  template: `
    @for (p of fx.particles(); track p.id) {
      <i [class]="p.kind === 'confetti' ? 'c' : 'h'" [style]="p.style"></i>
    }
  `,
  styleUrl: './fx-layer.scss',
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FxLayer {
  protected readonly fx = inject(FxService);
}
