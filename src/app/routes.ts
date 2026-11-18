import { Routes } from '@angular/router';
import { DatePage } from './pages/date/date.page';

export const routes: Routes = [
  { path: '', component: DatePage, title: 'Ieși cu mine?' },
  { path: '**', redirectTo: '' },
];
