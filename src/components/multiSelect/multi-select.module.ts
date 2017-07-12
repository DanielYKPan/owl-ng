/**
 * multi-select.module
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultiSelectComponent } from './multi-select.component';
import { DomHandlerService } from '../../utils/domhandler.service';
import { ObjectUtilsService } from '../../utils/objectUtils.service';

@NgModule({
    imports: [
        CommonModule,
        FormsModule
    ],
    exports: [MultiSelectComponent],
    declarations: [MultiSelectComponent],
    providers: [DomHandlerService, ObjectUtilsService],
})
export class MultiSelectModule {
}

