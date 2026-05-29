import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar.component';
import { Footer } from '../../../shared/components/footer/footer.component';
import { RtlDirective } from '../../../shared/directives/rtl.directive';
import { UiState } from '../../state/ui.state';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { AuthRequiredDialogComponent } from '../../components/auth-required-dialog/auth-required-dialog.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Navbar, Footer, RtlDirective, AlertComponent, AuthRequiredDialogComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  readonly uiState = inject(UiState);
}
