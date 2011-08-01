window.Demo = {};
window.Demo.ViewController = {};

Demo.ViewController.AlbumList = new Class({

	Extends: Moobile.ViewController,

	albums: {
		'album-1': {
			label: 'Landscapes',
			image: 'albums/landscape/1.jpg',
			images: [
				'albums/landscape/1.jpg',
				'albums/landscape/1.jpg',
				'albums/landscape/1.jpg',
				'albums/landscape/1.jpg',
				'albums/landscape/1.jpg',
				'albums/landscape/1.jpg',
				'albums/landscape/1.jpg',
				'albums/landscape/1.jpg',
				'albums/landscape/1.jpg',
				'albums/landscape/1.jpg',
				'albums/landscape/1.jpg',
				'albums/landscape/1.jpg',
				'albums/landscape/1.jpg',
				'albums/landscape/1.jpg',
				'albums/landscape/1.jpg',
				'albums/landscape/1.jpg',
				'albums/landscape/1.jpg',
				'albums/landscape/1.jpg',
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

			image.set('src',  album.image);
			label.set('text', album.label);

			var item = new Moobile.UI.ListItem();
			item.addChildElement(image)
			item.addChildElement(label);
			item.name = id;
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

	playBarButton: null,

	init: function() {
		this.parent();

		this.navigationBar.setStyle(Moobile.UI.BarStyle.BlackTranslucent);

		this.playBarButton = new Moobile.UI.BarButton();
		this.playBarButton.setText('Play');
		this.navigationBar.navigationItem.setRightBarButton(this.playBarButton);

		this.album.images.each(function(source) {

			var cell  = new Element('div.cell');
			var image = new Element('img.image');

			image.inject(cell).set('src', source);
			image.addEvent('click', this.bound('onImageClick'));

			this.view.addChildElement(cell);

		}, this);

		return this;
	},

	attachEvents: function() {
		this.playBarButton.addEvent('click', this.bound('onPlayBarButtonClick'));
		this.parent();
		return this;
	},

	detachEvents: function() {
		this.playBarButton.removeEvent('click', this.bound('onPlayBarButtonClick'));
		this.parent();
		return this;
	},

	showImage: function(image) {
		var viewController = new Demo.ViewController.ShowImage('views/show-image.html');
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
		this.showImage(e.target.src);
		return this;
	},

	onPlayBarButtonClick: function() {

	}

});

Demo.ViewController.ShowImage = new Class({

	Extends: Moobile.ViewController,

	image: null,

	init: function() {
		this.parent();

		var image = new Element('img');
		image.set('src', this.image);
		this.view.addChildElement(image);

		return this;
	},

	setImage: function(image) {
		this.image = image;
		return this;
	}

});