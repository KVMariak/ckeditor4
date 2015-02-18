/*
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

'use strict';

CKEDITOR.plugins.add( 'notification', {
	lang: 'en', // %REMOVE_LINE_CORE%

	init: function( editor ) {
		editor._.notificationArea = new Area( editor );

		/**
		 * Creates and shows a new notification. By default the notification is shown over the editors contents, in the
		 * viewport if it is possible.
		 *
		 * See {@link CKEDITOR.plugins.notification}.
		 *
		 * @since 4.5
		 * @member CKEDITOR.editor
		 * @param {String} message Message displayed on the notification.
		 * @param {String} [type='info'] Type of the notification. Can be `'info'`, `'warning'`, `'success'` or `'progress'`.
		 * @param {Number} [progressOrDuration] If the type is `progress` the third parameter may be a progress from `0` to `1`
		 * (defaults to `0`). Otherwise the the third parameter may be a notification duration: after how many milliseconds
		 * notification should be closed automatically. `0` means that notification will not be closed automatically, user
		 * needs to close it manually. See {@link CKEDITOR.plugins.notification#duration}.
		 * Note that `warning` notifications will not be closed automatically.
		 * @returns {CKEDITOR.plugins.notification} Created and shown notification.
		 */
		editor.showNotification = function( message, type, progressOrDuration ) {
			var progress, duration;

			if ( type == 'progress' ) {
				progress = progressOrDuration;
			} else {
				duration = progressOrDuration;
			}

			var notification = new CKEDITOR.plugins.notification( editor, {
				message: message,
				type: type,
				progress: progress,
				duration: duration
			} );

			notification.show();

			return notification;
		};

		// Close the last notification on ESC.
		editor.on( 'key', function( evt ) {
			if ( evt.data.keyCode == 27 ) { /* ESC */
				var notifications = editor._.notificationArea.notifications;

				if ( !notifications.length ) {
					return;
				}

				// As long as this is not a common practice to inform screen-reader users about actions, in this case
				// this is the best solution (unfortunately there is no standard for accessibility for notifications).
				// Notification has an `alert` aria role what means that it does not get a focus nor is needed to be
				// closed (unlike `alertdialog`). However notification will capture ESC key so we need to inform user
				// why it does not do other actions.
				say( editor.lang.notification.closed );

				// Hide last.
				notifications[ notifications.length - 1 ].hide();

				evt.cancel();
			}
		} );

		// Send the message to the screen readers.
		function say( text ) {
			var message = new CKEDITOR.dom.element( 'div' );
			message.setStyles( {
				position: 'fixed',
				'margin-left': '-9999px'
			} );
			message.setAttributes( {
				'aria-live': 'assertive',
				'aria-atomic': 'true'
			} );
			message.setText( text );

			CKEDITOR.document.getBody().append( message );

			setTimeout( function() {
				message.remove();
			}, 100 );
		}
	}
} );

/**
 * Notification class. Notifications are used to show user short messages. They might be used to show result of
 * asynchronous actions or informations about changes in the editors content. They should be used instead of
 * alert dialogs. They should **not** be used if user response is required, nor with dialogs (e.g. dialog validation).
 *
 * There are four types of notifications, see the {@link #type} property.
 *
 * Note that the notification constructor only creates a notification instance. To show it use the {@link #show} method:
 *
 *		var notification = new CKEDITOR.plugins.notification( editor, { message: 'Foo' } );
 *		notification.show();
 *
 * You can also use the {@link CKEDITOR.editor#showNotification} method:
 *
 *		editor.showNotification( 'Foo' );
 *
 * All of the notification actions ({@link #show}, {@link #update} and {@link #hide}) fire cancelable events
 * on the related {@link CKEDITOR.editor} instance so you can integrate editor notifications with your website notifications.
 *
 * @since 4.5
 * @class CKEDITOR.plugins.notification
 * @constructor Create a notification object. Call {@link #show} to show created notification.
 * @param {CKEDITOR.editor} editor The editor instance.
 * @param {Object} options
 * @param {String} options.message Message displayed on the notification.
 * @param {String} [options.type='info'] Type of the notification, see {@link #type}.
 * @param {Number} [options.progress=0] If the type is `progress` this may be a progress from 0 to 1.
 * @param {Number} [options.duration] How long notification will be visible, see {@link #duration}.
 */
function Notification( editor, options ) {
	CKEDITOR.tools.extend( this, options, {
		editor: editor,
		id: 'cke-' + CKEDITOR.tools.getUniqueId(),
		area: editor._.notificationArea
	} );

	if ( !options.type ) {
		this.type = 'info';
	}

	this.element = this._createElement();
}

/**
 * The editor instance.
 *
 * @readonly
 * @property {CKEDITOR.editor} editor
 */

/**
 * Message displayed on the notification.
 *
 * @readonly
 * @property {String} message
 */

/**
 * Notification type. There are four types:
 *
 * * `info` (default) &ndash; Information for the user (e.g. "File is uploading.", "ACF modified content."),
 * * `warning` &ndash; Warning or error messages (e.g. "This type of files is not supported.",
 * "You cannot paste script."),
 * * `success` &ndash; Information that an operation finished successfully (e.g. "File uploaded.", "Data imported.").
 * * `progress` &ndash; Shows user a progress of the operation. When operations is done the type of the notification
 * should be changed to `success`.
 *
 * @readonly
 * @property {String} type
 */

/**
 * If the {@link #type} is `'progress'` this is the progress from `0` to `1`.
 *
 * @readonly
 * @property {Number} progress
 */

/**
 * Notification duration. Determines after how many milliseconds notification should be closed automatically.
 * 0 means that notification will not be closed automatically, user needs to close it manually.
 * By default it is 0 for `warning` and `progress`. For `info` and `success` value it is the of
 * {@link CKEDITOR.config#notification_duration notification_duration} configuration option or 5000 if not set.
 *
 * @readonly
 * @property {Number} duration
 */

/**
 * Notification unique id.
 *
 * @readonly
 * @property {Number} id
 */

/**
 * Notification DOM element. There is one element per notification. It is created when the notification is created,
 * even if it is not shown. If notification is hidden element is detached from document but not deleted. It will be reused if
 * notification will be shown again.
 *
 * @readonly
 * @property {CKEDITOR.dom.element} element
 */

/**
 * {@link CKEDITOR.plugins.notification.area Notifications area} reference.
 *
 * @readonly
 * @property {CKEDITOR.plugins.notification.area} area
 */

Notification.prototype = {
	/**
	 * Adds notification element to the notification area. Notification will be hidden automatically if {@link #duration}
	 * was set.
	 *
	 * Fires the {@link CKEDITOR.editor#notificationShow} event.
	 */
	show: function() {
		if ( this.editor.fire( 'notificationShow', { notification: this } ) === false ) {
			return;
		}

		this.area.add( this );

		this._hideAfterTimeout();
	},

	/**
	 * Updates notification object and element.
	 *
	 * Fires the {@link CKEDITOR.editor#notificationUpdate} event.
	 *
	 * @param {Object} options
	 * @param {String} [options.message] {@link #message}
	 * @param {String} [options.type] {@link #type}
	 * @param {Number} [options.progress] {@link #progress}
	 * @param {Number} [options.duration] {@link #duration}
	 * @param {Boolean} [options.important=false] If update is important, notification will be shown
	 * if it was hidden and read by screen readers.
	 */
	update: function( options ) {
		var show = true;

		if ( this.editor.fire( 'notificationUpdate', { notification: this, options: options } ) === false ) {
			// The idea of cancelable event is to let user create his own way of displaying notification, so if
			// `notificationUpdate` event will be canceled there will be no interaction with notification area, but on
			// the other hand the logic should work anyway so object will be updated (including `element` property).
			show = false;
		}

		var element = this.element,
			messageElement = element.findOne( '.cke_notification_message' ),
			progressElement = element.findOne( '.cke_notification_progress' );

		element.removeAttribute( 'role' );

		if ( options.type ) {
			element.removeClass( this._getClass() );
			element.removeAttribute( 'aria-label' );

			this.type = options.type;

			element.addClass( this._getClass() );
			element.setAttribute( 'aria-label', this.type );

			if ( this.type == 'progress' && !progressElement ) {
				progressElement = this._createProgressElement();
				progressElement.insertBefore( messageElement );
			} else if ( this.type != 'progress' && progressElement ) {
				progressElement.remove();
			}
		}

		if ( options.message !== undefined ) {
			this.message = options.message;
			messageElement.setHtml( this.message );
		}

		if ( options.progress !== undefined ) {
			this.progress = options.progress;

			if ( progressElement ) {
				progressElement.setStyle( 'width', this._getPercentageProgress() );
			}
		}

		if ( show && options.important ) {
			element.setAttribute( 'role', 'alert' );

			if ( !this.isVisible() ) {
				this.area.add( this );
			}
		}

		// Overwrite even if it is undefined.
		this.duration = options.duration;

		this._hideAfterTimeout();
	},

	/**
	 * Removes notification element from the notification area.
	 *
	 * Fires the {@link CKEDITOR.editor#notificationHide} event.
	 */
	hide: function() {
		if ( this.editor.fire( 'notificationHide', { notification: this } ) === false ) {
			return;
		}

		this.area.remove( this );
	},

	/**
	 * Returns `true` if the notification is in the notification area.
	 *
	 * @returns {Boolean} `true` if notification is in the notification area.
	 */
	isVisible: function() {
		return CKEDITOR.tools.indexOf( this.area.notifications, this ) >= 0;
	},

	/**
	 * Creates notification DOM element.
	 *
	 * @private
	 * @returns {CKEDITOR.dom.element} Notification DOM element.
	 */
	_createElement: function() {
		var notification = this,
			notificationElement, notificationMessageElement, notificationCloseElement,
			close = this.editor.lang.common.close;

		notificationElement = new CKEDITOR.dom.element( 'div' );
		notificationElement.addClass( 'cke_notification' );
		notificationElement.addClass( this._getClass() );
		notificationElement.setAttributes( {
			id: this.id,
			role: 'alert',
			'aria-label': this.type
		} );

		if ( this.type == 'progress' )
			notificationElement.append( this._createProgressElement() );

		notificationMessageElement = new CKEDITOR.dom.element( 'p' );
		notificationMessageElement.addClass( 'cke_notification_message' );
		notificationMessageElement.setHtml( this.message );
		notificationElement.append( notificationMessageElement );

		notificationCloseElement = CKEDITOR.dom.element.createFromHtml(
			'<a class="cke_notification_close" href="javascript:void(0)" title="' + close + '" role="button" tabindex="-1">' +
				'<span class="cke_label">X</span>' +
			'</a>' );
		notificationElement.append( notificationCloseElement );

		notificationCloseElement.on( 'click', function() {
			notification.hide();
		} );

		return notificationElement;
	},

	/**
	 * Gets notification CSS class.
	 *
	 * @private
	 * @returns {String} Notification CSS class.
	 */
	_getClass: function() {
		return ( this.type == 'progress' ) ?
			'cke_notification_info' :
			( 'cke_notification_' + this.type );
	},

	/**
	 * Creates progress element for the notification element.
	 *
	 * @private
	 * @returns {CKEDITOR.dom.element} Progress element for the notification element.
	 */
	_createProgressElement: function() {
		var element = new CKEDITOR.dom.element( 'span' );
		element.addClass( 'cke_notification_progress' );
		element.setStyle( 'width', this._getPercentageProgress() );
		return element;
	},

	/**
	 * Gets progress as a percentage (ex. `0.3` -> `30%`).
	 *
	 * @private
	 * @returns {String} Progress as a percentage.
	 */
	_getPercentageProgress: function() {
		return Math.round( ( this.progress || 0 ) * 100 ) + '%';
	},

	/**
	 * Hides notification after the timeout.
	 *
	 * @private
	 */
	_hideAfterTimeout: function() {
		var notification = this,
			duration;

		if ( this._hideTimeoutId ) {
			clearTimeout( this._hideTimeoutId );
		}

		if ( typeof this.duration == 'number' ) {
			duration = this.duration;
		} else if ( this.type == 'info' || this.type == 'success' ) {
			duration = ( typeof this.editor.config.notification_duration == 'number' ) ?
				this.editor.config.notification_duration :
				5000;
		}

		if ( duration ) {
			notification._hideTimeoutId = setTimeout( function() {
				notification.hide();
			}, duration );
		}
	}
};

/**
 * Notification area sis an area where all notifications are put. Area is layout dynamically.
 * When the first notification is added area is shown and all listeners are added.
 * When the last notification is removed area is hidden and all listeners are removed.
 *
 * @since 4.5
 * @private
 * @class CKEDITOR.plugins.notification.area
 * @constructor
 * @param {CKEDITOR.editor} editor The editor instance.
 */
function Area( editor ) {
	var that = this;

	this.editor = editor;
	this.notifications = [];
	this.element = this._createElement();
	this._uiBuffer = CKEDITOR.tools.eventsBuffer( 10, this._layout, this );
	this._changeBuffer = CKEDITOR.tools.eventsBuffer( 500, this._layout, this );

	editor.on( 'destroy', function() {
		that._removeListeners();
		that.element.remove();
	} );
}

/**
 * The editor instance.
 *
 * @readonly
 * @property {CKEDITOR.editor} editor
 */

/**
 * Array of added notifications.
 *
 * @readonly
 * @property {Array} notifications
 */

/**
 * Notification area DOM element. This element is created when area object is created. It will be attached to the document
 * when the first notification is added and removed when the last notification is removed.
 *
 * @readonly
 * @property {CKEDITOR.dom.element} element
 */

/**
 * Width of the notification. Cached for the performance.
 *
 * @private
 * @property {CKEDITOR.dom.element} _notificationWidth
 */

/**
 * Margin of the notification. Cached for the performance.
 *
 * @private
 * @property {CKEDITOR.dom.element} _notificationMargin
 */

/**
 * Event buffer object for UI events to optimize performance.
 *
 * @private
 * @property {Object} _uiBuffer
 */

/**
 * Event buffer object for editor change events to optimize performance.
 *
 * @private
 * @property {Object} _changeBuffer
 */

Area.prototype = {
	/**
	 * Add the notification to the notification area. If it is the first notification then area will be also attached to
	 * the document and listers will be attached.
	 *
	 * Note that the proper way to show a notification is to call {@link CKEDITOR.plugins.notification#show} method.
	 *
	 * @param {CKEDITOR.plugins.notification} notification Notification to add.
	 */
	add: function( notification ) {
		this.notifications.push( notification );

		this.element.append( notification.element );

		if ( this.element.getChildCount() == 1 ) {
			CKEDITOR.document.getBody().append( this.element );
			this._attachListeners();
		}

		this._layout();
	},

	/**
	 * Removes the notification from the notification area. If it is the last notification then area will be also
	 * detached from the document and listers will be detached.
	 *
	 * Note that the proper way to hide a notification is to call {@link CKEDITOR.plugins.notification#hide} method.
	 *
	 * @param {CKEDITOR.plugins.notification} notification Notification to remove.
	 */
	remove: function( notification ) {
		var i = CKEDITOR.tools.indexOf( this.notifications, notification );

		if ( i < 0 ) {
			return;
		}

		this.notifications.splice( i, 1 );

		notification.element.remove();

		if ( !this.element.getChildCount() ) {
			this._removeListeners();
			this.element.remove();
		}
	},

	/**
	 * Creates the notification area element.
	 *
	 * @private
	 * @returns {CKEDITOR.dom.element} Notification area element.
	 */
	_createElement: function() {
		var editor = this.editor,
			config = editor.config,
			notificationArea = new CKEDITOR.dom.element( 'div' );

		notificationArea.addClass( 'cke_notifications_area' );
		notificationArea.setAttribute( 'id', 'cke_notifications_area_' + editor.name );
		notificationArea.setStyle( 'z-index', config.baseFloatZIndex - 2 );

		return notificationArea;
	},

	/**
	 * Attaches listeners to the notification area.
	 *
	 * @private
	 */
	_attachListeners: function() {
		var win = CKEDITOR.document.getWindow(),
			editor = this.editor;

		win.on( 'scroll', this._uiBuffer.input );
		win.on( 'resize', this._uiBuffer.input );
		editor.on( 'change', this._changeBuffer.input );
		editor.on( 'floatingSpaceLayout', this._layout, this, null, 20 );
		editor.on( 'blur', this._layout, this, null, 20 );
	},

	/**
	 * Detaches listeners from the notification area.
	 *
	 * @private
	 */
	_removeListeners: function() {
		var win = CKEDITOR.document.getWindow(),
			editor = this.editor;

		win.removeListener( 'scroll', this._uiBuffer.input );
		win.removeListener( 'resize', this._uiBuffer.input );
		editor.removeListener( 'change', this._changeBuffer.input );
		editor.removeListener( 'floatingSpaceLayout', this._layout );
		editor.removeListener( 'blur', this._layout );
	},

	/**
	 * Sets the position of the notification area based on the editor content, toolbar and viewport position and dimensions.
	 *
	 * @private
	 */
	_layout: function() {
		var area = this.element,
			editor = this.editor,
			contentsRect = editor.ui.contentsElement.getClientRect(),
			contentsPos = editor.ui.contentsElement.getDocumentPosition(),
			top = editor.ui.space( 'top' ),
			topRect = top.getClientRect(),
			areaRect = area.getClientRect(),
			notification,
			notificationWidth = this._notificationWidth,
			notificationMargin = this._notificationMargin,
			win = CKEDITOR.document.getWindow(),
			scrollPos = win.getScrollPosition(),
			viewRect = win.getViewPaneSize(),
			bodyPos = CKEDITOR.document.getBody().getDocumentPosition(),
			cssLength = CKEDITOR.tools.cssLength;

		// Cache for optimization
		if ( !notificationWidth || !notificationMargin ) {
			notification = this.element.getChild( 0 );
			notificationWidth = this._notificationWidth = notification.getClientRect().width;
			notificationMargin = this._notificationMargin =
				parseInt( notification.getComputedStyle( 'margin-left' ), 10 ) +
				parseInt( notification.getComputedStyle( 'margin-right' ), 10 );
		}

		// --------------------------------------- Horizontal layout ----------------------------------------

		// +---Viewport-------------------------------+          +---Viewport-------------------------------+
		// |                                          |          |                                          |
		// | +---Toolbar----------------------------+ |          | +---Content----------------------------+ |
		// | |                                      | |          | |                                      | |
		// | +---Content----------------------------+ |          | |                                      | |
		// | |                                      | |          | +---Toolbar----------------------+     | |
		// | |      +------Notification------+      | |          | |                                |     | |
		// | |                                      | |    OR    | +--------------------------------+     | |
		// | |                                      | |          | |                                      | |
		// | |                                      | |          | |      +------Notification------+      | |
		// | |                                      | |          | |                                      | |
		// | |                                      | |          | |                                      | |
		// | +--------------------------------------+ |          | +--------------------------------------+ |
		// +------------------------------------------+          +------------------------------------------+
		if ( top.isVisible() &&
			topRect.bottom > contentsRect.top &&
			topRect.bottom < contentsRect.bottom - areaRect.height ) {
			setBelowToolbar();

		// +---Viewport-------------------------------+
		// |                                          |
		// | +---Content----------------------------+ |
		// | |                                      | |
		// | |      +------Notification------+      | |
		// | |                                      | |
		// | |                                      | |
		// | |                                      | |
		// | +--------------------------------------+ |
		// |                                          |
		// +------------------------------------------+
		} else if ( contentsRect.top > 0 ) {
			setTopStandard();

		//   +---Content----------------------------+
		//   |                                      |
		// +---Viewport-------------------------------+
		// | |                                      | |
		// | |      +------Notification------+      | |
		// | |                                      | |
		// | |                                      | |
		// | |                                      | |
		// | +--------------------------------------+ |
		// |                                          |
		// +------------------------------------------+
		} else if ( contentsPos.y + contentsRect.height - areaRect.height > scrollPos.y ) {
			setTopFixed();

		//   +---Content----------------------------+              +---Content----------------------------+
		//   |                                      |              |                                      |
		//   |                                      |              |                                      |
		//   |                                      |              |      +------Notification------+      |
		//   |                                      |              |                                      |
		//   |                                      |      OR      +--------------------------------------+
		// +---Viewport-------------------------------+
		// | |      +------Notification------+      | |          +---Viewport-------------------------------+
		// | |                                      | |          |                                          |
		// | +--------------------------------------+ |          |                                          |
		// |                                          |          |                                          |
		// +------------------------------------------+          +------------------------------------------+
		} else {
			setBottom();
		}

		function setTopStandard() {
			area.setStyles( {
				position: 'absolute',
				top: cssLength( contentsPos.y )
			} );
		}

		function setBelowToolbar() {
			area.setStyles( {
				position: 'fixed',
				top: cssLength( topRect.bottom )
			} );
		}

		function setTopFixed() {
			area.setStyles( {
				position: 'fixed',
				top: 0
			} );
		}

		function setBottom() {
			area.setStyles( {
				position: 'absolute',
				top: cssLength( contentsPos.y + contentsRect.height - areaRect.height )
			} );
		}

		// ---------------------------------------- Vertical layout -----------------------------------------

		var leftBase = area.getStyle( 'position' ) == 'fixed' ? contentsRect.left : contentsPos.x - bodyPos.x;

		// Content is narrower than notification
		if ( contentsRect.width < notificationWidth + notificationMargin ) {

			// +---Viewport-------------------------------+
			// |                                          |
			// |                 +---Content------------+ |
			// |                 |                      | |
			// |             +------Notification------+ | |
			// |                 |                      | |
			// |                 +----------------------+ |
			// |                                          |
			// +------------------------------------------+
			if ( contentsPos.x + notificationWidth + notificationMargin > scrollPos.x + viewRect.width ) {
				setRight();

			// +---Viewport-------------------------------+               +---Viewport--------------------------+
			// |                                          |               |                                     |
			// |     +---Content------------+             |            +---Content------------+                 |
			// |     |                      |             |            |  |                   |                 |
			// |     | +------Notification------+         |    OR      | +------Notification------+             |
			// |     |                      |             |            |  |                   |                 |
			// |     +----------------------+             |            +----------------------+                 |
			// |                                          |               |                                     |
			// +------------------------------------------+               +-------------------------------------+
			} else {
				setLeft();
			}

		// Content is wider than notification.
		} else {

			//                       +--+Viewport+------------------------+
			//                       |                                    |
			//                       |             +---Content-----------------------------------------+
			//                       |             |                      |                            |
			//                       |             | +-----+Notification+-----+                        |
			//                       |             |                      |                            |
			//                       |             |                      |                            |
			//                       |             |                      |                            |
			//                       |             +---------------------------------------------------+
			//                       |                                    |
			//                       +------------------------------------+
			if ( contentsPos.x + notificationWidth + notificationMargin > scrollPos.x + viewRect.width ) {
				setLeft();

			//                       +---Viewport-------------------------+
			//                       |                                    |
			//                       |  +---Content----------------------------------------------+
			//                       |  |                                 |                      |
			//                       |  |      +------Notification------+ |                      |
			//                       |  |                                 |                      |
			//                       |  |                                 |                      |
			//                       |  +--------------------------------------------------------+
			//                       |                                    |
			//                       +------------------------------------+
			} else if ( contentsPos.x + contentsRect.width / 2 +
				notificationWidth / 2 + notificationMargin > scrollPos.x + viewRect.width ) {
				setRightFixed();

			//                       +---Viewport-------------------------+
			//                       |                                    |
			//   +---Content----------------------------+                 |
			//   |                   |                  |                 |
			//   |           +------Notification------+ |                 |
			//   |                   |                  |                 |
			//   |                   |                  |                 |
			//   +--------------------------------------+                 |
			//                       |                                    |
			//                       +------------------------------------+
			} else if ( contentsRect.left + contentsRect.width - notificationWidth - notificationMargin < 0 ) {
				setRight();

			//                       +---Viewport-------------------------+
			//                       |                                    |
			// +---Content---------------------------------------------+  |
			// |                     |                                 |  |
			// |                     | +------Notification------+      |  |
			// |                     |                                 |  |
			// |                     |                                 |  |
			// +-------------------------------------------------------+  |
			//                       |                                    |
			//                       +------------------------------------+
			} else if ( contentsRect.left + contentsRect.width / 2 - notificationWidth / 2 < 0 ) {
				setLeftFixed();

			//                       +---Viewport-------------------------+
			//                       |                                    |
			//                       | +---Content----------------------+ |
			//                       | |                                | |
			//                       | |    +-----Notification-----+    | |
			//                       | |                                | |
			//                       | |                                | |
			//                       | +--------------------------------+ |
			//                       |                                    |
			//                       +------------------------------------+
			} else {
				setCenter();
			}
		}

		function setLeft() {
			area.setStyle( 'left', cssLength( leftBase ) );
		}

		function setLeftFixed() {
			area.setStyle( 'left', cssLength( leftBase - contentsPos.x + scrollPos.x ) );
		}

		function setCenter() {
			area.setStyle( 'left', cssLength( leftBase + contentsRect.width / 2 - notificationWidth / 2 ) );
		}

		function setRight() {
			area.setStyle( 'left', cssLength( leftBase + contentsRect.width - notificationWidth - notificationMargin ) );
		}

		function setRightFixed() {
			area.setStyle( 'left', cssLength( leftBase - contentsPos.x + scrollPos.x + viewRect.width -
				notificationWidth - notificationMargin ) );
		}
	}
};

CKEDITOR.plugins.notification = Notification;

/**
 * After how many milliseconds the notification of the `info` and `success`
 * {@link CKEDITOR.plugins.notification#type type} should be closed automatically.
 * `0` means that notifications will not be closed automatically.
 * Note that `warning` and `progress` notifications will not be closed automatically.
 *
 * @since 4.5
 * @cfg {Number} [notification_duration=5000]
 * @member CKEDITOR.config
 */

/**
 * This event is fired when the {@link CKEDITOR.plugins.notification#show} method is called, before the
 * notification is shown. If this event will be canceled, notification will be not shown.
 *
 * Using this event allows to fully customize how a notification will be shown. It may be used to integrate
 * the CKEditor notifications system with the web page's notifications.
 *
 * @since 4.5
 * @event notificationShow
 * @member CKEDITOR.editor
 * @param data
 * @param {CKEDITOR.plugins.notification} data.notification Notification which will be shown.
 * @param {CKEDITOR.editor} editor The editor instance.
 */

/**
 * This event is fired when the {@link CKEDITOR.plugins.notification#update} method is called, before the
 * notification is updated. If this event will be canceled, notification will not be shown even if update was important,
 * but object will be updated anyway.
 *
 * Using this event allows to fully customize how a notification will be updated. It may be used to integrate
 * the CKEditor notifications system with the web page's notifications.
 *
 * @since 4.5
 * @event notificationUpdate
 * @member CKEDITOR.editor
 * @param data
 * @param {CKEDITOR.plugins.notification} data.notification Notification which will be updated.
 * Node that it contains not updated data.
 * @param {Object} data.options Update options, see {@link CKEDITOR.plugins.notification#update}.
 * @param {CKEDITOR.editor} editor The editor instance.
 */

/**
 * This event is fired when the {@link CKEDITOR.plugins.notification#hide} method is called, before the
 * notification is hidden. If this event will be canceled, then the notification will not be hidden.
 *
 * Using this event allows to fully customize how a notification will be hidden. It may be used to integrate
 * the CKEditor notifications system with the web page's notifications.
 *
 * @since 4.5
 * @event notificationHide
 * @member CKEDITOR.editor
 * @param data
 * @param {CKEDITOR.plugins.notification} data.notification Notification which will be hidden.
 * @param {CKEDITOR.editor} editor The editor instance.
 */
