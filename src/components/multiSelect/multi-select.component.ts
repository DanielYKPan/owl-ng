/**
 * multi-select.component
 */

import {
    Component, ElementRef, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output, Renderer2,
    ViewChild, DoCheck, IterableDiffers, AfterViewInit
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectItem } from '../../models/select-item';
import { DomHandlerService } from '../../utils/domhandler.service';
import { ObjectUtilsService } from '../../utils/objectUtils.service';

export const MULTISELECT_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MultiSelectComponent),
    multi: true
};

@Component({
    selector: 'owl-multi-select',
    templateUrl: './multi-select.component.html',
    styleUrls: ['./multi-select.component.scss'],
    providers: [MULTISELECT_VALUE_ACCESSOR],
})

export class MultiSelectComponent implements DoCheck, OnInit, AfterViewInit, OnDestroy, ControlValueAccessor {

    @Input() public dataKey: string; // Specify a property to uniquely identify a value in options
    @Input() public defaultLabel: string = 'Choose'; // The default text of the button
    @Input() public disabled: boolean; // disable the element when it is true
    @Input() public displaySelectedLabel: boolean = true; // show labels of selected options or defaultLabel text
    @Input() public filter: boolean = true; // whether to show filter input
    @Input() public inputId: string; // Identifier of the focus input to match a label defined for the component.
    @Input() public scrollHeight: string = '200px'; // Define the max height of the panel item list
    @Input() public maxSelectedLabels: number = 3; // Decide how many labels to show at most
    @Input() public options: SelectItem[]; // an array of available options ({label: string, value: any}[])
    @Input() public panelVisible: boolean; // a flag determined if the panel is shown
    @Input() public selectedItemsLabel: string = '{0} items selected'; // label to display after exceeding the maxSelectedLabels
    @Input() public style: any; // inline style for the element
    @Input() public styleClass: string; // style class for the element
    @Input() public tabIndex: number; // index of the element in tabbing order
    @Output() public onBlur: EventEmitter<any> = new EventEmitter();
    @Output() public onChange: EventEmitter<any> = new EventEmitter();
    @ViewChild('container') public containerElm: ElementRef;
    @ViewChild('panel') public panelElm: ElementRef;

    public focus: boolean; // a flag determined if the element is being focus
    public onModelChange: Function = () => {
    };
    public onModelTouched: Function = () => {
    };

    public value: any[]; // holding all selected option's value
    public valueAsString: string; // holding the value text to show on the element
    private documentClickListener: any = null;
    private filterValue: string; // holding the filter input value
    private panelClick: boolean; // a flag determined if the click is on the panel
    private filteredOptions: SelectItem[]; // holding all available options after filtering
    private valueDiffer: any;
    private optionsDiffer: any;

    constructor( private renderer: Renderer2,
                 private differs: IterableDiffers,
                 private domHandler: DomHandlerService,
                 private objectUtils: ObjectUtilsService ) {
        this.valueDiffer = differs.find([]).create(null);
        this.optionsDiffer = differs.find([]).create(null);
    }

    public ngOnInit() {
        this.updateLabel();
    }

    public ngOnDestroy(): void {
        this.unBindDocumentClickAction();
    }

    public ngDoCheck(): void {
        let valueChanges = this.valueDiffer.diff(this.value);
        let optionChanges = this.optionsDiffer.diff(this.options);

        if (valueChanges || optionChanges) {
            this.updateLabel();
        }
    }

    public ngAfterViewInit(): void {
        if (this.panelVisible) {
            this.show();
        }
    }

    public writeValue( obj: any ): void {
        this.value = obj;
        this.updateLabel();
    }

    public registerOnChange( fn: any ): void {
        this.onModelChange = fn;
    }

    public registerOnTouched( fn: any ): void {
        this.onModelTouched = fn;
    }

    public setDisabledState( isDisabled: boolean ): void {
        this.disabled = isDisabled;
    }

    /**
     * Handle mouse click on multiSelect container
     * */
    public onMouseClick( event: any, inputBox: any ): void {
        event.preventDefault();

        if (this.disabled) {
            return;
        }

        if (!this.panelClick) {
            if (this.panelVisible) {
                this.hide();
            } else {
                this.show();
                inputBox.focus();
            }
        }
    }

    /**
     * Handle mouse click on multiSelect panel
     * */
    public onPanelMouseClick( event: any ): void {
        event.preventDefault();
        this.panelClick = true;
    }

    /**
     * Handle an option being clicked
     * */
    public onItemClick( event: any, value: any ): void {
        let selectionIndex = this.findSelectionIndex(value);
        if (selectionIndex != -1) {
            this.value = this.value.filter(( val: any, i: number ) => i != selectionIndex);
        } else {
            this.value = [...this.value || [], value];
        }
        this.onModelChange(this.value);
        this.onChange.emit({originalEvent: event, value: this.value});
    }

    /**
     * Handle the element onBlur action
     * */
    public onInputBlur( event: any ): void {
        this.focus = false;
        this.onBlur.emit({originalEvent: event});
        this.onModelTouched();
    }

    /**
     * Handle the element onFocus action
     * */
    public onInputFocus( event: any ): void {
        this.focus = true;
    }

    /**
     * Handle when filter input being used
     * */
    public onFilter( event: any ): void {
        this.filterValue = event.target.value.trim().toLowerCase();
        this.filteredOptions = [];
        if (this.filterValue) {
            for (let i = 0; i < this.options.length; i++) {
                let option = this.options[i];
                if (option.label.toLowerCase().indexOf(this.filterValue.toLowerCase()) > -1) {
                    this.filteredOptions.push(option);
                }
            }
        }
    }

    /**
     * Show multiSelect panel
     * */
    public show(): void {
        this.panelVisible = true;
        this.bindDocumentClickAction();
        this.domHandler.relativePosition(this.panelElm.nativeElement, this.containerElm.nativeElement);
        this.domHandler.fadeIn(this.panelElm.nativeElement, 300);
    }

    /**
     * Hide multiSelect panel
     * */
    public hide(): void {
        let player = this.domHandler.fadeOut(this.panelElm.nativeElement, 300);
        player.onDone(() => {
            this.panelVisible = false;
            this.panelClick = false;
            this.unBindDocumentClickAction();
        });
    }

    /**
     * Toggle all selected values
     * */
    public toggleAll( event: any, checkbox: any ): void {
        if (checkbox.checked) {
            this.value = [];
        } else {
            let opts = this.filteredOptions || this.options;
            if (opts) {
                this.value = [];
                opts.map(( opt: SelectItem, index: number ) => {
                    this.value.push(opt.value);
                });
            }
        }
        checkbox.checked = !checkbox.checked;
        this.onModelChange(this.value);
        this.onChange.emit({originalEvent: event, value: this.value});
    }

    /**
     * Check if the obj in this.value array
     * */
    public isSelected( obj: any ): boolean {
        return this.findSelectionIndex(obj) != -1;
    }

    /**
     * Check if all the options( or all visible options) are selected
     * */
    public isAllChecked(): boolean {
        if (this.filterValue && this.filterValue.trim().length) {
            return this.value && this.filteredOptions && this.filteredOptions.length
                && (this.value.length === this.filteredOptions.length);
        } else {
            return this.value && this.options && (this.value.length === this.options.length);
        }
    }

    /**
     * Check if the option should be shown on the panel list
     * */
    public isItemVisible( option: SelectItem ): boolean {
        if (this.filterValue && this.filterValue.trim().length) {
            for (let i = 0; i < this.filteredOptions.length; i++) {
                if (this.filteredOptions[i].value == option.value) {
                    return true;
                }
            }
        } else {
            return true;
        }
    }

    /**
     * Update
     * */
    public updateLabel(): void {
        if (this.options && this.value && this.value.length && this.displaySelectedLabel) {
            let label = '';
            for (let i = 0; i < this.value.length; i++) {
                if (i !== 0) {
                    label = label + ', ';
                }
                label = label + this.findLabelByValue(this.value[i]);
            }
            if (this.value.length <= this.maxSelectedLabels) {
                this.valueAsString = label;
            } else {
                let pattern = /{(.*?)}/;
                let matchPattern = this.selectedItemsLabel.match(pattern);
                if (matchPattern) {
                    this.valueAsString = this.selectedItemsLabel.replace(this.selectedItemsLabel.match(pattern)[0], this.value.length + '');
                } else {
                    this.valueAsString = this.selectedItemsLabel;
                }
            }
        } else {
            this.valueAsString = this.defaultLabel;
        }
    }

    /**
     * Bind mouse click on document
     * */
    private bindDocumentClickAction() {
        if (!this.documentClickListener) {
            let couldHide = false;
            this.documentClickListener = this.renderer.listen('document', 'click', ( event: any ) => {
                if (couldHide && !this.panelClick && this.panelVisible) {
                    this.hide();
                }

                couldHide = true;
                this.panelClick = false;
            });
        }
    }

    /**
     * Unbind mouse click on document
     * */
    private unBindDocumentClickAction() {
        if (this.documentClickListener) {
            this.documentClickListener();
            this.documentClickListener = null;
        }
    }

    private findSelectionIndex( val: any ): number {
        let index = -1;

        if (this.value) {
            for (let i = 0; i < this.value.length; i++) {
                if (this.objectUtils.equals(this.value[i], val, this.dataKey)) {
                    index = i;
                    break;
                }
            }
        }

        return index;
    }

    private findLabelByValue( val: any ): string {
        let label = null;

        for (let option of this.options) {
            if (val == null && option.value == null || this.objectUtils.equals(val, option.value, this.dataKey)) {
                label = option.label;
                break;
            }
        }

        return label;
    }
}
