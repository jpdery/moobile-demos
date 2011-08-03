window.Demo = {};
window.Demo.ViewController = {};
window.Demo.View = {};

Demo.ViewController.AlbumList = new Class({

	Extends: Moobile.ViewController,

	albums: {
		'album-1': {
			label: 'Landscapes',
			images: [
				'albums/landscape/1.jpg',
				'albums/landscape/2.jpg',
				'albums/landscape/3.jpg',
				'albums/landscape/4.jpg',
				'albums/landscape/5.jpg',
				'albums/landscape/6.jpg',
				'albums/landscape/7.jpg',
				'albums/landscape/8.jpg',
				'albums/landscape/9.jpg',
				'albums/landscape/10.jpg',
				'albums/landscape/11.jpg',
				'albums/landscape/12.jpg',
				'albums/landscape/13.jpg',
				'albums/landscape/14.jpg',
				'albums/landscape/15.jpg',
				'albums/landscape/16.jpg',
				'albums/landscape/17.jpg',
				'albums/landscape/18.jpg',
				'albums/landscape/19.jpg',
				'albums/landscape/20.jpg',
				'albums/landscape/21.jpg',
				'albums/landscape/22.jpg',
				'albums/landscape/23.jpg',
				'albums/landscape/24.jpg',
				'albums/landscape/25.jpg',
				'albums/landscape/26.jpg',
				'albums/landscape/27.jpg',
				'albums/landscape/28.jpg'
			]
		}
	},

	init: function() {

		this.parent();

		this.navigationBar.setStyle(Moobile.UI.BarStyle.BlackTranslucent);

		for (var id in this.albums) {

			var album = this.albums[id];
			var label = new Element('div.label');
			var image = new Element('img.image');

			var thumb = album.images.getLast();

			image.set('src',  thumb);
			label.set('text', album.label);

			var item = new Moobile.UI.ListItem();
			item.name = id;
			item.addChildElement(image)
			item.addChildElement(label);
			this.view.albumList.addItem(item);
		}

		return this;
	},

	release: function() {
		this.albums = null;
		this.parent();
		return this;
	},

	attachEvents: function() {
		this.view.albumList.addEvent('select', this.bound('onAlbumSelect'));
		this.parent();
		return this;
	},

	detachEvents: function() {
		this.view.albumList.removeEvent('select', this.bound('onAlbumSelect'));
		this.parent();
		return this;
	},

	showAlbum: function(album) {
		var viewController = new Demo.ViewController.AlbumDetail('views/album-detail.html');
		viewController.setAlbum(album);
		this.viewControllerStack.pushViewController(viewController);
		return this;
	},

	viewWillEnter: function() {
		this.view.albumList.removeSelectedItems();
		this.parent();
		return this;
	},

	onAlbumSelect: function(item) {
		var album = this.albums[item.name];
		if (album) this.showAlbum(album);
		return this;
	}

});

Demo.ViewController.AlbumDetail = new Class({

	Extends: Moobile.ViewController,

	album: null,

	init: function() {

		this.parent();

		this.navigationBar.setStyle(Moobile.UI.BarStyle.BlackTranslucent);

		this.navigationBar.navigationItem.getLeftBarButton().setText('Back');

		this.album.images.each(function(source, i) {

			var image = new Element('div.image');

			image.setStyle('background-image', 'url(' + source + ')');

			image.name = i;

			image.addEvent('click', this.bound('onImageClick'));
			image.addEvent('mouseup', this.bound('onImageMouseUp'));
			image.addEvent('mousedown', this.bound('onImageMouseDown'));

			this.view.addChildElement(image);

		}, this);

		this.view.addChildElement(new Element('div.clear'));

		return this;
	},

	release: function() {
		this.ablum = null;
		this.parent();
		return this;
	},

	attachEvents: function() {
		this.parent();
		return this;
	},

	detachEvents: function() {
		this.parent();
		return this;
	},

	viewWillEnter: function() {

		this.view.getChildElements().each(function(image, i) {

			var pos = image.getPosition(this.view);
			pos.x = -pos.x + 3;
			pos.y = -pos.y + 47;

			image.setStyle('-webkit-transform', 'translateX(' + pos.x +'px) translateY(' + pos.y + 'px)');

		}, this);

		this.parent();

		return this;
	},

	viewDidEnter: function() {
		this.view.addClass('reposition-images');
		this.parent();
		return this;
	},

	showAlbumImage: function(image) {
		var viewController = new Demo.ViewController.AlbumImage('views/album-image.html');
		viewController.setAlbum(this.album);
		viewController.setImage(image);
		this.viewControllerStack.pushViewController(viewController);
		return this;
	},

	getTitle: function() {
		return this.album.label;
	},

	setAlbum: function(album) {
		this.album = album;
		return this;
	},

	onImageClick: function(e) {
		var image = this.album.images[e.target.name];
		if (image) this.showAlbumImage(image);
		return this;
	},

	onImageMouseUp: function(e) {
		e.target.removeClass('down');
		return this;
	},

	onImageMouseDown: function(e) {
		e.target.addClass('down');
		return this;
	}

});

Demo.ViewController.AlbumImage = new Class({

	Extends: Moobile.ViewController,

	album: null,

	image: null,

	imageIndex: 0,

	slidesView: null,

	slidesDelay: 1500,

	slideShowRunning: null,

	slideShowTimer: null,

	playBarButton: null,

	init: function() {

		this.parent();

		this.navigationBar.setStyle(Moobile.UI.BarStyle.BlackTranslucent);

		this.playBarButton = new Moobile.UI.BarButton();
		this.playBarButton.setText('Play');

		this.navigationBar.navigationItem.setRightBarButton(this.playBarButton);
		this.navigationBar.navigationItem.getLeftBarButton().setText('Back');

		this.imageIndex = this.album.images.indexOf(this.image);

		this.slidesView = this.view.slidesView;

		var imageView = new Demo.View.Image();

		this.slidesView.addChildView(imageView);

		imageView.setImage(this.image);
		imageView.center();

		this.updateNavigationBarTitle();

		return this;
	},

	release: function() {
		this.stopSlideShow();
		this.parent();
		return this;
	},

	attachEvents: function() {
		this.playBarButton.addEvent('click', this.bound('onPlayBarButtonClick'));
		this.parent();
		return this;
	},

	detachEvents: function() {
		this.playBarButton.removeEvent('click', this.bound('onPlayBarButtonClick'));
		this.parent();
		return this;
	},

	playSlideShow: function() {
		this.slideShowRunning = true;
		this.playBarButton.setText('Stop');
		this.slide();
		return this;
	},

	stopSlideShow: function() {
		clearTimeout(this.slideShowTimer);
		this.slideShowRunning = false;
		this.playBarButton.setText('Play');
		return this;
	},

	slide: function() {

		var childViews = this.slidesView.getChildViews();

		var viewToHide = childViews[0];
		var viewToShow = new Demo.View.Image();

		this.slidesView.addChildView(viewToShow);

		this.imageIndex++;

		var image = this.album.images[this.imageIndex];
		if (image == undefined) {
			image = this.album.images[0];
			this.imageIndex = 0;
		}

		var loader = new Image();
		loader.src = image;
		loader.addEvent('load', function() {

			viewToShow.setImage(image);
			viewToShow.center();

			var viewTransition = Browser.chrome ?
				new Moobile.ViewTransition.Fade :
				new Moobile.ViewTransition.Cubic;

			viewTransition.addEvent('complete:once', function() {

				viewToHide.destroy();
				viewToHide = null;

				if (this.slideShowRunning)
					this.slideShowTimer = this.slide.delay(this.slidesDelay, this);

			}.bind(this));

			viewTransition.enter(viewToShow, viewToHide, this.slidesView);

			this.updateNavigationBarTitle();

		}.bind(this));
	},

	updateNavigationBarTitle: function() {
		this.navigationBar.navigationItem.setTitle(this.imageIndex + 1 + ' of ' + this.album.images.length);
		return this;
	},

	setAlbum: function(album) {
		this.album = album;
		return this;
	},

	setImage: function(image) {
		this.image = image;
		return this;
	},

	onPlayBarButtonClick: function() {
		if (this.slideShowRunning) {
			this.stopSlideShow();
		} else {
			this.playSlideShow();
		}
	}

});

Demo.View.Image = new Class({

	Extends: Moobile.View,

	image: null,

	build: function() {
		this.parent();
		this.image = new Element('img');
		this.addChildElement(this.image);
		return this;
	},

	init: function() {
		this.parent();
		this.addClass('image-view');
		return this;
	},

	attachEvents: function() {
		this.window.addEvent('orientationchange', this.bound('onOrientationChange'));
		this.parent();
		return this;
	},

	detachEvents: function() {
		this.window.removeEvent('orientationchange', this.bound('onOrientationChange'));
		this.parent();
		return this;
	},

	release: function() {
		this.parent();
		this.image = null;
		return this;
	},

	center: function() {

		this.image.setStyle('top', null);
		this.image.setStyle('height', 'auto');
		this.image.setStyle('width', 'auto');

		var frameSize = this.getSize();
		var imageSize = this.image.getSize();

		if (imageSize.x >= frameSize.x) {
			this.image.setStyle('width', frameSize.x);
		} else if (imageSize.y >= frameSize.y) {
			this.image.setStyle('height', frameSize.y);
		}

		var resized = this.image.getSize();

		this.image.setStyle('-webkit-transform', 'translateX(' + (frameSize.x / 2 - resized.x / 2) + 'px) translateY(' + (frameSize.y / 2 - resized.y / 2) + 'px)');

		return this;
	},

	setImage: function(src) {
		this.image.set('src', src);
		return this;
	},

	getImage: function() {
		return this.image.get('src');
	},

	onOrientationChange: function(orientation) {
		this.center();
		return this;
	}

});