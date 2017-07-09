/**
 * back-top.module
 */

import { NgModule }      from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackTopBtnComponent } from './back-top.component';

@NgModule({
    imports: [CommonModule],
    declarations: [BackTopBtnComponent],
    exports: [BackTopBtnComponent],
})
export class BackTopBtnModule {
}
