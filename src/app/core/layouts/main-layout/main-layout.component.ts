import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar.component';
import { Footer } from '../../../shared/components/footer/footer.component';
import { RtlDirective } from '../../../shared/directives/rtl.directive';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Navbar, Footer, RtlDirective],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {}
