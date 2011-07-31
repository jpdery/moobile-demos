/**
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * iScroll Lite Edition based on iScroll v4.0 Beta 4
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * Copyright (c) 2010 Matteo Spinelli, http://cubiq.org/
 * Released under MIT license
 * http://cubiq.org/dropbox/mit-license.txt
 * 
 * Last updated: 2011.03.10
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 */

;(function(){
function iScroll (el, options) {
	var that = this, doc = document, i;

	that.wrapper = typeof el == 'object' ? el : doc.getElementById(el);
	that.wrapper.style.overflow = 'hidden';
	that.scroller = that.wrapper.children[0];
	that.scroller.style.cssText += '-webkit-transition-property:-webkit-transform;-webkit-transform-origin:0 0;-webkit-transform:' + trnOpen + '0,0' + trnClose;
	that.scroller.style.cssText += '-webkit-transition-timing-function:cubic-bezier(0.33,0.66,0.66,1);-webkit-transition-duration:0;';

	// Default options
	that.options = {
		hScroll: true,
		vScroll: true,
		bounce: has3d,
		bounceLock: false,
		momentum: has3d,
		lockDirection: true,
		hScrollbar: true,
		vScrollbar: true,
		fixedScrollbar: isAndroid,
		fadeScrollbar: (isIDevice && has3d) || !hasTouch,
		hideScrollbar: isIDevice || !hasTouch,
		scrollbarClass: '',
		onScrollStart: null,
		onScrollEnd: null,
	};

	// User defined options
	for (i in options) {
		that.options[i] = options[i];
	}

	that.options.hScrollbar = that.options.hScroll && that.options.hScrollbar;
	that.options.vScrollbar = that.options.vScroll && that.options.vScrollbar;
	
	that.refresh();

	that._bind(RESIZE_EV, window);
	that._bind(START_EV);
/*	that._bind(MOVE_EV);
	that._bind(END_EV);
	that._bind(CANCEL_EV);*/
}

iScroll.prototype = {
	x: 0, y: 0,
	
	handleEvent: function (e) {
		var that = this;
		
		switch(e.type) {
			case START_EV: that._start(e); break;
			case MOVE_EV: that._move(e); break;
			case END_EV:
			case CANCEL_EV: that._end(e); break;
			case 'webkitTransitionEnd': that._transitionEnd(e); break;
			case RESIZE_EV: that._resize(); break;
		}
	},
	
	_scrollbar: function (dir) {
		var that = this,
			doc = document,
			bar;

		if (!that[dir + 'Scrollbar']) {
			if (that[dir + 'ScrollbarWrapper']) {
				that[dir + 'ScrollbarIndicator'].style.webkitTransform = '';	// Should free some mem
				that[dir + 'ScrollbarWrapper'].parentNode.removeChild(that[dir + 'ScrollbarWrapper']);
				that[dir + 'ScrollbarWrapper'] = null;
				that[dir + 'ScrollbarIndicator'] = null;
			}

			return;
		}

		if (!that[dir + 'ScrollbarWrapper']) {
			// Create the scrollbar wrapper
			bar = doc.createElement('div');
			if (that.options.scrollbarClass) {
				bar.className = that.options.scrollbarClass + dir.toUpperCase();
			} else {
				bar.style.cssText = 'position:absolute;z-index:100;' + (dir == 'h' ? 'height:7px;bottom:1px;left:2px;right:7px' : 'width:7px;bottom:7px;top:2px;right:1px');
			}
			bar.style.cssText += 'pointer-events:none;-webkit-transition-property:opacity;-webkit-transition-duration:' + (that.options.fadeScrollbar ? '350ms' : '0') + ';overflow:hidden;opacity:' + (that.options.hideScrollbar ? '0' : '1');

			that.wrapper.appendChild(bar);
			that[dir + 'ScrollbarWrapper'] = bar;

			// Create the scrollbar indicator
			bar = doc.createElement('div');
			if (!that.options.scrollbarClass) {
				bar.style.cssText = 'position:absolute;z-index:100;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);-webkit-background-clip:padding-box;-webkit-box-sizing:border-box;' + (dir == 'h' ? 'height:100%;-webkit-border-radius:4px 3px;' : 'width:100%;-webkit-border-radius:3px 4px;');
			}
			bar.style.cssText += 'pointer-events:none;-webkit-transition-property:-webkit-transform;-webkit-transition-timing-function:cubic-bezier(0.33,0.66,0.66,1);-webkit-transition-duration:0;-webkit-transform:' + trnOpen + '0,0' + trnClose;

			that[dir + 'ScrollbarWrapper'].appendChild(bar);
			that[dir + 'ScrollbarIndicator'] = bar;
		}

		if (dir == 'h') {
			that.hScrollbarSize = that.hScrollbarWrapper.clientWidth;
			that.hScrollbarIndicatorSize = m.max(m.round(that.hScrollbarSize * that.hScrollbarSize / that.scrollerW), 8);
			that.hScrollbarIndicator.style.width = that.hScrollbarIndicatorSize + 'px';
			that.hScrollbarMaxScroll = that.hScrollbarSize - that.hScrollbarIndicatorSize;
			that.hScrollbarProp = that.hScrollbarMaxScroll / that.maxScrollX;
		} else {
			that.vScrollbarSize = that.vScrollbarWrapper.clientHeight;
			that.vScrollbarIndicatorSize = m.max(m.round(that.vScrollbarSize * that.vScrollbarSize / that.scrollerH), 8);
			that.vScrollbarIndicator.style.height = that.vScrollbarIndicatorSize + 'px';
			that.vScrollbarMaxScroll = that.vScrollbarSize - that.vScrollbarIndicatorSize;
			that.vScrollbarProp = that.vScrollbarMaxScroll / that.maxScrollY;
		}

		// Reset position
		that._indicatorPos(dir, true);
	},
	
	_resize: function () {
		var that = this;

		//if (that.options.momentum) that._unbind('webkitTransitionEnd');

		setTimeout(function () {
			that.refresh();
		}, 0);
	},
	
	_pos: function (x, y) {
		var that = this;

		that.x = that.hScroll ? x : 0;
		that.y = that.vScroll ? y : 0;

		that.scroller.style.webkitTransform = trnOpen + that.x + 'px,' + that.y + 'px' + trnClose;

		that._indicatorPos('h');
		that._indicatorPos('v');
	},
	
	_indicatorPos: function (dir, hidden) {
		var that = this,
			pos = dir == 'h' ? that.x : that.y;
		
		if (!that[dir + 'Scrollbar']) return;
		
		pos = that[dir + 'ScrollbarProp'] * pos;
	
		if (pos < 0) {
			pos = that.options.fixedScrollbar ? 0 : pos + pos*3;
			if (that[dir + 'ScrollbarIndicatorSize'] + pos < 9) pos = -that[dir + 'ScrollbarIndicatorSize'] + 8;
		} else if (pos > that[dir + 'ScrollbarMaxScroll']) {
			pos = that.options.fixedScrollbar ? that[dir + 'ScrollbarMaxScroll'] : pos + (pos - that[dir + 'ScrollbarMaxScroll'])*3;
			if (that[dir + 'ScrollbarIndicatorSize'] + that[dir + 'ScrollbarMaxScroll'] - pos < 9) pos = that[dir + 'ScrollbarIndicatorSize'] + that[dir + 'ScrollbarMaxScroll'] - 8;
		}
		that[dir + 'ScrollbarWrapper'].style.webkitTransitionDelay = '0';
		that[dir + 'ScrollbarWrapper'].style.opacity = hidden && that.options.hideScrollbar ? '0' : '1';
		that[dir + 'ScrollbarIndicator'].style.webkitTransform = trnOpen + (dir == 'h' ? pos + 'px,0' : '0,' + pos + 'px') + trnClose;
	},
	
	_transitionTime: function (time) {
		var that = this;
		
		time += 'ms';
		that.scroller.style.webkitTransitionDuration = time;

		if (that.hScrollbar) that.hScrollbarIndicator.style.webkitTransitionDuration = time;
		if (that.vScrollbar) that.vScrollbarIndicator.style.webkitTransitionDuration = time;
	},
	
	_start: function (e) {
		var that = this,
			point = hasTouch ? e.changedTouches[0] : e,
			matrix;

		that.moved = false;

		e.preventDefault();

		that.moved = false;
		that.distX = 0;
		that.distY = 0;
		that.absDistX = 0;
		that.absDistY = 0;
		that.dirX = 0;
		that.dirY = 0;
		that.returnTime = 0;
		
		that._transitionTime(0);
		
		if (that.options.momentum) {
			matrix = new WebKitCSSMatrix(window.getComputedStyle(that.scroller, null).webkitTransform);
			if (matrix.m41 != that.x || matrix.m42 != that.y) {
				that._unbind('webkitTransitionEnd');
				that._pos(matrix.m41, matrix.m42);
			}
		}

		that.scroller.style.webkitTransitionTimingFunction = 'cubic-bezier(0.33,0.66,0.66,1)';
		if (that.hScrollbar) that.hScrollbarIndicator.style.webkitTransitionTimingFunction = 'cubic-bezier(0.33,0.66,0.66,1)';
		if (that.vScrollbar) that.vScrollbarIndicator.style.webkitTransitionTimingFunction = 'cubic-bezier(0.33,0.66,0.66,1)';
		that.startX = that.x;
		that.startY = that.y;
		that.pointX = point.pageX;
		that.pointY = point.pageY;
		
		that.startTime = e.timeStamp;

		if (that.options.onScrollStart) that.options.onScrollStart.call(that);

		// Registering/unregistering of events is done to preserve resources on Android
//		setTimeout(function () {
//			that._unbind(START_EV);
			that._bind(MOVE_EV);
			that._bind(END_EV);
			that._bind(CANCEL_EV);
//		}, 0);
	},
	
	_move: function (e) {
		if (hasTouch && e.touches.length > 1) return;

		var that = this,
			point = hasTouch ? e.changedTouches[0] : e,
			deltaX = point.pageX - that.pointX,
			deltaY = point.pageY - that.pointY,
			newX = that.x + deltaX,
			newY = that.y + deltaY;

		e.preventDefault();

		that.pointX = point.pageX;
		that.pointY = point.pageY;

		// Slow down if outside of the boundaries
		if (newX > 0 || newX < that.maxScrollX) {
			newX = that.options.bounce ? that.x + (deltaX / 2.4) : newX >= 0 || that.maxScrollX >= 0 ? 0 : that.maxScrollX;
		}
		if (newY > 0 || newY < that.maxScrollY) { 
			newY = that.options.bounce ? that.y + (deltaY / 2.4) : newY >= 0 || that.maxScrollY >= 0 ? 0 : that.maxScrollY;
		}

		if (that.absDistX < 4 && that.absDistY < 4) {
			that.distX += deltaX;
			that.distY += deltaY;
			that.absDistX = m.abs(that.distX);
			that.absDistY = m.abs(that.distY);
			return;
		}
		
		// Lock direction
		if (that.options.lockDirection) {
			if (that.absDistX > that.absDistY+3) {
				newY = that.y;
				deltaY = 0;
			} else if (that.absDistY > that.absDistX+3) {
				newX = that.x;
				deltaX = 0;
			}
		}
		
		that.moved = true;
		that._pos(newX, newY);
		that.dirX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
		that.dirY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

		if (e.timeStamp - that.startTime > 300) {
			that.startTime = e.timeStamp;
			that.startX = that.x;
			that.startY = that.y;
		}
	},
	
	_end: function (e) {
		if (hasTouch && e.touches.length != 0) return;

		var that = this,
			point = hasTouch ? e.changedTouches[0] : e,
			target, ev,
			momentumX = { dist:0, time:0 },
			momentumY = { dist:0, time:0 },
			duration = e.timeStamp - that.startTime,
			newPosX = that.x, newPosY = that.y,
			newDuration;

//		that._bind(START_EV);
		that._unbind(MOVE_EV);
		that._unbind(END_EV);
		that._unbind(CANCEL_EV);

		if (!that.moved) {
			if (hasTouch) {
				that.doubleTapTimer = null;

				// Find the last touched element
				target = point.target;
				while (target.nodeType != 1) {
					target = target.parentNode;
				}

				ev = document.createEvent('MouseEvents');
				ev.initMouseEvent('click', true, true, e.view, 1,
					point.screenX, point.screenY, point.clientX, point.clientY,
					e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
					0, null);
				ev._fake = true;
				target.dispatchEvent(ev);
			}

			that._resetPos();
			return;
		}

		if (duration < 300 && that.options.momentum) {
			momentumX = newPosX ? that._momentum(newPosX - that.startX, duration, -that.x, that.scrollerW - that.wrapperW + that.x, that.options.bounce ? that.wrapperW : 0) : momentumX;
			momentumY = newPosY ? that._momentum(newPosY - that.startY, duration, -that.y, (that.maxScrollY < 0 ? that.scrollerH - that.wrapperH + that.y : 0), that.options.bounce ? that.wrapperH : 0) : momentumY;

			newPosX = that.x + momentumX.dist;
			newPosY = that.y + momentumY.dist;

 			if ((that.x > 0 && newPosX > 0) || (that.x < that.maxScrollX && newPosX < that.maxScrollX)) momentumX = { dist:0, time:0 };
 			if ((that.y > 0 && newPosY > 0) || (that.y < that.maxScrollY && newPosY < that.maxScrollY)) momentumY = { dist:0, time:0 };
		}

		if (momentumX.dist || momentumY.dist) {
			newDuration = m.max(m.max(momentumX.time, momentumY.time), 10);

/*			if (newPosX > 0 || newPosX < that.maxScrollX || newPosY > 0 || newPosY < that.maxScrollY) {
				// Subtle change of scroller motion
				that.scroller.style.webkitTransitionTimingFunction = 'cubic-bezier(0.33,0.66,0.5,1)';
				if (that.hScrollbar) that.hScrollbarIndicator.style.webkitTransitionTimingFunction = 'cubic-bezier(0.33,0.66,0.5,1)';
				if (that.vScrollbar) that.vScrollbarIndicator.style.webkitTransitionTimingFunction = 'cubic-bezier(0.33,0.66,0.5,1)';
			}*/

			that.scrollTo(newPosX, newPosY, newDuration);
			return;
		}

		that._resetPos(200);
	},
	
	_resetPos: function (time) {
		var that = this,
			resetX = that.x,
			resetY = that.y;

		if (that.x >= 0) resetX = 0;
		else if (that.x < that.maxScrollX) resetX = that.maxScrollX;

		if (that.y >= 0 || that.maxScrollY > 0) resetY = 0;
		else if (that.y < that.maxScrollY) resetY = that.maxScrollY;

		if (resetX == that.x && resetY == that.y) {
			if (that.moved) {
				if (that.options.onScrollEnd) that.options.onScrollEnd.call(that);		// Execute custom code on scroll end
				that.moved = false;
			}

			if (that.hScrollbar && that.options.hideScrollbar) {
				that.hScrollbarWrapper.style.webkitTransitionDelay = '300ms';
				that.hScrollbarWrapper.style.opacity = '0';
			}
			if (that.vScrollbar && that.options.hideScrollbar) {
				that.vScrollbarWrapper.style.webkitTransitionDelay = '300ms';
				that.vScrollbarWrapper.style.opacity = '0';
			}

			return;
		}

		// Invert ease
		if (time) {
			that.scroller.style.webkitTransitionTimingFunction = 'cubic-bezier(0.33,0.0,0.33,1)';
			if (that.hScrollbar) that.hScrollbarIndicator.style.webkitTransitionTimingFunction = 'cubic-bezier(0.33,0.0,0.33,1)';
			if (that.vScrollbar) that.vScrollbarIndicator.style.webkitTransitionTimingFunction = 'cubic-bezier(0.33,0.0,0.33,1)';
		}

		that.scrollTo(resetX, resetY, time || 0);
	},

	_transitionEnd: function (e) {
		var that = this;
		
		if (e) e.stopPropagation();

		that._unbind('webkitTransitionEnd');

		that._resetPos(that.returnTime);
		that.returnTime = 0;
	},


	/**
	 *
	 * Utilities
	 *
	 */
	_momentum: function (dist, time, maxDistUpper, maxDistLower, size) {
		var that = this,
			deceleration = 0.0006,
			speed = m.abs(dist) / time,
			newDist = (speed * speed) / (2 * deceleration),
			newTime = 0, outsideDist = 0;

		// Proportinally reduce speed if we are outside of the boundaries 
		if (dist > 0 && newDist > maxDistUpper) {
			outsideDist = size / (6 / (newDist / speed * deceleration));
			maxDistUpper = maxDistUpper + outsideDist;
			that.returnTime = 800 / size * outsideDist + 100;
			speed = speed * maxDistUpper / newDist;
			newDist = maxDistUpper;
		} else if (dist < 0 && newDist > maxDistLower) {
			outsideDist = size / (6 / (newDist / speed * deceleration));
			maxDistLower = maxDistLower + outsideDist;
			that.returnTime = 800 / size * outsideDist + 100;
			speed = speed * maxDistLower / newDist;
			newDist = maxDistLower;
		}

		newDist = newDist * (dist < 0 ? -1 : 1);
		newTime = speed / deceleration;

		return { dist: newDist, time: m.round(newTime) };
	},

	_offset: function (el, tree) {
		var left = -el.offsetLeft,
			top = -el.offsetTop;
			
		if (!tree) return { x: left, y: top };

		while (el = el.offsetParent) {
			left -= el.offsetLeft;
			top -= el.offsetTop;
		} 

		return { x: left, y: top };
	},

	_bind: function (type, el) {
		(el || this.scroller).addEventListener(type, this, false);
	},

	_unbind: function (type, el) {
		(el || this.scroller).removeEventListener(type, this, false);
	},


	/**
	 *
	 * Public methods
	 *
	 */
	destroy: function () {
		var that = this;

		// Remove the scrollbars
		that.hScrollbar = false;
		that.vScrollbar = false;
		that._scrollbar('h');
		that._scrollbar('v');

		// Free some mem
		that.scroller.style.webkitTransform = '';

		// Remove the event listeners
		that._unbind('webkitTransitionEnd');
		that._unbind(RESIZE_EV);
		that._unbind(START_EV);
		that._unbind(MOVE_EV);
		that._unbind(END_EV);
		that._unbind(CANCEL_EV);
	},

	refresh: function () {
		var that = this;

		that.wrapperW = that.wrapper.clientWidth;
		that.wrapperH = that.wrapper.clientHeight;
		that.scrollerW = that.scroller.offsetWidth;
		that.scrollerH = that.scroller.offsetHeight;
		that.maxScrollX = that.wrapperW - that.scrollerW;
		that.maxScrollY = that.wrapperH - that.scrollerH;
		that.dirX = 0;
		that.dirY = 0;

		that._transitionTime(0);

		that.hScroll = that.options.hScroll && that.maxScrollX < 0;
		that.vScroll = that.options.vScroll && (!that.options.bounceLock && !that.hScroll || that.scrollerH > that.wrapperH);
		that.hScrollbar = that.hScroll && that.options.hScrollbar;
		that.vScrollbar = that.vScroll && that.options.vScrollbar && that.scrollerH > that.wrapperH;

		// Prepare the scrollbars
		that._scrollbar('h');
		that._scrollbar('v');
	
		that._resetPos();
	},

	scrollTo: function (x, y, time, relative) {
		var that = this;

		if (relative) {
			x = that.x - x;
			y = that.y - y;
		}

		time = !time || (m.round(that.x) == m.round(x) && m.round(that.y) == m.round(y)) ? 0 : time;

		that.moved = true;

		if (time) that._bind('webkitTransitionEnd');
		that._transitionTime(time);
		that._pos(x, y);
		if (!time) setTimeout(function () { that._transitionEnd(); }, 0);
	},

	scrollToElement: function (el, time) {
		var that = this, pos;
		el = el.nodeType ? el : that.scroller.querySelector(el);
		if (!el) return;

		pos = that._offset(el);
		pos.x = pos.x > 0 ? 0 : pos.x < that.maxScrollX ? that.maxScrollX : pos.x;
		pos.y = pos.y > 0 ? 0 : pos.y < that.maxScrollY ? that.maxScrollY : pos.y;
		time = time === undefined ? m.max(m.abs(pos.x)*2, m.abs(pos.y)*2) : time;

		that.scrollTo(pos.x, pos.y, time);
	}
};


var has3d = 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix(),
	hasTouch = 'ontouchstart' in window,
	isIDevice = (/iphone|ipad/gi).test(navigator.appVersion),
	isAndroid = (/android/gi).test(navigator.appVersion),
	RESIZE_EV = 'onorientationchange' in window ? 'orientationchange' : 'resize',
	START_EV = hasTouch ? 'touchstart' : 'mousedown',
	MOVE_EV = hasTouch ? 'touchmove' : 'mousemove',
	END_EV = hasTouch ? 'touchend' : 'mouseup',
	CANCEL_EV = hasTouch ? 'touchcancel' : 'mouseup',
	trnOpen = 'translate' + (has3d ? '3d(' : '('),
	trnClose = has3d ? ',0)' : ')',
	m = Math;

if (typeof exports !== 'undefined') exports.iScroll = iScroll;
else window.iScroll = iScroll;

})();

/*
---

name: Browser.Platform

description: Provides extra indication about the current platform.

license: MIT-style license.

author:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Browser

provides:
	- Browser.Platform

...
*/

Browser.Platform.phonegap =
	window.device &&
	window.device.phonegap;

/*
---

name: Class.Instanciate

description: Provides a method to instanciate classes based on the class name
             stored as a string.

license: MIT-style license.

requires:
	- Core/Class

provides:
	- Class.Instanciate

...
*/

Class.extend({
	
	parse: function(name) {
		name = name.trim();
		name = name.split('.');
		var func = window;
		for (var i = 0; i < name.length; i++) func = func[name[i]];
		return typeof func == 'function' ? func : null;
	},
	
	instanciate: function(klass) {
		if (typeof klass == 'string') klass = Class.parse(klass);
		klass.$prototyping = true;
		var instance = new klass;
		delete klass.$prototyping;
		var params = Array.prototype.slice.call(arguments, 1);
		if (instance.initialize) {
			instance.initialize.apply(instance, params);
		}		
		return instance;		
	}

});



/*
---

name: String.Extras

description: Provides extra methods to String.

license: MIT-style license.

requires:
	- Core/String

provides:
	- String.Extras

...
*/

String.implement({

	camelize: function() {
		return this.toString()
	    	.replace(/([A-Z]+)/g,   function(m,l) { return l.substr(0, 1).toUpperCase() + l.toLowerCase().substr(1, l.length); })
		    .replace(/[\-_\s](.)/g, function(m,l) { return l.toUpperCase(); });
	}

});



/*
---

name: Object.Extras

description: Provides extra methods to Object.

license: MIT-style license.

author:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Object
	- String.Extras

provides:
	- Object.Extras

...
*/

Object.extend({

	defineMember: function(source, reference, name) {
		if (name) {
			name = name.camelize();
			if (source[name] == null || source[name] == undefined) {
				source[name] = reference;
			}
		}
		return source;
	}

})

/*
---

name: Array.Extras

description: Provides extra methods to the array object.

license: MIT-style license.

requires:
	- Core/Array

provides:
	- Array.Extras

...
*/

Array.implement({

	find: function(fn) {
		for (var i = 0; i < this.length; i++) {
			var found = fn.call(this, this[i]);
			if (found == true) {
				return this[i];
			}
		}
		return null;
	},
	
	lastItemAt: function(offset) {
		offset = offset ? offset : 0;
		return this[this.length - 1 - offset] ?
			   this[this.length - 1 - offset] :
			   null;
	}	
});

/*
---

name: Element.Extras

description: Provides extra methods to Element.

license: MIT-style license.

author:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	Core/Array
	Core/Element

provides:
	- Element.Extras

...
*/

(function() {

	var getChildElements = function() {
		return Array.from(this.childNodes);
	};

	Object.defineProperty(Element.prototype, 'childElements', {
		get: function() {
			return getChildElements.call(this);
		}
	});

	Element.implement({

		getChildElements: function() {
			return getChildElements.call(this);
		},

		removeStyle: function(style) {
			this.setStyle(style, null);
			return this;
		},

		removeStyles: function(styles) {
			for (var style in styles) this.removeStyle(style, styles[style]);
			return this;
		},

		isChild: function() {
			return document.documentElement.contains(this);
		},

		isOrphan: function() {
			return this.isChild == false();
		},

		ingest: function(string) {
			var match = string.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
			if (match) string = match[1];
			this.set('html', string);
			return this
		}
	});

})();

/*
---

name: Element.defineCustomEvent

description: Allows to create custom events based on other custom events.

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Element.Event]

provides: Element.defineCustomEvent

...
*/

(function(){

[Element, Window, Document].invoke('implement', {hasEvent: function(event){
	var events = this.retrieve('events'),
		list = (events && events[event]) ? events[event].values : null;
	if (list){
		for (var i = list.length; i--;) if (i in list){
			return true;
		}
	}
	return false;
}});

var wrap = function(custom, method, extended, name){
	method = custom[method];
	extended = custom[extended];

	return function(fn, customName){
		if (!customName) customName = name;

		if (extended && !this.hasEvent(customName)) extended.call(this, fn, customName);
		if (method) method.call(this, fn, customName);
	};
};

var inherit = function(custom, base, method, name){
	return function(fn, customName){
		base[method].call(this, fn, customName || name);
		custom[method].call(this, fn, customName || name);
	};
};

var events = Element.Events;

Element.defineCustomEvent = function(name, custom){

	var base = events[custom.base];

	custom.onAdd = wrap(custom, 'onAdd', 'onSetup', name);
	custom.onRemove = wrap(custom, 'onRemove', 'onTeardown', name);

	events[name] = base ? Object.append({}, custom, {

		base: base.base,

		condition: function(event){
			return (!base.condition || base.condition.call(this, event)) &&
				(!custom.condition || custom.condition.call(this, event));
		},

		onAdd: inherit(custom, base, 'onAdd', name),
		onRemove: inherit(custom, base, 'onRemove', name)

	}) : custom;

	return this;

};

var loop = function(name){
	var method = 'on' + name.capitalize();
	Element[name + 'CustomEvents'] = function(){
		Object.each(events, function(event, name){
			if (event[method]) event[method].call(event, name);
		});
	};
	return loop;
};

loop('enable')('disable');

})();


/*
---

name: Browser.Mobile

description: Provides useful information about the browser environment

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Browser]

provides: Browser.Mobile

...
*/

(function(){

Browser.Device = {
	name: 'other'
};

if (Browser.Platform.ios){
	var device = navigator.userAgent.toLowerCase().match(/(ip(ad|od|hone))/)[0];
	
	Browser.Device[device] = true;
	Browser.Device.name = device;
}

if (this.devicePixelRatio == 2)
	Browser.hasHighResolution = true;

Browser.isMobile = !['mac', 'linux', 'win'].contains(Browser.Platform.name);

}).call(this);


/*
---

name: Event.Mobile

description: Translate desktop events to mobile event correctly.

license: MIT-style license.

author:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Event
	- Core/Element.Event
	- Custom-Event/Element.defineCustomEvent
	- Mobile/Browser.Mobile

provides:
	- Event.Mobile

...
*/

if (Browser.isMobile) {

	delete Element.NativeEvents['mousedown'];
	delete Element.NativeEvents['mousemove'];
	delete Element.NativeEvents['mouseup'];

	Element.defineCustomEvent('mousedown', {
		base: 'touchstart'
	});

	Element.defineCustomEvent('mousemove', {
		base: 'touchmove'
	});

	Element.defineCustomEvent('mouseup', {
		base: 'touchend'
	});

}

/*
---

name: Event.Loaded

description: Provide an element that will be automatically fired when added
             after being fired for the first time.

license: MIT-style license.

author:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Event
	- Core/Element.Event
	- Custom-Event/Element.defineCustomEvent

provides:
	- Event.Loaded

...
*/

(function() {

	var executed = false;

	Element.defineCustomEvent('loaded', {

		condition: function(e) {
			executed = true;
			return true;
		},

		onSetup: function() {
			if (executed) {
				this.fireEvent('loaded');
			}
		}

	});

})();

/*
---

name: Event.Ready

description: Provides an event that indicates the app is loaded. This event is
             based on the domready event or other third party events such as
			 deviceready on phonegap.

license: MIT-style license.

author:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Event
	- Core/Element.Event
	- Core/DOMReady
	- Custom-Event/Element.defineCustomEvent
	- Browser.Platform

provides:
	- Event.Ready

...
*/

(function() {

	Element.NativeEvents.deviceready = 1;

	var domready = Browser.Platform.phonegap ? 'deviceready' : 'domready';

	var onReady = function(e) {
		this.fireEvent('ready');
	};

	Element.defineCustomEvent('ready', {

		onSetup: function(){
			this.addEvent(domready, onReady);
		},

		onTeardown: function(){
			this.removeEvent(domready, onReady);
		}

	});

})();




/*
---

name: Browser.Features.Touch

description: Checks whether the used Browser has touch events

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Browser]

provides: Browser.Features.Touch

...
*/

Browser.Features.Touch = (function(){
	try {
		document.createEvent('TouchEvent').initTouchEvent('touchstart');
		return true;
	} catch (exception){}
	
	return false;
})();

// Chrome 5 thinks it is touchy!
// Android doesn't have a touch delay and dispatchEvent does not fire the handler
Browser.Features.iOSTouch = (function(){
	var name = 'cantouch', // Name does not matter
		html = document.html,
		hasTouch = false;

	var handler = function(){
		html.removeEventListener(name, handler, true);
		hasTouch = true;
	};

	try {
		html.addEventListener(name, handler, true);
		var event = document.createEvent('TouchEvent');
		event.initTouchEvent(name);
		html.dispatchEvent(event);
		return hasTouch;
	} catch (exception){}

	handler(); // Remove listener
	return false;
})();


/*
---

name: Touch

description: Provides a custom touch event on mobile devices

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Element.Event, Custom-Event/Element.defineCustomEvent, Browser.Features.Touch]

provides: Touch

...
*/

(function(){

var preventDefault = function(event){
	event.preventDefault();
};

var disabled;

Element.defineCustomEvent('touch', {

	base: 'touchend',

	condition: function(event){
		if (disabled || event.targetTouches.length != 0) return false;

		var touch = event.changedTouches[0],
			target = document.elementFromPoint(touch.clientX, touch.clientY);

		do {
			if (target == this) return true;
		} while ((target = target.parentNode) && target);

		return false;
	},

	onSetup: function(){
		this.addEvent('touchstart', preventDefault);
	},

	onTeardown: function(){
		this.removeEvent('touchstart', preventDefault);
	},

	onEnable: function(){
		disabled = false;
	},

	onDisable: function(){
		disabled = true;
	}

});

})();


/*
---

name: Click

description: Provides a replacement for click events on mobile devices

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Touch]

provides: Click

...
*/

if (Browser.Features.iOSTouch) (function(){

var name = 'click';
delete Element.NativeEvents[name];

Element.defineCustomEvent(name, {

	base: 'touch'

});

})();


/*
---

name: Event.Click

description: Provides a click event that is not triggered when the user clicks
             and moves the mouse. This overrides the default click event. It's
			 important to include Mobile/Click before this class otherwise the
			 click event will be deleted.

license: MIT-style license.

author:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Event
	- Core/Element.Event
	- Custom-Event/Element.defineCustomEvent
	- Mobile/Browser.Mobile
	- Mobile/Click
	- Mobile/Touch
	- Event.Mobile

provides:
	- Event.Click

...
*/

(function(){

	var x = 0;
	var y = 0;
	var down = false;
	var valid = true;

	var onMouseDown = function(e) {
		valid = true;
		down = true;
		x = e.page.x;
		y = e.page.y;
	};

	var onMouseMove = function(e) {
		if (down) {
			valid = !moved(e);
			if (valid == false) {
				this.removeEvent('mouseup', onMouseUp).fireEvent('mouseup', e).addEvent('mouseup', onMouseUp);
			}
		}
	};

	var onMouseUp = function(e) {
		if (down) {
			down = false;
			valid = !moved(e);
		}
	};

	var moved = function(e) {
		var xmax = x + 3;
		var xmin = x - 3;
		var ymax = y + 3;
		var ymin = y - 3;
		return (e.page.x > xmax || e.page.x < xmin || e.page.y > ymax || e.page.y < ymin);
	};

	Element.defineCustomEvent('click', {

		base: 'click',

		onAdd: function() {
			this.addEvent('mousedown', onMouseDown);
			this.addEvent('mousemove', onMouseMove);
			this.addEvent('mouseup', onMouseUp);
		},

		onRemove: function() {
			this.removeEvent('mousedown', onMouseDown);
			this.removeEvent('mousemove', onMouseMove);
			this.removeEvent('mouseup', onMouseUp);
		},

		condition: function(e) {
			return valid;
		}

	});

})();

/*
---

name: Event.TranstionEnd

description: Enable the transition end event.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Event
	- Core/Element
	- Core/Element.Event

provides:
	- Event.TransitionEnd

...
*/

(function() {

	/* vendor prefix */

	var prefix = '';
	if (Browser.safari || Browser.chrome || Browser.Platform.ios) {
		prefix = 'webkit';
	} else if (Browser.firefox) {
		prefix = 'Moz';
	} else if (Browser.opera) {
		prefix = 'o';
	} else if (Browser.ie) {
		prefix = 'ms';
	}

	/* events */

	Element.NativeEvents[prefix + 'TransitionEnd'] = 2;
	Element.Events.transitionend = { base: (prefix + 'TransitionEnd') };

})();



/*
---

name: Class.Binds

description: A clean Class.Binds Implementation

authors: Scott Kyle (@appden), Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Class, Core/Function]

provides: Class.Binds

...
*/

Class.Binds = new Class({

	$bound: {},

	bound: function(name){
		return this.$bound[name] ? this.$bound[name] : this.$bound[name] = this[name].bind(this);
	}

});

/*
---

name: Request

description: Provides a base class for ajax request.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Class
	- Core/Class.Extras
	- Core/Request
	- Class-Extras/Class.Binds

provides:
	- Request

...
*/

if (!window.Moobile) window.Moobile = {};

Moobile.Request = new Class({

	Extends: Request,

	Implements: [
		Class.Binds
	],

	options: {
		isSuccess: function() {
			var status = this.status;
			return (status == 0 || (status >= 200 && status < 300));
		}
	}

});

/*
---

name: Request.View

description: Provides a method to load a view element from a remote location.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Event
	- Core/Element
	- Core/Element.Event
	- More/Events.Pseudos
	- Element.Extras
	- Request

provides:
	- Request.ViewController

...
*/

Moobile.Request.View = new Class({

	Extends: Moobile.Request,

	cache: {},

	options: {
		method: 'get'
	},

	initialize: function(options) {
		this.parent(options);
		this.attachEvents();
		return this;
	},

	attachEvents: function() {
		this.addEvent('success', this.bound('onViewLoad'));
		return this;
	},

	detachEvents: function() {
		this.removeEvent('success', this.bound('onViewLoad'));
		return this;
	},

	setCache: function(url, viewController) {
		this.cache[url] = viewController;
		return this;
	},

	getCache: function(url) {
		return this.hasCache(url) ? this.cache[url] : null;
	},

	hasCache: function(url) {
		return this.cache[url] && this.cache[url].isStarted();
	},

	load: function(url, callback) {

		var viewElement = this.getCache(url);
		if (viewElement) {
			callback.call(this, viewElement);
			return this;
		}

		this.addEvent('load:once', callback);
		this.setCache(url, null);
		this.options.url = url;
		this.send();

		return this;
	},

	onViewLoad: function(response) {

		var viewElement = new Element('div').ingest(response).getElement('[data-role=view]');
		if (viewElement) {
			this.setCache(this.options.url, viewElement);
			this.fireEvent('load', viewElement);
			return this;
		}

		throw new Error('Cannot find a data-role=view element from the response');

		return this;
	}

});

/*
---

name: UI.Element

description: Provides an element handled by a view.

license: MIT-style license.

requires:
	- Core/Class
	- Core/Class.Extras
	- Core/Event
	- Core/DOMReady
	- Core/Element
	- Core/Element.Style
	- Core/Element.Event
	- Core/Element.Dimensions
	- More/Element.Shortcuts
	- More/Class.Occlude
	- Class-Extras/Class.Binds
	- Object.Extras
	- String.Extras
	- Array.Extras
	- Class.Instanciate
	- Element.Extras

provides:
	- UI.Element

...
*/

if (!window.Moobile) window.Moobile = {};
if (!window.Moobile.UI) window.Moobile.UI = {};

Moobile.UI.Element = new Class({

	Implements: [
		Events,
		Options,
		Class.Binds,
		Class.Occlude
	],

	element: null,

	name: null,

	options: {
		className: ''
	},

	initialize: function(element, options) {
		this.setElement(element);
		this.setElementOptions();
		this.setOptions(options);
		this.name = this.element.get('data-name');
		this.build();
		return this;
	},

	create: function() {
		return new Element('div');
	},

	build: function() {
		this.element.addClass(this.options.className);
		return this;
	},

	setElementOptions: function() {
		var options = this.element.get('data-options');
		if (options) {
			options = '{' + options + '}';
			options = JSON.decode(options);
			Object.append(this.options, options);
		}
		return this;
	},

	setElement: function(element) {
		if (this.element == null) this.element = document.id(element);
		if (this.element == null) this.element = document.getElement(element);
		if (this.element == null) this.element = this.create();
		return this;
	},

	getElement: function(selector) {
		return this.element.getElement(selector);
	},

	getElements: function(selector) {
		return this.element.getElements(selector);
	},

	toElement: function() {
		return this.element;
	},

	show: function() {
		this.element.show();
		this.fireEvent('show');
		return this;
	},

	hide: function() {
		this.element.hide();
		this.fireEvent('hide');
		return this;
	},

	fade: function(how) {
		this.element.fade(how);
		this.fireEvent('fade', how);
		return this;
	},

	addClass: function(name) {
		this.element.addClass(name);
		return this;
	},

	removeClass: function(name) {
		this.element.removeClass(name);
		return this;
	},

	toggleClass: function(name) {
		this.element.toggleClass(name);
		return this;
	},

	setStyle: function(style, value) {
		this.element.setStyle(style, value);
		return this;
	},

	getStyle: function(style) {
		return this.element.getStyle(style);
	},

	removeStyle: function(style) {
		this.element.setStyle(style, null);
	},

	getProperty: function(name) {
		return this.element.get(name);
	},

	setProperty: function(name, value) {
		this.element.set(name, value);
		return this;
	},

	removeProperty: function(name) {
		this.element.erase(name);
		return this;
	},

	isChild: function() {
		return this.element.isChild();
	},

	isOrphan: function() {
		return this.element.isOrphan();
	},

	adopt: function() {
		this.element.adopt.apply(this.element, arguments);
		return this;
	},

	inject: function(element, where) {
		if (where == 'header') where = 'top';
		if (where == 'footer') where = 'bottom';
		this.element.inject(element, where);
		return this;
	},

	grab: function(element, where) {
		if (where == 'header') where = 'top';
		if (where == 'footer') where = 'bottom';
		this.element.grab(element, where);
		return this;
	},

	hook: function(element, where, context) {

		if (element.isChild())
			return this;

		if (context) {
			if (where == 'header') where = 'top';
			if (where == 'footer') where = 'bottom';
		}

		return context ? element.inject(context, where) : this.grab(element, where);
	},

	empty: function() {
		this.element.empty();
		return this;
	},

	dispose: function() {
		this.element.dispose();
		return this;
	},

	destroy: function() {
		this.element.destroy();
		this.element = null;
		return this;
	}

});

/*
---

name: UI.Control

description: Provides the base class for any types of controls.

license: MIT-style license.

requires:
	- UI.Element

provides:
	- UI.Control

...
*/

Moobile.UI.Control = new Class({

	Extends: Moobile.UI.Element,

	view: null,

	content: null,

	childControls: [],

	disabled: false,

	selected: false,

	highlighted: false,

	style: null,

	options: {
		className: '',
		styleName: null
	},

	initialize: function(element, options) {
		this.parent(element, options);
		this.attachChildControls();
		this.init();
		this.attachEvents();
		return this;
	},

	destroy: function() {
		this.detachEvents();
		this.release();
		this.parent();
		return this;
	},

	build: function() {
		this.parent();
		if (this.options.styleName) this.setStyle(this.options.styleName);
		if (this.isNative() == false) {
			this.content = new Element('div.' + this.options.className + '-content');
			this.content.adopt(this.element.childElements);
			this.element.adopt(this.content);
		}
		return this;
	},

	init: function() {
		return this;
	},

	release: function() {
		return this;
	},

	attachEvents: function() {
		return this;
	},

	detachEvents: function() {
		return this;
	},

	addChildControl: function(control, where, context) {

		this.childControls.push(control);

		this.willAddChildControl(control);
		this.hook(control, where, context);
		control.viewWillChange(this.view);
		control.view = this.view;
		control.viewDidChange(this.view);
		this.didAddChildControl(control);

		Object.defineMember(this, control, control.name);

		return this;
	},

	getChildControl: function(name) {
		return this.childControls.find(function(childControl) {
			return childControl.name == name;
		});
	},

	getChildControls: function() {
		return this.childControls;
	},

	removeChildControl: function(control) {
		var removed = this.childControls.erase(control);
		if (removed) {
			this.willRemoveChildControl(control);
			control.viewWillChange(null);
			control.view = null;
			control.viewDidChange(null);
			control.dispose();
			this.didRemoveChildControl(control);
		}
		return this;
	},

	removeFromParentView: function() {
		if (this.parentControl) this.parentControl.removeChildControl(this);
		return this;
	},

	attachChildControls: function() {
		var attach = this.bound('attachChildControl');
		var filter = this.bound('filterChildControl');
		this.getElements('[data-role=control]').filter(filter).each(attach);
		return this;
	},

	attachChildControl: function(element) {
		var control = element.get('data-control');
		if (control == null) throw new Error('You have to define the control class using the data-control attribute.');
		this.addChildControl(Class.instanciate(control, element));
		return this;
	},

	filterChildControl: function(element) {
		return element.getParent('[data-role=control]') == this.element;
	},

	destroyChildControls: function() {
		this.childControls.each(this.bound('destroyChildControl'));
		this.childControls = [];
		return this;
	},

	destroyChildControl: function(control) {
		control.destroy();
		control = null;
		return this;
	},

	setStyle: function(style, value) {
		if (typeof style == 'object') {
			this.removeStyle();
			this.style = style;
			this.style.attach.call(this);
			this.addClass(this.style.className);
		} else {
			this.parent(style, value);
		}
		return this;
	},

	getStyle: function(style) {
		return style ? this.parent(style) : this.style;
	},

	removeStyle: function(style) {
		if (style == undefined) {
			if (this.style) {
				this.style.detach.call(this);
				this.removeClass(this.style.className);
				this.style = null;
			}
		} else {
			this.parent(style);
		}
		return this;
	},

	setDisabled: function(disabled) {
		if (this.disabled != disabled) {
			this.disabled = disabled;
			if (this.disabled) {
				this.detachEvents();
				this.addClass(this.options.className + '-disabled');
				this.fireEvent('disable', this);
			} else {
				this.attachEvents();
				this.removeClass(this.options.className + '-disabled');
				this.fireEvent('enable', this);
			}
		}
		return this;
	},

	isDisabled: function() {
		return this.disabled;
	},

	setSelected: function(selected) {
		if (this.selected != selected) {
			this.selected = selected;
			if (this.selected) {
				this.addClass(this.options.className + '-selected');
				this.fireEvent('select', this);
			} else {
				this.removeClass(this.options.className + '-selected');
				this.fireEvent('deselect', this);
			}
		}
		return this;
	},

	isSelected: function() {
		return this.selected;
	},

	setHighlighted: function(highlighted) {
		if (this.highlighted != highlighted) {
			this.highlighted = highlighted;
			if (this.highlighted) {
				this.addClass(this.options.className + '-highlighted');
				this.fireEvent('highlight', this);
			} else {
				this.removeClass(this.options.className + '-highlighted');
				this.fireEvent('unhighlight', this);
			}
		}
		return this;
	},

	isHighlighted: function() {
		return this.highlighted;
	},

	isNative: function() {
		return ['input', 'textarea', 'select', 'button'].contains(this.element.get('tag'));
	},

	adopt: function() {
		this.content.adopt.apply(this.content, arguments);
		return this;
	},

	grab: function(element, where) {
		if (where == 'header') where = 'top';
		if (where == 'footer') where = 'bottom';
		this.content.grab(element, where);
		return this;
	},

	empty: function() {
		this.content.empty();
		return this;
	},

	viewWillChange: function(parentView) {
		return this;
	},

	viewDidChange: function(parentView) {
		return this;
	},

	willAddChildControl: function(childControl) {
		return this;
	},

	didAddChildControl: function(childControl) {
		return this;
	},

	willRemoveChildControl: function(childControl) {
		return this;
	},

	didRemoveChildControl: function(childControl) {
		return this;
	}

});


/*
---

name: UI.ButtonStyle

description: Provide constants for button styles.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:

provides:
	- UI.ButtonStyle

...
*/

if (!window.Moobile) window.Moobile = {};
if (!window.Moobile.UI) window.Moobile.UI = {};

Moobile.UI.ButtonStyle = {

	Default: {
		className: 'style-default',
		attach: function() {},
		detach: function() {}
	}
	
};


/*
---

name: UI.Button

description: Provides a button.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- UI.Control
	- UI.ButtonStyle

provides:
	- UI.Button

...
*/

Moobile.UI.Button = new Class({

	Extends: Moobile.UI.Control,

	options: {
		className: 'ui-button',
		styleName: Moobile.UI.ButtonStyle.Default
	},

	attachEvents: function() {
		this.element.addEvent('click', this.bound('onClick'));
		this.element.addEvent('mouseup', this.bound('onMouseUp'))
		this.element.addEvent('mousedown', this.bound('onMouseDown'));
		this.parent();
		return this;
	},

	detachEvents: function() {
		this.element.removeEvent('click', this.bound('onClick'));
		this.element.removeEvent('mouseup', this.bound('onMouseUp'));
		this.element.removeEvent('mousedown', this.bound('onMouseDown'));
		this.parent();
		return this;
	},

	setText: function(text) {

		if (this.isNative()) {
			this.element.set('value', text);
			return this;
		}

		this.content.set('html', text);

		return this;
	},

	onClick: function(e) {
		e.target = this;
		this.fireEvent('click', e);
		return this;
	},

	onMouseDown: function(e) {
		e.target = this;
		this.element.addClass(this.options.className + '-down');
		this.fireEvent('mousedown', e);
		return this;
	},

	onMouseUp: function(e) {
		e.target = this;
		this.element.removeClass(this.options.className + '-down');
		this.fireEvent('mouseup', e);
		return this;
	}

});

/*
---

name: UI.ButtonGroup

description:

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- UI.Control

provides:
	- UI.ButtonGroup

...
*/

Moobile.UI.ButtonGroup = new Class({

	Extends: Moobile.UI.Control,

	selectedButton: null,

	options: {
		className: 'ui-button-group',
		orientation: 'horizontal'
	},

	build: function() {
		this.parent();
		this.element.addClass(this.options.className + '-' + this.options.orientation);
		return this;
	},

	addButton: function(button, where, context) {
		return this.addChildControl(button, where, context);
	},

	getButton: function(name) {
		return this.getChildControl(name);
	},

	getButtons: function() {
		return this.getChildControls();
	},

	removeButton: function(button) {
		return this.removeChildControl(button);
	},

	removeButtons: function() {
		return this.removeChildControls();
	},

	setSelectedButton: function(button) {
		if (this.selectedButton != button) {
			if (this.selectedButton) {
				this.selectedButton.setSelected(false);
				this.selectedButton = null;
			}
			this.selectedButton = button;
			this.selectedButton.setSelected(true);
			this.fireEvent('change', this.selectedButton);
		}
		return this;
	},

	setSelectedButtonIndex: function(index) {
		var button = this.childControls[index];
		if (button) this.setSelectedButton(button);
		return this;
	},

	getSelectedButton: function() {
		return this.selectedButton;
	},

	didAddChildControl: function(button) {
		button.addEvent('click', this.bound('onButtonClick'));
		this.parent();
		return this;
	},

	onButtonClick: function(e) {
		this.setSelectedButton(e.target);
		return this;
	}

});

/*
---

name: UI.BarStyle

description: Provide constants for bar styles.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:

provides:
	- UI.BarStyle

...
*/

if (!window.Moobile) window.Moobile = {};
if (!window.Moobile.UI) window.Moobile.UI = {};

Moobile.UI.BarStyle = {

	DefaultOpaque: {
		className: 'style-blue-opaque',
		attach: function() {},
		detach: function() {}
	},

	DefaultTranslucent: {
		className: 'style-blue-translucent',
		attach: function() {},
		detach: function() {}
	},

	BlackOpaque: {
		className: 'style-black-opaque',
		attach: function() {},
		detach: function() {}
	},

	BlackTranslucent: {
		className: 'style-black-translucent',
		attach: function() {},
		detach: function() {}
	}

};

/*
---

name: UI.Bar

description: Provide the base class for a bar.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- UI.Control
	- UI.BarStyle

provides:
	- UI.Bar

...
*/

Moobile.UI.Bar = new Class({

	Extends: Moobile.UI.Control,

	options: {
		className: 'ui-bar',
		styleName: Moobile.UI.BarStyle.DefaultOpaque
	},

	addBarButton: function(button, where, context) {
		return this.addChildControl(button, where, context);
	},

	getBarButton: function(name) {
		return this.getChildControl(name);
	},

	getBarButtons: function() {
		return this.getChildControls();
	},

	removeBarButton: function(button) {
		return this.removeChildControl(button);
	},

	removeBarButtons: function() {
		return this.removeChildControls();
	}

});

/*
---

name: UI.Bar.Navigation

description: Provide the navigation bar control that contains a title and two
             areas for buttons.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- UI.Bar

provides:
	- UI.Bar.Navigation

...
*/

Moobile.UI.Bar.Navigation = new Class({

	Extends: Moobile.UI.Bar,

	navigationItem : null,

	options: {
		className: 'ui-navigation-bar'
	},

	release: function() {
		this.navigationItem = null;
		this.parent();
		return this;
	},

	setNavigationItem: function(navigationItem) {
		this.removeNavigationItem();
		this.navigationItem = navigationItem;
		this.addChildControl(this.navigationItem);
		return this;
	},

	getNavigationItem: function() {
		return this.navigationItem = null;
	},

	removeNavigationItem: function() {
		if (this.navigationItem) {
			this.removeChildControl(this.navigationItem);
			this.navigationItem.destroy();
			this.navigationItem = null;
		}
		return this;
	},

	viewWillChange: function(view) {
		if (this.view) this.view.removeClass('with-' + this.options.className);
		this.parent();
		return this;
	},

	viewDidChange: function(view) {
		if (this.view) this.view.addClass('with-' + this.options.className);
		this.parent();
		return this;
	}

});

/*
---

name: UI.Bar.NavigationItem

description: Provides a container with a title and two buttons for the
             navigation bar.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- UI.Control

provides:
	- UI.Bar.NavigationItem

...
*/

if (!window.Moobile.UI.Bar) window.Moobile.UI.Bar = {};

Moobile.UI.Bar.NavigationItem = new Class({

	Extends: Moobile.UI.Control,

	title: null,

	titleContainer: null,

	leftBarButton: null,

	leftBarButtonContainer: null,

	rightBarButton: null,

	rightBarButtonContainer: null,

	options: {
		className: 'ui-navigation-bar-item'
	},

	build: function() {
		this.parent();
		this.buildTitleContainer();
		this.buildLeftBarButtonContainer();
		this.buildRightBarButtonContainer();
		return this;
	},

	buildTitleContainer: function() {
		this.titleContainer = new Element('div.' + this.options.className + '-title');
		this.titleContainer.inject(this.content);
		return this;
	},

	buildLeftBarButtonContainer: function() {
		this.leftBarButtonContainer = new Element('div.' + this.options.className + '-left');
		this.leftBarButtonContainer.inject(this.titleContainer, 'before') ;
		return this;
	},

	buildRightBarButtonContainer: function() {
		this.rightBarButtonContainer = new Element('div.' + this.options.className + '-right');
		this.rightBarButtonContainer.inject(this.titleContainer, 'after');
		return this;
	},

	release: function() {
		this.title = null;
		this.titleContainer = null;
		this.leftBarButton = null;
		this.leftBarButtonContainer = null;
		this.rightBarButton = null;
		this.rightBarButtonContainer = null;
		this.parent();
		return this;
	},

	setLeftBarButton: function(button) {
		this.removeLeftBarButton();
		this.leftBarButton = button;
		this.leftBarButton.inject(this.leftBarButtonContainer);
		return this;
	},

	getLeftBarButton: function(button) {
		return this.leftButton;
	},

	removeLeftBarButton: function() {
		if (this.leftBarButton) {
			this.leftBarButton.destroy();
			this.leftBarButton = null;
		}
		return this;
	},

	setRightBarButton: function(button) {
		this.removeRightBarButton();
		this.rightBarButton = button;
		this.rightBarButton.inject(this.rightBarButtonContainer);
		return this;
	},

	getRightBarButton: function() {
		return this.rightBarButton;
	},

	removeRightBarButton: function() {
		if (this.rightBarButton) {
			this.rightBarButton.destroy();
			this.rightBarButton = null;
		}
		return this;
	},

	setTitle: function(title) {

		this.title = title;

		if (typeof this.title == 'string') {
			this.titleContainer.set('html', this.title);
			return this;
		}

		if (typeof this.title == 'object') {
			this.titleContainer.adopt(this.title);
			return this;
		}

		return this;
	},

	getTitle: function() {
		return this.title;
	}

});

/*
---

name: UI.BarButtonStyle

description: Provide constants for bar button styles.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:

provides:
	- UI.BarButtonStyle

...
*/

if (!window.Moobile) window.Moobile = {};
if (!window.Moobile.UI) window.Moobile.UI = {};

Moobile.UI.BarButtonStyle = {

	Default: {
		className: 'style-default',
		attach: function() {},
		detach: function() {}
	},

	Active: {
		className: 'style-active',
		attach: function() {},
		detach: function() {}
	},

	Black: {
		className: 'style-black',
		attach: function() {},
		detach: function() {}
	},

	Warning: {
		className: 'style-warning',
		attach: function() {},
		detach: function() {}
	},

	Back: {
		className: 'style-back',
		attach: function() {},
		detach: function() {}
	},

	Forward: {
		className: 'style-forward',
		attach: function() {},
		detach: function() {}
	}

};

/*
---

name: UI.BarButton

description: Provides a button used inside a bar such as the navigation bar.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- UI.Button
	- UI.BarButtonStyle

provides:
	- UI.BarButton

...
*/

Moobile.UI.BarButton = new Class({

	Extends: Moobile.UI.Button,

	options: {
		className: 'ui-bar-button',
		styleName: Moobile.UI.BarButtonStyle.Default
	}

});

/*
---

name: UI.Slider

description:

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- More/Class.Refactor
	- More/Slider
	- UI.Control

provides:
	- UI.Slider

...
*/

Class.refactor(Slider, {

	draggedKnob: function() {
		this.fireEvent('move', this.drag.value.now[this.axis]);
		this.previous();
	}

});

Moobile.UI.Slider = new Class({

	Extends: Moobile.UI.Control,

	slider: null,

	trackElement: null,

	handleElement: null,

	options: {
		className: 'ui-slider',
		snap: false,
		mode: 'horizontal',
		min: 0,
		max: 100,
		background: true,
		backgroundSize: 2048
	},

	build: function() {
		this.parent();
		this.buildTrackElement();
		this.buildHandleElement();
		return this;
	},

	buildTrackElement: function() {
		this.trackElement = new Element('div.' + this.options.className + '-track');
		this.trackElement.inject(this.element);
		return this;
	},

	buildHandleElement: function() {
		this.handleElement = new Element('div.' + this.options.className + '-handle');
		this.handleElement.inject(this.trackElement);
		return this;
	},

	init: function() {
		this.attachSlider();
		this.set(this.options.min);
		this.parent();
		return this;
	},

	release: function() {
		this.detachSlider();
		this.handleElement = null;
		this.parent();
		return this;
	},

	attachSlider: function() {

		var options = {
			snap: this.options.snap,
			steps: this.options.max - this.options.min,
			range: [this.options.min, this.options.max],
			mode: this.options.mode
		};

		this.slider = new Slider(this.trackElement, this.handleElement, options);

		this.slider.addEvent('move', this.bound('onMove'));
		this.slider.addEvent('tick', this.bound('onTick'));
		this.slider.addEvent('change', this.bound('onChange'));

		return this;
	},

	detachSlider: function() {
		this.slider = null;
		return this;
	},

	set: function(step) {
		this.slider.set(step);
		return this;
	},

	adjustBackground: function(position) {
		this.trackElement.setStyle('background-position',
			(-this.options.backgroundSize / 2) + (position + this.handleElement.getSize().x / 2)
		);
		return this;
	},

	onMove: function(position) {
		this.adjustBackground(position);
		this.fireEvent('move', position);
	},

	onTick: function(position) {
		this.adjustBackground(position);
		this.fireEvent('tick', position);
	},

	onChange: function(step) {
		this.adjustBackground(this.slider.toPosition(step));
		this.fireEvent('change', step);
	}

});

/*
---

name: UI.ListStyle

description: Provide constants for list styles.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:

provides:
	- UI.ListStyle

...
*/

if (!window.Moobile) window.Moobile = {};
if (!window.Moobile.UI) window.Moobile.UI = {};

Moobile.UI.ListStyle = {

	Default: {
		className: 'style-default',
		attach: function() {},
		detach: function() {}
	},
	
	Grouped: {
		className: 'style-grouped',
		attach: function() {},
		detach: function() {}	
	}
	
};


/*
---

name: UI.List

description: Provide a list of items.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- UI.Control
	- UI.ListStyle

provides:
	- UI.List

...
*/

Moobile.UI.List = new Class({

	Extends: Moobile.UI.Control,

	selectedItems: [],

	options: {
		className: 'ui-list',
		styleName: Moobile.UI.ListStyle.Default,
		multiple: false,
		selectable: true
	},

	addItem: function(item, where, context) {
		return this.addChildControl(item, where, context);
	},

	getItem: function(name) {
		return this.getChildControl(name);
	},

	getItems: function() {
		return this.getChildControls();
	},

	removeItem: function(item) {
		return this.removeChildControl(item);
	},

	removeItems: function() {
		return this.removeChildControls();
	},

	setSelectedItem: function(item) {
		if (this.options.multiple) {
			if (item.isSelected()) {
				this.removeSelectedItem(item);
				return this
			}
		} else {
			var selectedItem = this.getSelectedItem();
			if (selectedItem) {
				this.removeSelectedItem(selectedItem);
			}
		}
		item.setSelected(true);
		this.selectedItems.push(item);
		this.fireEvent('select', item);
		return this;
	},

	setSelectedItemIndex: function(index) {
		var item = this.childControls[index];
		if (item) this.setSelectedItem(item);
		return this;
	},

	removeSelectedItems: function() {
		this.selectedItems.each(this.bound('removeSelectedItem'));
		this.selectedItems = [];
		return this;
	},

	removeSelectedItem: function(item) {
		item.setSelected(false);
		this.selectedItems.erase(item);
		this.fireEvent('deselect', item);
		return this;
	},

	getSelectedItem: function() {
		return this.selectedItems.getLast();
	},

	getSelectedItems: function() {
		return this.selectedItems;
	},

	didAddChildControl: function(item) {
		item.addEvent('click', this.bound('onClick'));
		item.addEvent('mouseup', this.bound('onMouseUp'));
		item.addEvent('mousedown', this.bound('onMouseDown'));
		this.parent();
		return this;
	},

	onClick: function(e) {
		var item = e.target;
		if (this.options.selectable) this.setSelectedItem(item);
		this.fireEvent('click', e);
		return this;
	},

	onMouseUp: function(e) {
		var item = e.target;
		if (this.options.selectable) item.setHighlighted(false);
		this.fireEvent('mouseup', e);
		return this;
	},

	onMouseDown: function(e) {
		var item = e.target;
		if (this.options.selectable) item.setHighlighted(true);
		this.fireEvent('mousedown', e);
		return this;
	}

});


/*
---

name: UI.ListItem

description: Provide an item of a list.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- UI.Control

provides:
	- UI.ListItem

...
*/

Moobile.UI.ListItem = new Class({

	Extends: Moobile.UI.Control,

	options: {
		className: 'ui-list-item'
	},

	release: function() {
		this.contentElement = null;
		this.parent();
		return this;
	},

	attachEvents: function() {
		this.element.addEvent('swipe', this.bound('onSwipe'));
		this.element.addEvent('click', this.bound('onClick'));
		this.element.addEvent('mouseup', this.bound('onMouseUp'))
		this.element.addEvent('mousedown', this.bound('onMouseDown'));
		this.parent();
		return this;
	},

	detachEvents: function() {
		this.element.removeEvent('swipe', this.bound('onSwipe'));
		this.element.removeEvent('click', this.bound('onClick'));
		this.element.removeEvent('mouseup', this.bound('onMouseUp'));
		this.element.removeEvent('mousedown', this.bound('onMouseDown'));
		this.parent();
		return this;
	},

	onSwipe: function(e) {
		e.target = this;
		this.fireEvent('swipe', e);
		return this;
	},

	onClick: function(e) {
		e.target = this;
		this.fireEvent('click', e);
		return this;
	},

	onMouseUp: function(e) {
		e.target = this;
		this.fireEvent('mouseup', e);
		return this;
	},

	onMouseDown: function(e) {
		e.target = this;
		this.fireEvent('mousedown', e);
		return this;
	}
});

/*
---

name: View

description: Provides an element on the screen and the interfaces for managing
             the content in that area.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- UI.Element

provides:
	- View

...
*/

Moobile.View = new Class({

	Extends: Moobile.UI.Element,

	parentView: null,

	window: null,

	content: null,

	childViews: [],

	childControls: [],

	childElements: [],

	started: false,

	options: {
		className: 'view'
	},

	initialize: function(element, options) {
		this.parent(element, options);
		return this;
	},

	build: function() {
		this.parent();
		this.content = new Element('div.' + this.options.className + '-content');
		this.content.adopt(this.element.childElements);
		this.element.adopt(this.content);
		return this;
	},

	startup: function() {
		if (this.started == false) {
			this.started = true;
			this.attachChildViews();
			this.attachChildControls();
			this.attachChildElements();
			this.init();
			this.attachEvents();
		}
		return this;
	},

	isStarted: function() {
		return this.started;
	},

	destroy: function() {

		this.removeFromParentView();

		this.detachEvents();
		this.destroyChildViews();
		this.destroyChildControls();
		this.destroyChildElements();

		this.release();

		this.parentView = null;
		this.window = null;
		this.content = null;
		this.started = false;

		this.parent();

		return this;
	},

	init: function() {
		return this;
	},

	release: function() {
		return this;
	},

	attachEvents: function() {
		return this;
	},

	detachEvents: function() {
		return this;
	},

	addChildView: function(view, where, context) {

		this.childViews.push(view);

		this.willAddChildView(view);
		this.hook(view, where, context);
		view.parentViewWillChange(this);
		view.parentView = this;
		view.window = this.window;
		view.parentViewDidChange(this);
		this.didAddChildView(view);

		view.startup();
		view.attachEvents();

		Object.defineMember(this, view, view.name);

		return this;
	},

	getChildView: function(name) {
		return this.childViews.find(function(childView) {
			return childView.name == name;
		});
	},

	getChildViews: function() {
		return this.childViews;
	},

	removeChildView: function(view) {
		var removed = this.childViews.erase(view);
		if (removed) {
			this.willRemoveChildView(view);
			view.parentViewWillChange(null);
			view.parentView = null;
			view.window = null
			view.parentViewDidChange(null);
			view.dispose();
			this.didRemoveChildView(view);
		}
		return this;
	},

	removeFromParentView: function() {
		var parent = this.parentView || this.window;
		if (parent) parent.removeChildView(this);
		return this;
	},

	attachChildViews: function() {
		var attach = this.bound('attachChildView');
		var filter = this.bound('filterChildView');
		this.getElements('[data-role=view]').filter(filter).each(attach);
		return this;
	},

	attachChildView: function(element) {
		var view = element.get('data-view');
		if (view == null) throw new Error('You have to define the view class using the data-view attribute.');
		this.addChildView(Class.instanciate(view, element));
		return this;
	},

	filterChildView: function(element) {
		return element.getParent('[data-role=view]') == this.element;
	},

	destroyChildViews: function() {
		this.childViews.each(this.bound('destroyChildView'));
		this.childViews = [];
		return this;
	},

	destroyChildView: function(view) {
		view.destroy();
		view = null;
		return this;
	},

	addChildControl: function(control, where, context) {

		this.childControls.push(control);

		this.willAddChildControl(control);
		this.hook(control, where, context);
		control.viewWillChange(this);
		control.view = this;
		control.viewDidChange(this);
		this.didAddChildControl(control);

		Object.defineMember(this, control, control.name);

		return this;
	},

	getChildControl: function(name) {
		return this.childControls.find(function(control) {
			return control.name == name;
		});
	},

	getChildControls: function() {
		return this.childControls;
	},

	removeChildControl: function(control) {
		var removed = this.childControls.erase(control);
		if (removed) {
			this.willRemoveChildControl(control);
			control.viewWillChange(null);
			control.view = null;
			control.viewDidChange(null);
			control.dispose();
			this.didRemoveChildControl(control);
		}
		return this;
	},

	attachChildControls: function() {
		var attach = this.bound('attachChildControl');
		var filter = this.bound('filterChildControl');
		this.getElements('[data-role=control]').filter(filter).each(attach);
		return this;
	},

	attachChildControl: function(element) {
		var control = element.get('data-control');
		if (control == null) throw new Error('You have to define the control class using the data-control attribute.');
		this.addChildControl(Class.instanciate(control, element));
		return this;
	},

	filterChildControl: function(element) {
		return element.getParent('[data-role=control]') == null && element.getParent('[data-role=view]') == this.element;
	},

	destroyChildControls: function() {
		this.childControls.each(this.bound('destroyChildControl'));
		this.childControls = [];
		return this;
	},

	destroyChildControl: function(control) {
		control.destroy();
		control = null;
		return this;
	},

	addChildElement: function(element, where, context) {

		this.childElements.push(element);

		this.willAddChildElement(element);
		this.hook(element, where, context);
		this.didAddChildElement(element);

		Object.defineMember(this, element, element.get('data-name'));

		return this;
	},

	getChildElement: function(name) {
		return this.childElements.find(function(element) {
			return (element.name || element.get('data-name')) == name;
		});
	},

	getChildElements: function() {
		return this.childElements;
	},

	removeChildElement: function(element) {
		var removed = this.childElements.erase(element);
		if (removed) {
			this.willRemoveChildElement(element);
			element.dispose();
			this.didRemoveChildElement(element);
		}
		return this;
	},

	attachChildElements: function() {
		var attach = this.bound('attachChildElement');
		var filter = this.bound('filterChildElement');
		this.getElements('[data-role=element]').filter(filter).each(attach);
		return this;
	},

	attachChildElement: function(element) {
		this.addChildElement(element);
		return this;
	},

	filterChildElement: function(element) {
		return element.getParent('[data-role=view]') == this.element;
	},

	destroyChildElements: function() {
		this.childControls.each(this.bound('destroyChildElement'));
		this.childControls = [];
		return this;
	},

	destroyChildElement: function(element) {
		element.destroy();
		element = null;
		return this;
	},

	getTitle: function() {
		return this.element.get('data-title') || 'Untitled';
	},

	getSize: function() {
		return this.element.getSize();
	},

	adopt: function() {
		this.content.adopt.apply(this.content, arguments);
		return this;
	},

	grab: function(element, where) {
		if (where == 'header') where = 'top';
		if (where == 'footer') where = 'bottom';
		this.content.grab(element, where);
		return this;
	},

	empty: function() {
		this.content.empty();
		return this;
	},

	show: function() {
		this.willShow();
		this.parent();
		this.didShow();
		return this;
	},

	hide: function() {
		this.willHide();
		this.parent();
		this.didHide();
		return this;
	},

	parentViewWillChange: function(parentView) {
		return this;
	},

	parentViewDidChange: function(parentView) {
		return this;
	},

	willAddChildView: function(childView) {
		return this;
	},

	didAddChildView: function(childView) {
		return this;
	},

	willRemoveChildView: function(childView) {
		return this;
	},

	didRemoveChildView: function(childView) {
		return this;
	},

	willAddChildControl: function(childControl) {
		return this;
	},

	didAddChildControl: function(childControl) {
		return this;
	},

	willRemoveChildControl: function(childControl) {
		return this;
	},

	didRemoveChildControl: function(childControl) {
		return this;
	},

	willAddChildElement: function(childElement) {
		return this;
	},

	didAddChildElement: function(childElement) {
		return this;
	},

	willRemoveChildElement: function(childElement) {
		return this;
	},

	didRemoveChildElement: function(childElement) {
		return this;
	},

	willShow: function() {
		return this;
	},

	didShow: function() {
		return this;
	},

	willHide: function() {
		return this;
	},

	didHide: function() {
		return this;
	}

});

/*
---

name: View.Scroll

description: Provide a view that scrolls when the content is larger that the
             window.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- View

provides:
	- View.Scroll

...
*/

(function() {

	var count = 0;

	Moobile.View.Scroll = new Class({

		Extends: Moobile.View,

		scrollableWrapper: null,

		scrollableContent: null,

		scrollableContentSize: null,

		scroller: null,

		scrollerUpdateInterval: null,

		scrolled: null,

		build: function() {
			this.parent();

			this.addClass(this.options.className + '-scroll');

			this.scrollableWrapper = new Element('div.' + this.options.className + '-scrollable-wrapper');
			this.scrollableContent = new Element('div.' + this.options.className + '-scrollable-content');
			this.scrollableContent.adopt(this.content.childElements);
			this.scrollableWrapper.adopt(this.scrollableContent);

			this.content.grab(this.scrollableWrapper);

			return this;
		},

		init: function() {
			this.parent();
			this.attachScroller();
			return this;
		},

		release: function() {
			this.disableScroller();
			this.detachScroller();
			this.outerElement = null;
			this.scrollableContent = null;
			this.parent();
			return this;
		},

		attachScroller: function() {
			if (++count == 1) document.addEventListener('touchmove', this.onDocumentTouchMove);
			return this;
		},

		detachScroller: function() {
			if (--count == 0) document.removeEventListener('touchmove', this.onDocumentTouchMove);
			return this;
		},

		createScroller: function() {
			return new iScroll(this.scrollableWrapper, { desktopCompatibility: true, hScroll: true, vScroll: true });
		},

		enableScroller: function() {
			if (this.scroller == null) {
				this.scroller = this.createScroller();
				this.updateScroller();
				this.updateScrollerAutomatically(true);
				if (this.scrolled) this.scroller.scrollTo(0, -this.scrolled);
			}
			return this;
		},

		disableScroller: function() {
			if (this.scroller) {
				this.updateScrollerAutomatically(false);
				this.scrolled = this.scrollableContent.getStyle('-webkit-transform');
				this.scrolled = this.scrolled.match(/translate3d\(-*(\d+)px, -*(\d+)px, -*(\d+)px\)/);
				this.scrolled = this.scrolled[2];
				this.scroller.destroy();
				this.scroller = null;
			}
			return this;
		},

		updateScroller: function() {
			if (this.scroller) {
				if (this.scrollableContentSize != this.scrollableContent.getScrollSize().y) {
					this.scrollableContentSize  = this.scrollableContent.getScrollSize().y;
					this.scroller.refresh();
				}
			}
			return this;
		},

		updateScrollerAutomatically: function(automatically) {
			clearInterval(this.scrollerUpdateInterval);
			if (automatically) this.scrollerUpdateInterval = this.updateScroller.periodical(250, this);
			return this;
		},

		adopt: function() {
			this.scrollableContent.adopt.apply(this.content, arguments);
			return this;
		},

		grab: function(element, where) {
console.log('Where: ' + where);
			if (where == 'header') {
				console.log('TEST');
				this.content.grab(element, 'top')
				return this;
			}

			if (where == 'footer') {
				this.content.grab(element, 'bottom')
				return this;
			}

			this.scrollableContent.grab(element, where);

			return this;
		},

		willShow: function() {
			this.enableScroller();
			this.parent();
			return this;
		},

		didShow: function() {
			this.updateScroller();
			this.parent();
			return this;
		},

		didHide: function() {
			this.disableScroller();
			return this;
		},

		onDocumentTouchMove: function(e) {
			e.preventDefault();
		}

	});

})();

/*
---

name: ViewPanel

description: The view that must be used in conjunction with a 
             ViewControllerPanel.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- View

provides:
	- ViewPanel

...
*/

Moobile.ViewPanel = new Class({

	Extends: Moobile.View,
	
	build: function() {
		this.parent();
		this.addClass(this.options.className + '-panel');
		return this;
	}

});

/*
---

name: ViewStack

description: The view that must be used in conjunction with a 
             ViewControllerStack.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- View

provides:
	- ViewStack

...
*/

Moobile.ViewStack = new Class({

	Extends: Moobile.View,
	
	build: function() {
		this.parent();
		this.addClass(this.options.className + '-stack');
		return this;
	}

});

/*
---

name: ViewTransition

description: Provides the base class for view controller transition effects.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Class
	- Core/Class.Extras
	- Core/Element
	- Core/Element.Event
	- Core/Element.Style
	- Class-Extras/Class.Binds
	- Event.TransitionEnd

provides:
	- ViewTransition

...
*/

if (!window.Moobile) window.Moobile = {};

Moobile.ViewTransition = new Class({

	Implements: [
		Events,
		Options,
		Chain,
		Class.Binds
	],

	transitionElement: null,

	acceptedTargets: [],

	running: false,

	attachEvents: function() {
		this.transitionElement.addEvent('transitionend', this.bound('onTransitionEnd'));
		return this;
	},

	detachEvents: function() {
		this.transitionElement.removeEvent('transitionend', this.bound('onTransitionEnd'));
		return this;
	},

	setTransitionElement: function(transitionElement) {
		this.transitionElement = document.id(transitionElement);
		return this;
	},

	addAcceptedTarget: function(target) {
		target = document.id(target);
		this.acceptedTargets.include(target);
		return this;
	},

	removeAcceptedTarget: function(target) {
		target = document.id(target);
		this.acceptedTargets.erase(target);
		return this;
	},

	clearAcceptedTargets: function() {
		this.acceptedTargets = [];
		return this;
	},

	getTransitionElement: function() {
		return this.transitionElement;
	},

	enter: function(viewToShow, viewToHide, parentView, firstViewIn) {
		return this;
	},

	leave: function(viewToShow, viewToHide, parentView) {
		return this;
	},

	start: function(callback) {
		if (this.running == false) {
			this.running = true;
			this.addEvent('ended:once', callback);
			this.play.delay(5, this);
		}
		return this;
	},

	play: function() {
		this.running = true;
		this.attachEvents();
		this.transitionElement.addClass('commit-transition');
		return this;
	},

	onTransitionEnd: function(e) {

		if (this.running && (e.target === this.transitionElement || this.acceptedTargets.contains(e.target))) {
			this.running = false;
			this.transitionElement.removeClass('commit-transition');
			this.detachEvents();
			this.clearAcceptedTargets();
			this.fireEvent('ended');
			this.fireEvent('complete');
		}
		return this;
	}

});

/*
---

name: ViewTransition.Slide

description: Provide a slide view controller transition effect.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewTransition

provides:
	- ViewTransition.Slide

...
*/

Moobile.ViewTransition.Slide = new Class({

	Extends: Moobile.ViewTransition,

	enter: function(viewToShow, viewToHide, parentView, firstViewIn) {
		
		this.setTransitionElement(parentView.content);

		parentView.content.addClass('transition-slide');
		parentView.content.addClass('transition-slide-enter');
		viewToShow.addClass('transition-slide-view-to-show');

		if (firstViewIn) {
			viewToShow.addClass('transition-slide-view-to-show-first');
		} else {
			viewToHide.addClass('transition-slide-view-to-hide');
		}

		this.start(function() {
			parentView.content.removeClass('transition-slide');
			parentView.content.removeClass('transition-slide-enter');
			viewToShow.removeClass('transition-slide-view-to-show');
			viewToShow.removeClass('transition-slide-view-to-show-first');
			if (firstViewIn == false) {
				viewToHide.removeClass('transition-slide-view-to-hide');
			}
		});

		return this;
	},

	leave: function(viewToShow, viewToHide, parentView) {
		
		var wrapper = parentView.content;
		
		this.setTransitionElement(wrapper);

		wrapper.addClass('transition-slide');
		wrapper.addClass('transition-slide-leave');
		viewToShow.addClass('transition-slide-view-to-show');
		viewToHide.addClass('transition-slide-view-to-hide');

		this.start(function() {
			wrapper.removeClass('transition-slide');
			wrapper.removeClass('transition-slide-leave');
			viewToShow.removeClass('transition-slide-view-to-show');
			viewToHide.removeClass('transition-slide-view-to-hide');
		});

		return this;
	}

});

/*
---

name: ViewTransition.Cubic

description: Provide a cubic view controller transition effect.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewTransition

provides:
	- ViewTransition.Cubic

...
*/

Moobile.ViewTransition.Cubic = new Class({

	/**
	 * Unfortunately, this transition cannot be handled only with css, 
	 * because translateZ does not handle percentage, and it's quite
	 * comprehensible.
	 */

	Extends: Moobile.ViewTransition,

	mode: null,

	size: null,

	content: null,
	
	enter: function(viewToShow, viewToHide, parentView, firstViewIn) {
	
		this.mode = 'enter';
		this.size = parentView.getSize();
		
		this.content = parentView.content;
	
		this.setTransitionElement(parentView.content);

		parentView.addClass('transition-cubic-viewport');
		parentView.content.addClass('transition-cubic');
		parentView.content.addClass('transition-cubic-enter');
		parentView.content.setStyle('-webkit-transform', 'translateZ(-' + this.size.x / 2 + 'px)');

		viewToShow.addClass('transition-cubic-view-to-show');
		viewToShow.setStyle('-webkit-transform', 'rotateY(90deg) translateX(-' + this.size.x + 'px) translateZ(' + this.size.x / 2 + 'px)');

		if (firstViewIn) {
			viewToShow.setStyle('-webkit-transform', 'rotateY(90deg) translateZ(' + this.size.x / 2 + 'px)');
		} else {
			viewToHide.addClass('transition-cubic-view-to-hide');
			viewToHide.setStyle('-webkit-transform', 'rotateY(0deg)  translateZ(' + this.size.x / 2 + 'px)');
			viewToShow.setStyle('-webkit-transform', 'rotateY(90deg) translateZ(' + this.size.x / 2 + 'px) translateY(-' + this.size.y + 'px)');			
		}
			
		this.start(function() {
			
			parentView.removeClass('transition-cubic-viewport');				
			parentView.content.removeClass('transition-cubic');
			parentView.content.removeClass('transition-cubic-enter');
			parentView.content.removeStyle('-webkit-transform');
			
			viewToShow.removeClass('transition-cubic-view-to-show');
			viewToShow.removeStyle('-webkit-transform');
			
			if (firstViewIn == false) {
				viewToHide.removeClass('transition-cubic-view-to-hide');
				viewToHide.removeStyle('-webkit-transform', null);
			}
			
		});

		return this;
	},

	leave: function(viewToShow, viewToHide, parentView) {

		this.mode = 'leave';
		this.size = parentView.getSize();
		
		this.content = parentView.content;

		this.setTransitionElement(parentView.content);

		parentView.addClass('transition-cubic-viewport');
		parentView.content.addClass('transition-cubic');
		parentView.content.addClass('transition-cubic-leave');
		parentView.content.setStyle('-webkit-transform', 'translateZ(-' + this.size.x / 2 + 'px)');
		
		viewToHide.addClass('transition-cubic-view-to-hide');
		viewToHide.setStyle('-webkit-transform', 'rotateY(0deg) translateZ(' + this.size.x / 2 + 'px) translateY(-' + this.size.y + 'px)');
				
		viewToShow.addClass('transition-cubic-view-to-show');
		viewToShow.setStyle('-webkit-transform', 'rotateY(-90deg) translateZ(' + this.size.x / 2 + 'px)');

		this.start(function() {
			
			parentView.removeClass('transition-cubic-viewport');
			parentView.content.removeClass('transition-cubic');
			parentView.content.removeClass('transition-cubic-leave');
			parentView.content.removeStyle('-webkit-transform');
			
			viewToHide.removeClass('transition-cubic-view-to-hide');
			viewToHide.removeStyle('-webkit-transform');
			
			viewToShow.removeClass('transition-cubic-view-to-show');			
			viewToShow.removeStyle('-webkit-transform');
		});

		return this;
	},

	play: function() {
	
		switch (this.mode) {
			case 'enter': this.content.setStyle('-webkit-transform', 'translateZ(-' + this.size.x / 2 + 'px) rotateY(-90deg)'); break;
			case 'leave': this.content.setStyle('-webkit-transform', 'translateZ(-' + this.size.x / 2 + 'px) rotateY(90deg)'); break;
		}
		
		return this.parent();
	}	

});


/*
---

name: ViewTransition.Fade

description: Provide a fade-in fade-out view controller transition effect.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewTransition

provides:
	- ViewTransition.Fade

...
*/

Moobile.ViewTransition.Fade = new Class({

	Extends: Moobile.ViewTransition,

	enter: function(viewToShow, viewToHide, parentView, firstViewIn) {

		this.setTransitionElement(parentView.content);

		this.addAcceptedTarget(viewToShow);

		parentView.content.addClass('transition-fade');
		parentView.content.addClass('transition-fade-enter');

		if (firstViewIn) {

			viewToShow.addClass('transition-fade-view-to-show-first');

			this.start(function() {
				parentView.content.removeClass('transition-fade');
				parentView.content.removeClass('transition-fade-enter');
				viewToShow.removeClass('transition-fade-view-to-show-first');
			});

		} else {

			viewToHide.addClass('transition-fade-view-to-hide');
			viewToShow.addClass('transition-fade-view-to-show');

			this.start(function() {
				parentView.content.removeClass('transition-fade');
				parentView.content.removeClass('transition-fade-enter');
				viewToHide.removeClass('transition-fade-view-to-hide');
				viewToShow.removeClass('transition-fade-view-to-show');
			});
		}

		return this;
	},

	leave: function(viewToShow, viewToHide, parentView) {

		this.setTransitionElement(parentView.content);

		this.addAcceptedTarget(viewToHide);

		parentView.content.addClass('transition-fade');
		parentView.content.addClass('transition-fade-leave');
		viewToHide.addClass('transition-fade-view-to-hide');
		viewToShow.addClass('transition-fade-view-to-show');

		this.start(function() {
			parentView.content.removeClass('transition-fade');
			parentView.content.removeClass('transition-fade-leave');
			viewToHide.removeClass('transition-fade-view-to-hide');
			viewToShow.removeClass('transition-fade-view-to-show');
		});

		return this;
	}

});


/*
---

name: ViewController

description: Provides a way to handle the different states and events of a view.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Core/Class
	- Core/Class.Extras
	- Core/Event
	- Core/Element
	- Core/Element.Event
	- Class-Extras/Class.Binds
	- Event.Loaded

provides:
	- ViewController

...
*/

if (!window.Moobile) window.Moobile = {};

Moobile.ViewController = new Class({

	Implements: [
		Events,
		Options,
		Class.Binds
	],

	name: null,

	window: null,

	view: null,

	viewTransition: null,

	viewControllerStack: null,

	viewControllerPanel: null,

	viewRequest: null,

	viewLoaded: false,

	parentViewController: null,

	navigationBar: null,

	started: false,

	initialize: function(viewSource) {

		var viewElement = document.id(viewSource);
		if (viewElement) {
			this.loadViewFromElement(viewElement);
			return this;
		}

		this.loadViewFromUrl(viewSource);

		return this;
	},

	loadViewFromElement: function(viewElement) {
		this.loadView(viewElement);
		this.viewLoaded = true;
		this.fireEvent('loaded');
		return this;
	},

	loadViewFromUrl: function(viewUrl) {

		if (this.viewRequest == null) {
			this.viewRequest = new Moobile.Request.View()
		}

		this.viewRequest.cancel();
		this.viewRequest.load(viewUrl, this.bound('loadViewFromElement'));

		return this;
	},

	loadView: function(viewElement) {
		this.view = Class.instanciate(
			viewElement.get('data-view') || 'Moobile.View',
			viewElement
		);
		return this;
	},

	attachEvents: function() {
  		return this;
	},

	detachEvents: function() {
		return this;
	},

	startup: function() {
		if (this.started == false) {
			this.started = true;
			this.window = this.view.window;
			this.init();
			this.attachEvents();
		}
		return this;
	},

	destroy: function() {
		this.started = false;
		this.detachEvents();
		this.release();
		this.window = null;
		this.view.destroy();
		this.view = null;
		this.viewTransition = null;
		this.viewControllerStack = null;
		this.viewControllerPanel = null;
		this.parentViewController = null;
		this.navigationBar = null;
		return this;
	},

	isStarted: function() {
		return this.started;
	},

	isViewLoaded: function() {
		return this.viewLoaded;
	},

	init: function() {
		return this;
	},

	release: function() {
		return this;
	},

	getTitle: function() {
		return this.view.getTitle();
	},

	viewWillEnter: function() {
		return this;
	},

	viewDidEnter: function() {
		return this;
	},

	viewWillLeave: function() {
		return this;
	},

	viewDidLeave: function() {
		return this;
	}

});

/*
---

name: ViewControllerCollection

description: This is the base class for controllers that contains child view
             controllers.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewController

provides:
	- ViewControllerCollection

...
*/

Moobile.ViewControllerCollection = new Class({

	Extends: Moobile.ViewController,

	viewControllers: [],

	init: function() {
		this.parent();
		this.attachViewControllers();
		return this;
	},

	release: function() {
		this.destroyViewControllers();
		this.parent();
		return this;
	},

	addViewController: function(viewController, where, context) {

		if (viewController.isViewLoaded() == false) {
			viewController.addEvent('loaded', function() {
				this.addViewController(viewController, where, context);
			}.bind(this));
			return this;
		}

		this.viewControllers.push(viewController);

		this.willAddViewController(viewController);
		this.view.addChildView(viewController.view, where, context);
		viewController.viewControllerStack = this.viewControllerStack;
		viewController.viewControllerPanel = this.viewControllerPanel;
		viewController.parentViewController = this;
		this.didAddViewController(viewController);

		viewController.startup();

		Object.defineMember(this, viewController, viewController.name);

		return this;
	},

	getViewController: function(name) {
		return this.viewControllers.find(function(viewController) {
			return viewController.view.getProperty('data-view-controller-name') == name;
		});
	},

	getViewControllers: function() {
		return this.viewControllers;
	},

	getLength: function() {
		return this.viewControllers.length;
	},

	removeViewController: function(viewController) {
		var removed = this.viewControllers.erase(viewController);
		if (removed) {
			this.willRemoveViewController(viewController);
			viewController.view.removeFromParentView();
			this.didRemoveViewController(viewController);
		}
		return this;
	},

	attachViewControllers: function() {
		var filter = this.bound('filterViewController');
		var attach = this.bound('attachViewController');
		this.view.getElements('[data-role=view-controller]').filter(filter).each(attach);
		return this;
	},

	attachViewController: function(element) {
		var viewControllerClass = element.get('data-view-controller');
		if (viewControllerClass) {

			var viewElement = element.getElement('[data-role=view]');
			if (viewElement == null) {
				throw new Error('You must define a view element under view-controller element');
			}

			var viewController = Class.instanciate(viewControllerClass, viewElement);
			viewController.name = element.get('data-name');
			this.addViewController(viewController);

			element.grab(viewElement, 'before').destroy();
		}
		return this;
	},

	filterViewController: function(element) {
		return element.getParent('[data-role=view-controller]') == this.view.element;
	},

	destroyViewControllers: function() {
		this.viewControllers.each(this.bound('destroyViewController'));
		this.viewControllers = [];
		return this;
	},

	destroyViewController: function(viewController) {
		viewController.destroy();
		viewController = null;
		return this;
	},

	willAddViewController: function(viewController) {
		return this;
	},

	didAddViewController: function(viewController) {
		return this;
	},

	willRemoveViewController: function(viewController) {
		return this;
	},

	didRemoveViewController: function(viewController) {
		return this;
	}

});

/*
---

name: ViewControllerStack

description: Provides a way to navigate from view to view and comming back.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Request.ViewController
	- ViewControllerCollection

provides:
	- ViewControllerStack

...
*/

Moobile.ViewControllerStack = new Class({

	Extends: Moobile.ViewControllerCollection,

	viewControllerRequest: null,

	loadView: function(element) {
		this.view = new Moobile.ViewStack(element);
		return this;
	},

	pushViewController: function(viewController, viewTransition) {

		this.window.disableInput();

		if (viewController.isViewLoaded() == false) {
			viewController.addEvent('loaded', function() {
				this.pushViewController(viewController, viewTransition);
			}.bind(this));
			return this;
		}

		var viewControllerPushed = viewController; // ease of understanding

		var viewControllerExists = this.viewControllers.contains(viewControllerPushed);
		if (viewControllerExists == false) {
			viewControllerPushed.viewControllerStack = this;
			viewControllerPushed.viewControllerPanel = this.viewControllerPanel;
		} else {
			this.viewControllers.erase(viewControllerPushed);
		}

		this.willPushViewController(viewControllerPushed);

		this.addViewController(viewControllerPushed);
		viewControllerPushed.view.show();
		viewControllerPushed.viewWillEnter();

		var viewControllerBefore = this.viewControllers.lastItemAt(1);
		if (viewControllerBefore) {
			viewControllerBefore.viewWillLeave();
		}

		var viewToShow = viewControllerPushed.view;
		var viewToHide = viewControllerBefore ? viewControllerBefore.view : null;

		viewTransition = viewTransition || new Moobile.ViewTransition.Slide();
		viewTransition.addEvent('complete:once', this.bound('onPushTransitionCompleted'));
		viewTransition.enter(
			viewToShow,
			viewToHide,
			this.view,
			this.viewControllers.length == 1
		);

		viewControllerPushed.viewTransition = viewTransition;

		return this;
	},

	onPushTransitionCompleted: function() {

		var viewControllerPushed = this.viewControllers.lastItemAt(0);
		var viewControllerBefore = this.viewControllers.lastItemAt(1);
		if (viewControllerBefore) {
			viewControllerBefore.viewDidLeave();
			viewControllerBefore.view.hide();
		}

		this.didPushViewController(viewControllerPushed);

		viewControllerPushed.viewDidEnter();

		this.window.enableInput();

		return this;
	},

	popViewControllerUntil: function(viewController) {

		if (this.viewControllers.length <= 1)
			return this;

		var viewControllerIndex = this.viewControllers.indexOf(viewController);
		if (viewControllerIndex > -1) {
			for (var i = this.viewControllers.length - 2; i > viewControllerIndex; i--) {

				var viewControllerToRemove = this.viewControllers[i];
				viewControllerToRemove.viewWillLeave();
				viewControllerToRemove.viewDidLeave();
				this.removeViewController(viewControllerToRemove);

				viewControllerToRemove.destroy();
				viewControllerToRemove = null;
			}
		}

		this.popViewController();

		return this;
	},

	popViewController: function() {

		if (this.viewControllers.length <= 1)
			return this;

		this.window.disableInput();

		var viewControllerPopped = this.viewControllers.lastItemAt(0);
		var viewControllerBefore = this.viewControllers.lastItemAt(1);

		this.willPopViewController(viewControllerPopped);

		viewControllerPopped.viewWillLeave();
		viewControllerBefore.viewWillEnter();
		viewControllerBefore.view.show();

		var viewTransition = viewControllerPopped.viewTransition;
		viewTransition.addEvent('complete:once', this.bound('onPopTransitionCompleted'));
		viewTransition.leave(
			viewControllerBefore.view,
			viewControllerPopped.view,
			this.view
		);

		return this;
	},

	onPopTransitionCompleted: function() {

		var viewControllerPopped = this.viewControllers.lastItemAt(0);
		var viewControllerBefore = this.viewControllers.lastItemAt(1);
		viewControllerBefore.viewDidEnter();
		viewControllerPopped.viewDidLeave();

		this.removeViewController(viewControllerPopped);

		this.didPopViewController(viewControllerPopped);

		viewControllerPopped.destroy();
		viewControllerPopped = null;

		this.window.enableInput();

		return this;
	},

	didAddViewController: function(viewController) {
		viewController.viewControllerStack = this;
		this.parent();
		return this;
	},

	willPushViewController: function(viewController) {
		return this;
	},

	didPushViewController: function(viewController) {
		return this;
	},

	willPopViewController: function(viewController) {
		return this;
	},

	didPopViewController: function(viewController) {
		return this;
	}
});

/*
---

name: ViewControllerStack.Navigation

description: Provide navigation function to the view controller stack such as
             a navigation bar and navigation bar buttons.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewControllerStack

provides:
	- ViewControllerStack.Navigation

...
*/

Moobile.ViewControllerStack.Navigation = new Class({

	Extends: Moobile.ViewControllerStack,

	didAddViewController: function(viewController) {

		this.parent(viewController);

		if (viewController.navigationBar)
			return this;

		var navigationBar = new Moobile.UI.Bar.Navigation();
		var navigationItem = new Moobile.UI.Bar.NavigationItem();
		navigationBar.setNavigationItem(navigationItem);

		if (this.viewControllers.length > 1) {

			var text = this.viewControllers.lastItemAt(1).getTitle() || 'Back';

			var backBarButton = new Moobile.UI.BarButton();
			backBarButton.setStyle(Moobile.UI.BarButtonStyle.Back);
			backBarButton.setText(text);
			backBarButton.addEvent('click', this.bound('onBackButtonClick'));

			navigationItem.setLeftBarButton(backBarButton);
		}

		navigationItem.setTitle(viewController.getTitle());

		viewController.view.addChildControl(navigationBar, 'header');

		viewController.navigationBar = navigationBar;

		return this;
	},

	onBackButtonClick: function() {
		this.popViewController();
	}

});

/*
---

name: ViewControllerPanel

description: Provide a way to have side by side view controllers.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewControllerCollection

provides:
	- ViewControllerPanel

...
*/

Moobile.ViewControllerPanel = new Class({

	Extends: Moobile.ViewControllerCollection,

	didAddViewController: function(viewController) {
		viewController.viewControllerPanel = this;
		this.parent();
		return this;
	}
});

/*
---

name: Window

description: Provides the area where the views will be stored and displayed.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- View

provides:
	- Window

...
*/

Moobile.Window = new Class({

	Extends: Moobile.View,

	inputEnabled: true,

	userInputMask: null,

	options: {
		className: 'window'
	},

	filterChildView: function(element) {
		return element.getParent('[data-role=view]') == null;
	},

	getOrientation: function() {
		var o = Math.abs(window.orientation);
		switch (o) {
			case  0: return 'portrait';
			case 90: return 'landscape';
		}
	},

	enableInput: function() {
		if (this.inputEnabled == false) {
			this.inputEnabled = true;
			this.hideMask();
		}
		return this;
	},

	disableInput: function() {
		if (this.inputEnabled == true) {
			this.inputEnabled = false;
			this.showMask();
		}
	},

	isinputEnabled: function() {
		return this.inputEnabled;
	},

	showMask: function() {
		this.userInputMask = new Element('div.' + this.options.className + '-mask');
		this.userInputMask.inject(this.element);
		return this;
	},

	hideMask: function() {
		this.userInputMask.destroy();
		this.userInputMask = null;
		return this;
	},

	didAddChildView: function(view) {
		view.window = this;
		view.parentView = null;
		this.parent(view);
		return this;
	}

});

/*
---

name: WindowController

description: Provides the starting poing view controller inside the window.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewControllerCollection

provides:
	- WindowController

...
*/

Moobile.WindowController = new Class({

	Extends: Moobile.ViewControllerCollection,

	rootViewController: null,

	initialize: function(viewElement) {
		this.loadView(viewElement);
		this.startup();
		return this;
	},

	startup: function() {
		this.parent();
		this.window = this.view;
		return this;
	},

	loadView: function(viewElement) {
		this.view = new Moobile.Window(viewElement);
		return this;
	},

	filterViewController: function(element) {
		return element.getParent('[data-role=view-controller]') == null;
	},

	setRootViewController: function(rootViewController) {

		if (this.rootViewController) {
			this.viewController.removeViewController(this.rootViewController);
			this.rootViewController.view.destroy();
			this.rootViewController.view = null;
			this.rootViewController.destroy();
			this.rootViewController = null;
		}

		this.viewController.addViewController(rootViewController);

		this.rootViewController = rootViewController;

		return this;
	},

	getRootViewController: function() {
		return this.rootViewController;
	},

	didAddViewController: function(viewController) {
		this.rootViewController = viewController;
		this.parent(viewController);
		return this;
	}

});

/*
---

name: Mouse

description: Maps mouse events to their touch counterparts

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Custom-Event/Element.defineCustomEvent, Browser.Features.Touch]

provides: Mouse

...
*/

if (!Browser.Features.Touch) (function(){

var condition = function(event){
	event.targetTouches = [];
	event.changedTouches = event.touches = [{
		pageX: event.page.x, pageY: event.page.y,
		clientX: event.client.x, clientY: event.client.y
	}];

	return true;
};

Element.defineCustomEvent('touchstart', {

	base: 'mousedown',

	condition: condition

}).defineCustomEvent('touchmove', {

	base: 'mousemove',

	condition: condition

}).defineCustomEvent('touchend', {

	base: 'mouseup',

	condition: condition

});

})();


/*
---

name: Pinch

description: Provides a custom pinch event for touch devices

authors: Christopher Beloch (@C_BHole), Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Element.Event, Custom-Event/Element.defineCustomEvent, Browser.Features.Touch]

provides: Pinch

...
*/

if (Browser.Features.Touch) (function(){

var name = 'pinch',
	thresholdKey = name + ':threshold',
	disabled, active;

var events = {

	touchstart: function(event){
		if (event.targetTouches.length == 2) active = true;
	},

	touchmove: function(event){
		event.preventDefault();

		if (disabled || !active) return;

		var threshold = this.retrieve(thresholdKey, 0.5);
		if (event.scale < (1 + threshold) && event.scale > (1 - threshold)) return;

		active = false;
		event.pinch = (event.scale > 1) ? 'in' : 'out';
		this.fireEvent(name, event);
	}

};

Element.defineCustomEvent(name, {

	onSetup: function(){
		this.addEvents(events);
	},

	onTeardown: function(){
		this.removeEvents(events);
	},

	onEnable: function(){
		disabled = false;
	},

	onDisable: function(){
		disabled = true;
	}

});

})();


/*
---

name: Swipe

description: Provides a custom swipe event for touch devices

authors: Christopher Beloch (@C_BHole), Christoph Pojer (@cpojer), Ian Collins (@3n)

license: MIT-style license.

requires: [Core/Element.Event, Custom-Event/Element.defineCustomEvent, Browser.Features.Touch]

provides: Swipe

...
*/

(function(){

var name = 'swipe',
	distanceKey = name + ':distance',
	cancelKey = name + ':cancelVertical',
	dflt = 50;

var start = {}, disabled, active;

var clean = function(){
	active = false;
};

var events = {

	touchstart: function(event){
		if (event.touches.length > 1) return;

		var touch = event.touches[0];
		active = true;
		start = {x: touch.pageX, y: touch.pageY};
	},
	
	touchmove: function(event){
		event.preventDefault();
		if (disabled || !active) return;
		
		var touch = event.changedTouches[0];
		var end = {x: touch.pageX, y: touch.pageY};
		if (this.retrieve(cancelKey) && Math.abs(start.y - end.y) > Math.abs(start.x - end.x)){
			active = false;
			return;
		}
		
		var distance = this.retrieve(distanceKey, dflt),
			diff = end.x - start.x,
			isLeftSwipe = diff < -distance,
			isRightSwipe = diff > distance;

		if (!isRightSwipe && !isLeftSwipe)
			return;
		
		active = false;
		event.direction = (isLeftSwipe ? 'left' : 'right');
		event.start = start;
		event.end = end;
		
		this.fireEvent(name, event);
	},

	touchend: clean,
	touchcancel: clean

};

Element.defineCustomEvent(name, {

	onSetup: function(){
		this.addEvents(events);
	},

	onTeardown: function(){
		this.removeEvents(events);
	},

	onEnable: function(){
		disabled = false;
	},

	onDisable: function(){
		disabled = true;
		clean();
	}

});

})();


/*
---

name: Touchhold

description: Provides a custom touchhold event for touch devices

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Element.Event, Custom-Event/Element.defineCustomEvent, Browser.Features.Touch]

provides: Touchhold

...
*/

(function(){

var name = 'touchhold',
	delayKey = name + ':delay',
	disabled, timer;

var clear = function(e){
	clearTimeout(timer);
};

var events = {

	touchstart: function(event){
		if (event.touches.length > 1){
			clear();
			return;
		}
		
		timer = (function(){
			this.fireEvent(name, event);
		}).delay(this.retrieve(delayKey) || 750, this);
	},

	touchmove: clear,
	touchcancel: clear,
	touchend: clear

};

Element.defineCustomEvent(name, {

	onSetup: function(){
		this.addEvents(events);
	},

	onTeardown: function(){
		this.removeEvents(events);
	},

	onEnable: function(){
		disabled = false;
	},

	onDisable: function(){
		disabled = true;
		clear();
	}

});

})();


/*
---

name: Class.Instantiate

description: Simple Wrapper for Mass-Class-Instantiation

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Class]

provides: Class.Instantiate

...
*/

Class.Instantiate = function(klass, options){
	var create = function(object){
		if (object.getInstanceOf && object.getInstanceOf(klass)) return;
		new klass(object, options);
	};
	
	return function(objects){
		objects.each(create);
	};
};

/*
---

name: Class.Singleton

description: Beautiful Singleton Implementation that is per-context or per-object/element

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Class]

provides: Class.Singleton

...
*/

(function(){

var storage = {

	storage: {},

	store: function(key, value){
		this.storage[key] = value;
	},

	retrieve: function(key){
		return this.storage[key] || null;
	}

};

Class.Singleton = function(){
	this.$className = String.uniqueID();
};

Class.Singleton.prototype.check = function(item){
	if (!item) item = storage;

	var instance = item.retrieve('single:' + this.$className);
	if (!instance) item.store('single:' + this.$className, this);
	
	return instance;
};

var gIO = function(klass){

	var name = klass.prototype.$className;

	return name ? this.retrieve('single:' + name) : null;

};

if (('Element' in this) && Element.implement) Element.implement({getInstanceOf: gIO});

Class.getInstanceOf = gIO.bind(storage);

}).call(this);
