/**
 * domhandler.service
 */

import { Injectable } from '@angular/core';
import { animate, AnimationBuilder, sequence, style } from '@angular/animations';

@Injectable()
export class DomHandlerService {

    constructor( private animationBuilder: AnimationBuilder ) {
    }

    public relativePosition( element: any, target: any ): void {
        let elementDimensions = element.offsetParent ? {
            width: element.offsetWidth,
            height: element.offsetHeight
        } : this.getHiddenElementDimensions(element);
        let targetHeight = target.offsetHeight;
        let targetWidth = target.offsetWidth;
        let targetOffset = target.getBoundingClientRect();
        let viewport = this.getViewport();
        let top, left;

        if ((targetOffset.top + targetHeight + elementDimensions.height) > viewport.height) {
            top = -1 * (elementDimensions.height);
            if (targetOffset.top + top < 0) {
                top = 0;
            }
        }
        else {
            top = targetHeight;
        }


        if ((targetOffset.left + elementDimensions.width) > viewport.width)
            left = targetWidth - elementDimensions.width;
        else
            left = 0;

        element.style.top = top + 'px';
        element.style.left = left + 'px';
    }

    public getHiddenElementDimensions( element: any ): any {
        let dimensions: any = {};
        element.style.visibility = 'hidden';
        element.style.display = 'block';
        dimensions.width = element.offsetWidth;
        dimensions.height = element.offsetHeight;
        element.style.display = 'none';
        element.style.visibility = 'visible';

        return dimensions;
    }

    public getViewport(): any {
        let win = window,
            d = document,
            e = d.documentElement,
            g = d.getElementsByTagName('body')[0],
            w = win.innerWidth || e.clientWidth || g.clientWidth,
            h = win.innerHeight || e.clientHeight || g.clientHeight;

        return {width: w, height: h};
    }

    /**
     * Angular animation fadeIn
     * */
    public fadeIn( element: HTMLElement, duration: number ): any {
        const loaderAnimation = this.animationBuilder.build(sequence([
            style({opacity: 0}),
            animate(duration + 'ms ease', style({opacity: 1}))
        ]));
        const player = loaderAnimation.create(element, {});
        player.play();

        return player;
    }

    /**
     * Angular animation fadeOut
     * */
    public fadeOut(element: HTMLElement, duration: number): any {
        const loaderAnimation = this.animationBuilder.build(sequence([
            style({opacity: 1}),
            animate(duration + 'ms ease', style({opacity: 0}))
        ]));
        const player = loaderAnimation.create(element, {});
        player.play();

        return player;
    }

    public getWindowScrollLeft(): number {
        let doc = document.documentElement;
        return (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    }

    public getWindowScrollTop(): number {
        let doc = document.documentElement;
        return (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
    }
}
