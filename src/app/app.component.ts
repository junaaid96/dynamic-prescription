import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComprehensiveLayoutComponent } from './components/comprehensive-layout.component';

@Component({
  selector: 'app-root',
  imports: [ComprehensiveLayoutComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly title = signal('dynamic-prescription');
}
