/**
 * slider.component
 */

import {
    AfterViewInit, Component, ElementRef, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output, Renderer2,
    ViewChild
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomHandlerService } from '../../utils/domhandler.service';

export const SLIDER_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SliderComponent),
    multi: true
};

@Component({
    selector: 'owl-slider',
    templateUrl: './slider.component.html',
    styleUrls: ['./slider.component.scss'],
    providers: [SLIDER_VALUE_ACCESSOR],
})

export class SliderComponent implements OnInit, AfterViewInit, OnDestroy, ControlValueAccessor {

    @Input() public animate: boolean = true; // allow animate the slider handle when slider bar clicked
    @Input() public disabled: boolean; // set the slider disabled
    @Input() public min: number = 0; // the minimum value the slider could select
    @Input() public max: number = 100; // the maximum value the slicer could select
    @Input() public range: boolean = false; // allow two boundary values
    @Input() public step: number; // factor to increment/decrement the value.
    @Input() public sliderStyle: any = {}; // customize slider style
    @Input() public sliderBarStyle: any = {}; // customize slider bar style
    @Input() public sliderHandleStyle: any = {}; // customize slider handle style
    @Input() public vertical: boolean = false; // set slider as vertical
    @Output() public onChange = new EventEmitter<any>(); // emit whenever the value changed
    @Output() public onSlideEnd = new EventEmitter<any>(); // emit whenever a mouseUp or touchEnd
    @ViewChild('slider') public sliderElm: ElementRef;

    public isDragging: boolean = false; // a flag indicating whether the dragging process in on
    public value: number; // slider select value
    public values: number[] = []; // slider select range values([0] selected value, [1] selected value)
    public handleValue: number; // slider handle value
    public handleValues: number[] = []; // slider range handle values([0] low handle value, [1] high handle value)

    public onModelChange: Function = () => {
    };
    public onModelTouched: Function = () => {
    };

    private handleIndex: number; // hold the handle index which is being sliding
    private initX: number; // the initial slider page x value;
    private initY: number; // the initial slider page y value;
    private sliderWidth: number; // the width of the slider
    private sliderHeight: number; // the height of the slider
    private sliderHandleClicked: boolean; // a flag indicating whether is a slider handle click
    private startHandleValue: number; // the touchStart handle value;
    private startX: number; // the initial touch event x value;
    private startY: number; // the initial touch event y value;
    // Event Listeners
    private dragListener: any;
    private mouseUpListener: any;

    constructor( private renderer: Renderer2,
                 private domHandler: DomHandlerService ) {
    }

    public ngOnInit() {
        this.validateInputs();
    }

    public ngOnDestroy(): void {
        this.dragListener();
        this.mouseUpListener();
    }

    public ngAfterViewInit(): void {
        if (this.disabled) {
            return;
        }

        this.dragListener = this.renderer.listen('document', 'mousemove', ( event: any ) => {
            if (this.isDragging) {
                this.handleChange(event);
            }
        });

        this.mouseUpListener = this.renderer.listen('document', 'mouseup', ( event: any ) => {
            this.handleDragEnd(event);
        });
    }

    /**
     * Handle mouse down action
     * */
    public onMouseDown( event: any, index?: number ): void {
        if (this.disabled) {
            return;
        }

        event.preventDefault();
        this.isDragging = true;
        this.sliderHandleClicked = true;
        this.handleIndex = index;
        this.updateSliderData();
    }


    /**
     * Handle touch start action
     * */
    public onTouchStart( event: any, index?: number ): void {
        if (this.disabled) {
            return;
        }

        event.preventDefault();
        let touchObj = event.changedTouches[0];
        this.startHandleValue = this.range ? this.handleValues[index] : this.handleValue;
        this.isDragging = true;
        this.handleIndex = index;
        if (this.vertical) {
            this.startY = parseInt(touchObj.clientY, 10);
            this.sliderHeight = this.sliderElm.nativeElement.offsetHeight;
        } else {
            this.startX = parseInt(touchObj.clientX, 10);
            this.sliderWidth = this.sliderElm.nativeElement.offsetWidth;
        }
    }

    /**
     * Handle touch move action
     * */
    public onTouchMove( event: any, index?: number ): void {
        let touchObj = event.changedTouches[0];
        let handleValue;
        if (this.vertical) {
            handleValue = Math.floor(((this.startY - parseInt(touchObj.clientY, 10)) * 100) / (this.sliderHeight)) + this.startHandleValue;
            //handleValue = Math.floor((this.startY - (parseInt(touchObj.clientY, 10)) * 100) / (this.sliderHeight)) + this.startHandleValue;
        } else {
            handleValue = Math.floor(((parseInt(touchObj.clientX, 10) - this.startX) * 100) / (this.sliderWidth)) + this.startHandleValue;
        }
        this.setValueFromHandle(event, handleValue);
        event.preventDefault();
    }

    /**
     * Handle dragging process end
     * */
    public handleDragEnd( event: any ): void {
        if (this.isDragging) {
            this.isDragging = false;
            if (this.range) {
                this.onSlideEnd.emit({originalEvent: event, values: this.values});
            } else {
                this.onSlideEnd.emit({originalEvent: event, value: this.value});
            }
        }
    }

    /**
     * Handle bar click action
     * */
    public onBarClick( event: any ): void {

        if (this.disabled) {
            return;
        }

        if (!this.sliderHandleClicked) {
            this.updateSliderData();
            this.handleChange(event);
        }

        this.sliderHandleClicked = false;
    }

    public writeValue( obj: any ): void {
        if (this.range) {
            this.values = obj || [0, 0];
        } else {
            this.value = obj || 0;
        }
        this.updateHandleValue();
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
     * Dragging the slider handle
     * */
    private handleChange( event: any ): void {
        let handleValue = this.calculateHandleValue(event);
        this.setValueFromHandle(event, handleValue);
        return;
    }

    /**
     * Calculate the slider handle position value
     * */
    private calculateHandleValue( event: any ): number {
        if (this.vertical) {
            return Math.floor(((this.initY + this.sliderHeight) - event.pageY) * 100 / (this.sliderHeight));
        }
        return Math.floor(((event.pageX - this.initX) * 100) / (this.sliderWidth));
    }

    /**
     * Update slider basic data
     * */
    private updateSliderData(): void {
        let rect = this.sliderElm.nativeElement.getBoundingClientRect();
        this.initX = rect.left + this.domHandler.getWindowScrollLeft();
        this.initY = rect.top + this.domHandler.getWindowScrollTop();
        this.sliderWidth = this.sliderElm.nativeElement.offsetWidth;
        this.sliderHeight = this.sliderElm.nativeElement.offsetHeight;
        return;
    }

    /**
     * Set slider  handle value and selected value
     * */
    private setValueFromHandle( event: any, handleValue: number ): void {
        let newValue = this.getValueFromHandle(handleValue);

        if (this.range) {
            if (this.step) {
                this.handleStepChange(newValue, this.values[this.handleIndex], event);
            } else {
                this.handleValues[this.handleIndex] = handleValue; // set handle value
                this.updateValue(newValue, event); // set slider selected value
            }
        } else {
            if (this.step) {
                this.handleStepChange(newValue, this.value, event);
            } else {
                this.handleValue = handleValue; // set handle value
                this.updateValue(newValue, event); // set slider selected value
            }
        }
        this.setSliderBarStyles();
        return;
    }

    /**
     * Convert handle value to slider selected value
     * */
    private getValueFromHandle( handleValue: number ): number {
        return (this.max - this.min) * (handleValue / 100) + this.min;
    }

    /**
     * Update value based on the step factor
     * */
    private handleStepChange( newValue: number, oldValue: number, event: any ): void {
        let diff = newValue - oldValue;

        //diff < 0 (decreasing), diff > 0 (increasing)
        if (diff < 0 && (-1 * diff) >= this.step / 2) {
            newValue = oldValue - this.step;
            this.updateValue(newValue, event);
            this.updateHandleValue();
        } else if (diff > 0 && diff >= this.step / 2) {
            newValue = oldValue + this.step;
            this.updateValue(newValue, event);
            this.updateHandleValue();
        }
        return;
    }

    /**
     * Set slider selected value
     * */
    private updateValue( val: number, event?: any ): void {
        if (this.range) {
            let value = val;

            if (this.handleIndex == 0) {
                // prevent low value from being smaller than min or bigger than high value
                // prevent low handle's value from being small than 0 or bigger than high handle's value
                if (value < this.min) {
                    value = this.min;
                    this.handleValues[0] = 0;
                } else if (value > this.values[1]) {
                    value = this.values[1];
                    this.handleValues[0] = this.handleValues[1];
                }
            }
            else {
                // prevent high value from being bigger than max or smaller than low value
                // prevent high handle's value from being bigger than 100 or smaller than low handle's value
                if (value > this.max) {
                    value = this.max;
                    this.handleValues[1] = 100;
                } else if (value < this.values[0]) {
                    value = this.values[0];
                    this.handleValues[1] = this.handleValues[0];
                }
            }
            this.values[this.handleIndex] = Math.floor(value); // update the values
            this.onModelChange(this.values); // trigger modelChange event
            this.onChange.emit({event: event, values: this.values}); // emit onChange event
        } else {
            // prevent value from being smaller than min or bigger than max
            // prevent handle value from being smaller than 0 or bigger than 100
            if (val < this.min) {
                val = this.min;
                this.handleValue = 0;
            } else if (val > this.max) {
                val = this.max;
                this.handleValue = 100;
            }
            this.value = Math.floor(val); // update value
            this.onModelChange(this.value); // trigger modelChange event
            this.onChange.emit({event: event, value: this.value}); // emit onChange event
        }
    }

    /**
     * Set slider handle value
     * */
    private updateHandleValue(): void {
        if (this.range && this.values) {
            this.handleValues[0] = (this.values[0] < this.min ? 0 : this.values[0] - this.min) * 100 / (this.max - this.min);
            this.handleValues[1] = (this.values[1] > this.max ? this.max : this.values[1] - this.min) * 100 / (this.max - this.min);
        } else {
            if (this.value < this.min) {
                this.handleValue = 0;
            } else if (this.value > this.max) {
                this.handleValue = 100;
            } else {
                this.handleValue = (this.value - this.min) * 100 / (this.max - this.min);
            }
        }

        this.setSliderBarStyles();
        return;
    }

    /**
     * Set slider bar styles
     * */
    private setSliderBarStyles(): void {
        let obj;
        if (this.vertical) {
            if (this.range) {
                obj = {
                    bottom: this.handleValues[0] + '%',
                    height: (this.handleValues[1] - this.handleValues[0]) + '%'
                }
            } else {
                obj = {
                    height: this.handleValue + '%'
                }
            }
        } else {
            if (this.range) {
                obj = {
                    left: this.handleValues[0] + '%',
                    width: (this.handleValues[1] - this.handleValues[0]) + '%'
                };
            } else {
                obj = {
                    width: this.handleValue + '%'
                };
            }
        }
        this.sliderBarStyle = Object.assign({}, this.sliderBarStyle, obj);
        return;
    }

    /**
     * Validate slider input value
     * */
    private validateInputs = () => {
        let errorMessagePrefix = 'Slider component input validation error: ';
        if (this.max - this.min <= 0) {
            throw Error(errorMessagePrefix + " 'max' should be bigger than 'min'.");
        }
    };
}
