/**
 * slider.module
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SliderComponent } from './slider.component';
import { DomHandlerService } from '../../utils/domhandler.service';

@NgModule({
    imports: [CommonModule, FormsModule],
    exports: [SliderComponent],
    declarations: [SliderComponent],
    providers: [DomHandlerService],
})
export class SliderModule {
}

