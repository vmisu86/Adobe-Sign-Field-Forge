import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideTestApp } from './testing/test-providers';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: provideTestApp(),
    }).compileComponents();
  });

  it('is titled FieldForge for Adobe Sign', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.title).toBe('FieldForge for Adobe Sign');
  });

  it('renders the editor', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-pdf-viewer')).not.toBeNull();
  });
});
