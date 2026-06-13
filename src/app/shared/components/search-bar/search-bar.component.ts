import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AutoDirectionDirective } from '../../directives/auto-direction.directive';

@Component({
  selector: 'app-search-bar',
  imports: [ReactiveFormsModule, AutoDirectionDirective],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css'
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'Search modern furniture...';
  @Input() debounceTime = 400;

  @Output() search = new EventEmitter<string>();

  searchControl = new FormControl('');
  private sub!: Subscription;

  ngOnInit(): void {
    this.sub = this.searchControl.valueChanges.pipe(
      debounceTime(this.debounceTime),
      distinctUntilChanged()
    ).subscribe((value) => {
      this.search.emit(value || '');
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }
}
