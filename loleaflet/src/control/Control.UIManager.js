/* -*- js-indent-level: 8 -*- */
/*
 * L.Control.UIManager - initializes the UI elements like toolbars, menubar or ruler
                         and allows to controll them (show/hide)
 */

/* global $ setupToolbar w2ui w2utils */
L.Control.UIManager = L.Control.extend({
	onAdd: function (map) {
		this.map = map;
		this.notebookbar = null;

		map.on('updatepermission', this.onUpdatePermission, this);
	},

	// UI initialization

	initializeBasicUI: function() {
		var enableNotebookbar = window.userInterfaceMode === 'notebookbar';

		if (window.mode.isMobile() || !enableNotebookbar) {
			var menubar = L.control.menubar();
			this.map.menubar = menubar;
			this.map.addControl(menubar);
		}

		if (window.mode.isMobile()) {
			$('#mobile-edit-button').show();
		} else {
			if (!enableNotebookbar) {
				this.map.addControl(L.control.topToolbar());
			}

			this.map.addControl(L.control.signingBar());
			this.map.addControl(L.control.statusBar());
		}

		setupToolbar(this.map);

		this.map.addControl(L.control.documentNameInput());
		this.map.addControl(L.control.scroll());
		this.map.addControl(L.control.alertDialog());
		this.map.addControl(L.control.mobileWizard());
		this.map.addControl(L.control.languageDialog());
		this.map.dialog = L.control.lokDialog();
		this.map.addControl(this.map.dialog);
		this.map.addControl(L.control.contextMenu());
		this.map.addControl(L.control.infobar());
		this.map.addControl(L.control.userList());

		this.map.on('showbusy', function(e) {
			if (w2ui['actionbar'])
				w2utils.lock(w2ui['actionbar'].box, e.label, true);
		});

		this.map.on('hidebusy', function() {
			// If locked, unlock
			if (w2ui['actionbar'] && w2ui['actionbar'].box.firstChild.className === 'w2ui-lock') {
				w2utils.unlock(w2ui['actionbar'].box);
			}
		});
	},

	initializeSpecializedUI: function(docType) {
		var isDesktop = window.mode.isDesktop();
		var enableNotebookbar = window.userInterfaceMode === 'notebookbar';

		if (window.mode.isMobile()) {
			this.map.addControl(L.control.mobileBottomBar(docType));
			this.map.addControl(L.control.mobileTopBar(docType));
			this.map.addControl(L.control.searchBar());
		} else if (enableNotebookbar) {
			if (docType === 'spreadsheet') {
				var notebookbar = L.control.notebookbarCalc();
			} else if (docType === 'presentation') {
				notebookbar = L.control.notebookbarImpress();
			} else {
				notebookbar = L.control.notebookbarWriter();
			}

			this.notebookbar = notebookbar;
			this.map.addControl(notebookbar);

			// makeSpaceForNotebookbar call in onUpdatePermission
		}

		if (docType === 'spreadsheet') {
			this.map.addControl(L.control.sheetsBar({shownavigation: isDesktop || window.mode.isTablet()}));
			this.map.addControl(L.control.formulaBar());

			// remove unused elements
			L.DomUtil.remove(L.DomUtil.get('presentation-controls-wrapper'));
		}

		if (docType === 'presentation') {
			// remove unused elements
			L.DomUtil.remove(L.DomUtil.get('spreadsheet-row-column-frame'));
			L.DomUtil.remove(L.DomUtil.get('spreadsheet-toolbar'));
		}

		if (docType === 'text') {
			// remove unused elements
			L.DomUtil.remove(L.DomUtil.get('spreadsheet-row-column-frame'));
			L.DomUtil.remove(L.DomUtil.get('spreadsheet-toolbar'));
			L.DomUtil.remove(L.DomUtil.get('presentation-controls-wrapper'));

			if ((window.mode.isTablet() || window.mode.isDesktop())) {
				var interactiveRuler = this.map.isPermissionEdit();
				L.control.ruler({position:'topleft', interactive:interactiveRuler}).addTo(this.map);
			}
		}

		if (docType === 'presentation' && (isDesktop || window.mode.isTablet())) {
			this.map.addControl(L.control.presentationBar());
		}

		if (window.mode.isMobile() || (window.mode.isTablet() && !enableNotebookbar)) {
			this.map.on('updatetoolbarcommandvalues', function() {
				w2ui['editbar'].refresh();
			});
		}
	},

	// Menubar

	showMenubar: function() {
		if (!this.isMenubarHidden())
			return;
		$('.main-nav').show();
		if (L.Params.closeButtonEnabled && !window.mode.isTablet()) {
			$('#closebuttonwrapper').show();
		}

		var obj = $('.unfold');
		obj.removeClass('w2ui-icon unfold');
		obj.addClass('w2ui-icon fold');

		this.moveObjectVertically($('#spreadsheet-row-column-frame'), 36);
		this.moveObjectVertically($('#document-container'), 36);
		this.moveObjectVertically($('#presentation-controls-wrapper'), 36);
		this.moveObjectVertically($('#sidebar-dock-wrapper'), 36);
	},

	hideMenubar: function() {
		if (this.isMenubarHidden())
			return;
		$('.main-nav').hide();
		if (L.Params.closeButtonEnabled) {
			$('#closebuttonwrapper').hide();
		}

		var obj = $('.fold');
		obj.removeClass('w2ui-icon fold');
		obj.addClass('w2ui-icon unfold');

		this.moveObjectVertically($('#spreadsheet-row-column-frame'), -36);
		this.moveObjectVertically($('#document-container'), -36);
		this.moveObjectVertically($('#presentation-controls-wrapper'), -36);
		this.moveObjectVertically($('#sidebar-dock-wrapper'), -36);
	},

	isMenubarHidden: function() {
		return $('.main-nav').css('display') === 'none';
	},

	toggleMenubar: function() {
		if (this.isMenubarHidden())
			this.showMenubar();
		else
			this.hideMenubar();
	},

	// Ruler

	showRuler: function() {
		$('.loleaflet-ruler').show();
		$('#map').addClass('hasruler');
	},

	hideRuler: function() {
		$('.loleaflet-ruler').hide();
		$('#map').removeClass('hasruler');
	},

	toggleRuler: function() {
		if (this.isRulerVisible())
			this.hideRuler();
		else
			this.showRuler();
	},

	isRulerVisible: function() {
		return $('.loleaflet-ruler').is(':visible');
	},

	// Notebookbar helpers

	hasNotebookbarShown: function() {
		return $('#map').hasClass('notebookbar-opened');
	},

	makeSpaceForNotebookbar: function(docType) {
		if (this.hasNotebookbarShown())
			return;

		var additionalOffset = 0;
		if (docType === 'spreadsheet') {
			if (window.mode.isTablet())
				additionalOffset = -7;
			else
				additionalOffset = 53;
		}

		this.moveObjectVertically($('#spreadsheet-row-column-frame'), 36);
		this.moveObjectVertically($('#document-container'), 43 + additionalOffset);
		this.moveObjectVertically($('#presentation-controls-wrapper'), 43);
		this.moveObjectVertically($('#sidebar-dock-wrapper'), 43);

		$('#map').addClass('notebookbar-opened');
	},

	collapseNotebookbar: function() {
		if (this.isNotebookbarCollapsed())
			return;

		this.moveObjectVertically($('#spreadsheet-row-column-frame'), -85);
		this.moveObjectVertically($('#document-container'), -85);
		this.moveObjectVertically($('#presentation-controls-wrapper'), -85);
		this.moveObjectVertically($('#sidebar-dock-wrapper'), -85);
		this.moveObjectVertically($('#formulabar'), -1);
		$('#toolbar-up').css('display', 'none');

		$('#document-container').addClass('tabs-collapsed');
	},

	extendNotebookbar: function() {
		if (!this.isNotebookbarCollapsed())
			return;

		this.moveObjectVertically($('#spreadsheet-row-column-frame'), 85);
		this.moveObjectVertically($('#document-container'), 85);
		this.moveObjectVertically($('#presentation-controls-wrapper'), 85);
		this.moveObjectVertically($('#sidebar-dock-wrapper'), 85);
		this.moveObjectVertically($('#formulabar'), 1);
		$('#toolbar-up').css('display', '');

		$('#document-container').removeClass('tabs-collapsed');
	},

	isNotebookbarCollapsed: function() {
		return $('#document-container').hasClass('tabs-collapsed');
	},

	// Event handlers

	onUpdatePermission: function(e) {
		if (window.mode.isMobile()) {
			if (e.perm === 'edit') {
				$('#toolbar-down').show();
			}
			else {
				$('#toolbar-down').hide();
			}
		}

		var enableNotebookbar = window.userInterfaceMode === 'notebookbar';
		if (enableNotebookbar && !window.mode.isMobile()) {
			if (e.perm === 'edit') {
				this.makeSpaceForNotebookbar(this.map._docLayer._docType);
			} else if (e.perm === 'readonly' && $('#mobile-edit-button').is(':hidden')) {
				var menubar = L.control.menubar();
				this.map.menubar = menubar;
				this.map.addControl(menubar);

				if (this.notebookbar) {
					this.map.removeControl(this.notebookbar);
					this.notebookbar = null;
				}
			}
		}

		// We've resized the document container.
		this.map.invalidateSize();
	},

	// Helper functions

	moveObjectVertically: function(obj, diff) {
		if (obj) {
			var prevTop = obj.css('top');
			if (prevTop) {
				prevTop = parseInt(prevTop.slice(0, -2)) + diff;
			}
			else {
				prevTop = 0 + diff;
			}
			obj.css({'top': String(prevTop) + 'px'});
		}
	}
});

L.control.uiManager = function () {
	return new L.Control.UIManager();
};
