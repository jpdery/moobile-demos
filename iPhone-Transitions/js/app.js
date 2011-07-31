window.Demo = {};
window.Demo.ViewController = {};

Demo.ViewController.Home = new Class({

	Extends: Moobile.ViewController,

	transitionList: null,

	init: function() {
		this.parent();
		this.transitionList = this.view.transitionList;
		this.transitionList.setStyle(Moobile.UI.ListStyle.Grouped);
		return this;
	},

	release: function() {
		this.transitionList = null;
		return this;
	},

	attachEvents: function() {
		this.transitionList.addEvent('select', this.bound('onTransitionListItemSelect'))
		this.parent();
		return this;
	},

	onTransitionListItemSelect: function(item) {

		var transition = null;

		switch (item.name) {
			case 'fade':
				transition = new Moobile.ViewTransition.Fade;
				break;
			case 'slide':
				transition = new Moobile.ViewTransition.Slide;
				break;
			case 'cubic':
				transition = new Moobile.ViewTransition.Cubic;
				break;
		}

		this.viewControllerStack.pushViewControllerFrom('views/transition.html', transition);

		return this;
	},

	viewWillEnter: function() {
		this.transitionList.removeSelectedItems();
		this.parent();
		return this;
	}

});

Demo.ViewController.AlbumDetail = new Class({

	Extends: Moobile.ViewController,

	init: function() {
		this.parent();
		return this;
	}

});