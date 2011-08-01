window.Demo = {};
window.Demo.ViewController = {};

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
		this.viewControllerStack.pushViewController(viewController, new Moobile.ViewTransition.Fade);
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

	showImage: function(image) {
		var viewController = new Demo.ViewController.Image('views/image.html');
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
		if (image) this.showImage(image);
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

Demo.ViewController.Image = new Class({

	Extends: Moobile.ViewController,

	image: null,

	album: null,

	playBarButton: null,

	init: function() {

		 this.parent();

		this.navigationBar.setStyle(Moobile.UI.BarStyle.BlackTranslucent);

		this.playBarButton = new Moobile.UI.BarButton();
		this.playBarButton.setText('Play');
		this.playBarButton.addEvent('click', this.bound('onPlayBarButtonClick'));

		this.navigationBar.navigationItem.setRightBarButton(this.playBarButton);
		this.navigationBar.navigationItem.getLeftBarButton().setText('Back');

		this.view.image.src = this.image;

		this.position();

		return this;
	},

	position: function() {
		var size = this.view.image.getSize();
		var view = this.view.getSize();

		if (size.x > view.x) {
			this.view.image.setStyle('width', view.x);
			this.view.image.setStyle('height', view.x * size.y / size.x);
		} else if (size.y > view.y) {
			this.view.image.setStyle('height', view.y);
			this.view.image.setStyle('width', view.y * size.x / size.y);
		}

		this.view.image.position({ relativeTo: this.view.content });

		return this;
	},

	showSlideShow: function() {
		var viewController = new Demo.ViewController.SlideShow('views/slideshow.html');
		viewController.setImage(this.image);
		viewController.setAlbum(this.album);
		this.viewControllerStack.pushViewController(viewController);
	},

	getTitle: function() {
		return (this.album.images.indexOf(this.image) + 1) + ' of ' + this.album.images.length;
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
		this.showSlideShow();
	}

});

Demo.ViewController.SlideShow = new Class({

	Extends: Moobile.ViewController,

	image: null,

	album: null,

	timer: null,

	currentImageIndex: 0,

	rootView: null,

	init: function() {

		this.parent()

		this.navigationBar.setStyle(Moobile.UI.BarStyle.BlackTranslucent);

		this.navigationBar.navigationItem.getLeftBarButton().setText('Back');

		this.currentImageIndex = this.album.images.indexOf(this.image);

		this.rootView = new Moobile.View();
		this.view.addChildView(this.rootView);

		this.album.images.each(function(source, i) {

			var childView = new Moobile.View();
			var childViewImage = new Element('img');

			childViewImage.src = source;
			childView.addChildElement(childViewImage);

			this.rootView.addChildView(childView);

			var size = childViewImage.getSize();
			var view = childView.getSize();

			if (size.x > view.x) {
				childViewImage.setStyle('width', view.x);
				childViewImage.setStyle('height', view.x * size.y / size.x);
			} else if (size.y > view.y) {
				childViewImage.setStyle('height', view.y);
				childViewImage.setStyle('width', view.y * size.x / size.y);
			}

			childViewImage.position({ relativeTo: childView.content });

			if (this.currentImageIndex == i) {
				childView.show();
			} else {
				childView.hide();
			}

		}, this);

		(function() {
			this.timer = this.slide.periodical(1000, this);
		}).delay(1000, this);

		return this;
	},

	release: function() {
		clearTimeout(this.timer);
	},

	slide: function() {

		var viewToHide = this.rootView.childViews[this.currentImageIndex];
		var viewToShow = this.rootView.childViews[this.currentImageIndex + 1];

		this.currentImageIndex++;

		if (!viewToShow) {
			viewToShow = this.rootView.childViews[0];
			viewToShow.inject(this.rootView.childViews[this.rootView.childViews.length - 1], 'after');
			this.currentImageIndex = 0;
		}

		viewToShow.show();


		var transition = new Moobile.ViewTransition.Cubic;
		transition.enter(viewToShow, viewToHide, this.rootView);
		transition.addEvent('complete:once', function() {
			viewToHide.hide();
		});

	},

	setAlbum: function(album) {
		this.album = album;
		return this;
	},

	setImage: function(image) {
		this.image = image;
		return this;
	},

	getTitle: function() {
		return 'SlideShow';
	}

});