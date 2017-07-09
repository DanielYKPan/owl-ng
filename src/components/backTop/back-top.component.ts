/**
 * back-top.component
 */

import {
    ChangeDetectionStrategy, Component, EventEmitter,
    HostListener, Input, OnDestroy, OnInit, Output
} from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'owl-back-top',
    styles: [`
        .owl-back-top {
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0.4;
            cursor: pointer;
            outline: none;
        }

        .owl-back-top:hover, .owl-back-top:focus {
            opacity: 0.8;
        }
    `],
    template: `
        <div class="owl-back-top" [@iconState]="icon" [ngStyle]="getStyle()">
            <div *ngIf="html; else elseBlock" [innerHTML]="html"></div>
            <ng-template #elseBlock>
                <svg version="1.1" id="Arrow_Up" 
                 xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                 width="50%" height="50%" viewBox="0 0 451.847 451.846" 
                 style="enable-background:new 0 0 451.847 451.846;"xml:space="preserve">
                <g>
                    <path d="M433.968,278.657L248.387,92.79c-7.419-7.044-16.08-10.566-25.977-10.566c-10.088,0-18.652,3.521-25.697,10.566
                        L10.848,278.657C3.615,285.887,0,294.549,0,304.637c0,10.28,3.619,18.843,10.848,25.693l21.411,21.413
                        c6.854,7.23,15.42,10.852,25.697,10.852c10.278,0,18.842-3.621,25.697-10.852L222.41,213.271L361.168,351.74
                        c6.848,7.228,15.413,10.852,25.7,10.852c10.082,0,18.747-3.624,25.975-10.852l21.409-21.412
                        c7.043-7.043,10.567-15.608,10.567-25.693C444.819,294.545,441.205,285.884,433.968,278.657z"/>
                </g>
                </svg>
            </ng-template>
        </div>
    `,
    animations: [
        trigger('iconState', [
            state('show', style({
                visibility: 'visible',
                opacity: '*'
            })),
            state('hide', style({
                visibility: 'hidden',
                opacity: 0
            })),
            transition('show <=> hide', animate('400ms ease-in-out'))
        ])
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackTopBtnComponent implements OnInit, OnDestroy {

    /**
     * Acceleration coefficient, added to speed when using animated scroll
     * @default {0}
     * @type {number}
     * */
    @Input() public acceleration = 0;

    /**
     * If true scrolling to top will be animated
     * @default {true}
     * @type {boolean}
     * */
    @Input() public animate = true;

    /**
     * Button inner html
     * @default {''}
     * @type {string}
     * */
    @Input() public html = '';

    /**
     * Back-To-Top button will appear when user scrolls Y to this position
     * @default {200}
     * @type {number}
     * */
    @Input() public scrollDistance = 200;

    /**
     * Animated scrolling speed
     * @default {80}
     * @type {number}
     */
    @Input() public speed = 80;


    /**
     * User styles config object
     * @type {{}}
     */
    @Input() public styles = {};

    /**
     * EventEmitter when scrolling to the top
     * */
    @Output() public onReachTop = new EventEmitter<boolean>();

    /**
     * Animation IconState
     * @default {'hide'}
     * @type {'show' | 'hide'}
     * */
    public icon: 'show' | 'hide' = 'hide';

    /**
     * Internal timer id
     * */
    private timerId: any;

    /**
     * A flag to indicate if it is on scrolling process
     * @default {false}
     * @type {boolean}
     * */
    private onScrolling = false;

    /**
     * Default button styles
     * */
    private defaultStyles: any = {
        'position': 'fixed',
        'right': '40px',
        'bottom': '40px',
        'width': '52px',
        'height': '52px',
        'z-index': '9999',
        'border-radius': '50%',
        'background': 'rgba(0,0,0,0.75)',
        'color': '#00abff',
        'fill': '#00abff',
    };

    constructor() {
    }

    public ngOnInit() {
        this.onScrolling = false;
        this.validateInputs();
        this.checkScrollDistance();
    }

    public ngOnDestroy(): void {
        this.clearTimerId();
    }

    /**
     * Listens to element click
     */
    @HostListener('click')
    public onClick(): boolean {
        if (this.onScrolling) {
            return false;
        }
        if (this.animate) {
            this.animateScrollTop();
        } else {
            window.scrollTo(0, 0);
            this.onReachTop.emit(true);
        }
        return false;
    }

    /**
     * Listens to window scroll and animates the button
     */
    @HostListener('window:scroll', [])
    public onWindowScroll(): void {
        if (this.scrollDistance === 0) {
            return;
        }
        this.icon = window.scrollY > this.scrollDistance ? 'show' : 'hide';
    }

    /**
     * Get button style
     * @returns {{}&U&V}
     */
    public getStyle(): any {
        return Object.assign({}, this.defaultStyles, this.styles);
    }

    /**
     * Performs the animated scroll to top
     */
    private animateScrollTop(): void {
        this.clearTimerId();
        let initialSpeed = this.speed;
        this.onScrolling = true;
        this.timerId = setInterval(() => {
            window.scrollBy(0, -initialSpeed);
            initialSpeed = initialSpeed + this.acceleration;
            if (this.getCurrentScrollTop() === 0) {
                this.onScrolling = false;
                this.clearTimerId();
                this.onReachTop.emit(true);
            }
        }, 15);
    }

    /**
     * Get current Y scroll position
     * @returns {number}
     */
    private getCurrentScrollTop(): number {
        if (typeof window.scrollY !== 'undefined') {
            return window.scrollY;
        }

        if (typeof window.pageYOffset !== 'undefined') {
            return window.pageYOffset;
        }

        if (typeof document.body.scrollTop !== 'undefined') {
            return document.body.scrollTop;
        }

        if (typeof document.documentElement.scrollTop !== 'undefined') {
            return document.documentElement.scrollTop;
        }

        return 0;
    };

    /**
     * Clear the internal timer id
     * */
    private clearTimerId(): void {
        if (this.timerId) {
            clearInterval(this.timerId);
        }
    }

    /**
     * Validate the component input value
     * */
    private validateInputs(): void {
        const errorMessagePrefix = 'BackToTopButton component input validation error: ';

        if (this.scrollDistance < 0) {
            throw Error(errorMessagePrefix + '\'scrollDistance\' parameter must be greater or equal to 0');
        }

        if (this.speed < 1) {
            throw Error(errorMessagePrefix + '\'speed\' parameter must be a positive number');
        }

        if (this.acceleration < 0) {
            throw Error(errorMessagePrefix + '\'acceleration\' parameter must be greater or equal to 0');
        }
    };

    /**
     * Check scroll distance
     * if scrollDistance set to 0, the backToTop btn would always show in the page
     * */
    private checkScrollDistance(): void {
        if (this.scrollDistance === 0) {
            this.icon = 'show';
        }

        return;
    }
}
