(function() {

	/**************
	*    OTHER    *
	**************/

	function setBackgroundRGB(element ,rgb) {
		element.style.backgroundColor = rgb.toString();
	}

	const MAX_SAVED_COLORS = 16;
	const COLOR_NBYTES = 3;
	const LOCAL_STORAGE_KEY_HISTORY = 'saved-colors';
	const LOCAL_STORAGE_KEY_CURRENT = 'current-color';

	class ColorStore {
		constructor() {
			this.provisional = this.current;
			this.favorites = [];

			this._listeners = [];

			this.loadFromPersistent();
			let lastColorStr = ColorStore._storageLoad(LOCAL_STORAGE_KEY_CURRENT);
			this.current = lastColorStr ? new Color('hex', lastColorStr) : Color.random();
		}

		preview(color) {
			this.provisional = color;
			this._notifyPreview();
		}

		set(color) {
			this.current = color;
			this._notifySet();
			ColorStore._storageSave(LOCAL_STORAGE_KEY_CURRENT, this.current);
		}

		save(color) {
			this._pushToFavorites(color.clone());
			this.saveToPersistent();
			this._notifySave();
		}

		saveCurrent() {
			this.save(this.current);
		}

		unsave(color) {
			for(let i = 0; i < this.favorites.length; i++) {
				let cur = this.favorites[i];
				if(cur.equals(color)) {
					this.favorites.splice(i, 1);
					this._notifyUnSave(cur);
					return;
				}
			}
		}

		_pushToFavorites(color) {
			this.favorites.push(color);
			if(this.favorites.length > MAX_SAVED_COLORS) {
				const removed = this.favorites[0];
				this.favorites.shift();
				this._notifyUnSave(removed);
			}
		}

		saveToPersistent() {
			let str = '';
			for(let color of this.favorites) {
				str += color.toStringHEX(false);
			}
			ColorStore._storageSave(LOCAL_STORAGE_KEY_HISTORY, str);
		}

		loadFromPersistent() {
			const nChars = COLOR_NBYTES * 2;
			const str = ColorStore._storageLoad(LOCAL_STORAGE_KEY_HISTORY);
			for(let i = 0; i <= str.length - nChars; i += nChars) {
				let colorStr = str.substr(i, nChars);
				this._pushToFavorites(new Color('hex', colorStr));
			}
		}

		static _storageSave(key, value) {
			try {
				localStorage.setItem(key, value);
			} catch(e) {}
		}

		static _storageLoad(key) {
			let value;
			try {
				value = localStorage.getItem(key);
			} catch(e) {}
			return value || '';
		}

		listen(listener) {
			this._listeners.push(listener);
			listener.onSet(this.current);
			for(let i = 0; i < this.favorites.length; i++) {
				listener.onSave(this.favorites[i]);
			}
		}

		unlisten(listener) {
			let index = this._listeners.indexOf(listener);
			this._listeners.splice(index, 1);
		}

		_notifyPreview() {
			for(let i = 0; i < this._listeners.length; i++) {
				try {
					this._listeners[i].onPreview(this.provisional);
				} catch(everything) {}
			}
		}

		_notifySet() {
			for(let i = 0; i < this._listeners.length; i++) {
				try {
					this._listeners[i].onSet(this.current);
				} catch(everything) {}
			}
		}

		_notifySave() {
			const last = this.favorites[this.favorites.length - 1];
			for(let i = 0; i < this._listeners.length; i++) {
				try {
					this._listeners[i].onSave(last);
				} catch(everything) {}
			}
		}

		_notifyUnSave(color) {
			for(let i = 0; i < this._listeners.length; i++) {
				try {
					this._listeners[i].onUnSave(color);
				} catch(everything) {}
			}
		}
	}

	class GUITextInputs {
		constructor(store, containerElement) {
			this.store = store;

			this.redInput = containerElement.querySelector('.red-input');
			this.greenInput = containerElement.querySelector('.green-input');
			this.blueInput = containerElement.querySelector('.blue-input');

			this.hueInput = containerElement.querySelector('.hue-input');
			this.satInput = containerElement.querySelector('.sat-input');
			this.valInput = containerElement.querySelector('.val-input');

			this.hexInput = containerElement.querySelector('.hex-input');

			containerElement.addEventListener('change', this.onChange.bind(this), true);
			containerElement.addEventListener('click', this.onClick.bind(this));

			store.listen(this);
		}

		onPreview(color) {
			this.redInput.value = color.red;
			this.greenInput.value = color.green;
			this.blueInput.value = color.blue;

			this.hueInput.value = Math.floor(color.hue);
			this.satInput.value = Math.floor(color.sat * 100);
			this.valInput.value = Math.floor(color.val * 100);

			this.hexInput.value = color.toStringHEX(false).toUpperCase();
		}

		onSet(color) {
			this.onPreview(color);
			this.hexInput.select();
		}

		onSave(color) {}
		onUnSave(color) {}

		onChange(e) {
			let color;
			const input = e.target;
			if(input === this.redInput || input === this.greenInput || input === this.blueInput) {
				let r = parseInt(this.redInput.value, 10);
				let g = parseInt(this.greenInput.value, 10);
				let b = parseInt(this.blueInput.value, 10);
				color = new Color('rgb', r, g, b);
			} else if(input === this.hueInput || input === this.satInput || input === this.valInput) {
				let h = parseInt(this.hueInput.value, 10);
				let s = parseInt(this.satInput.value, 10) / 100;
				let v = parseInt(this.valInput.value, 10) / 100;
				color = new Color('hsv', h, s, v);
			} else {
				color = new Color('hex', this.hexInput.value);
			}
			this.store.set(color);
		}

		onClick(e) {
			if(e.target.type === 'text' && e.target === document.activeElement)
				e.target.select();
		}
	}

	class GUIPicker {
		constructor(store, element, huebar) {
			this.store = store;

			this.board = this.initBoard(element);
			this.boardBounds = null;

			this.bar = this.initBar(huebar);
			this.barBounds = null;

			this.currentColor = new Color('hsv', 0, 1);
			this.truncBg = new Color('hsv', 0, 1, 1)

			store.listen(this);
		}

		initBoard(board) {
			this.boardHandle = this.createHandle(board);

			this.onBoardMouseMoveBound = this.onBoardMouseMove.bind(this);
			this.onBoardMouseUpBound = this.onBoardMouseUp.bind(this);
			board.addEventListener('mousedown', e => {
				document.body.classList.add('non-selectable');
				this.boardBounds = board.getBoundingClientRect();
				this.onBoardMouseMove(e);
				window.addEventListener('mousemove', this.onBoardMouseMoveBound);

				window.addEventListener('mouseup', this.onBoardMouseUpBound);
			});

			return board;
		}

		initBar(bar) {
			this.barHandle = this.createHandle(bar);

			this.onBarMouseMoveBound = this.onBarMouseMove.bind(this);
			this.onBarMouseUpBound = this.onBarMouseUp.bind(this);
			bar.addEventListener('mousedown', e => {
				document.body.classList.add('non-selectable');
				this.barBounds = bar.getBoundingClientRect();
				this.onBarMouseMove(e);
				window.addEventListener('mousemove', this.onBarMouseMoveBound);

				window.addEventListener('mouseup', this.onBarMouseUpBound);
			});


			return bar;
		}

		onBoardMouseMove(e) {
			const [x, y] = this.getBoardRelativePosition(e);
			this.currentColor.setHSV(
				this.currentColor.hue,
				x / this.board.clientWidth,
				1 - y / this.board.clientHeight );
			this.store.preview(this.currentColor);
			e.stopPropagation();
		}

		onBoardMouseUp(moveCallback, e) {
			window.removeEventListener('mousemove', this.onBoardMouseMoveBound);
			window.removeEventListener('mouseup', this.onBoardMouseUpBound);
			document.body.classList.remove('non-selectable');
			this.store.set(this.currentColor);
		}

		onBarMouseMove(e) {
			const x = this.getBarRelativePosition(e);
			this.currentColor.hue = x * 360 / this.bar.clientWidth;
			this.store.preview(this.currentColor);
			e.stopPropagation();
		}

		onBarMouseUp(moveCallback, e) {
			window.removeEventListener('mousemove', this.onBarMouseMoveBound);
			window.removeEventListener('mouseup', this.onBarMouseUpBound);
			document.body.classList.remove('non-selectable');
			this.store.set(this.currentColor);
		}

		createHandle(parent) {
			const handle = document.createElement('div');
			handle.className = 'handle';
			parent.appendChild(handle);
			return handle;
		}

		getBoardRelativePosition(e) {
			let x = e.clientX - this.boardBounds.left,
				y = e.clientY - this.boardBounds.top;
			if(x < 0)
				x = 0;
			else if(x > this.board.clientWidth)
				x = this.board.clientWidth;

			if(y < 0)
				y = 0;
			else if(y > this.board.clientHeight)
				y = this.board.clientHeight;
			return [x, y];
		}

		getBarRelativePosition(e) {
			let x = e.clientX - this.barBounds.left;
			if(x < 0) x = 0;
			else if(x > this.bar.clientWidth)
				x = this.bar.clientWidth;
			return x;
		}

		updateHandles(color) {
			let x = color.sat * this.board.clientWidth;
			let y = (1 - color.val) * this.board.clientHeight;
			let z = color.hue * this.bar.clientWidth / 360;
			if(y < 3) y = 3;
			if(x < 3) x = 3;
			if(z < 3) z = 3;

			this.boardHandle.style.top = y - 8 + 'px';
			this.boardHandle.style.left = x - 8 + 'px';
			this.barHandle.style.left = z - 3 + 'px';
		}

		onPreview(color) {
			this.truncBg.hue = color.hue;
			this.currentColor = color;
			this.updateHandles(color);
			this.board.style.backgroundColor = this.truncBg.toStringRGB();
		}

		onSet(color) {
			this.onPreview(color);
		}

		onSave(color) {}
		onUnSave(color) {}
	}

	class GUIOutput {
		constructor(store, element) {
			this.element = element;

			this.current = document.createElement('div');
			this.preview = document.createElement('div');
			this.current.className = 'current-color';
			this.preview.className = 'preview-color';
			element.appendChild(this.current);
			element.appendChild(this.preview);

			store.listen(this);
		}

		onPreview(color) {
			this.preview.style.backgroundColor = color;
		}

		onSet(color) {
			this.onPreview(color);
			this.current.style.backgroundColor = color;
		}

		onSave(color) {}
		onUnSave(color) {}
	}

	class GUIFavoritesList {
		constructor(store, element) {
			this.store = store;
			this.element = element;
			this.elementList = [];

			this.transitions = false;

			store.listen(this);

			if(store.favorites.length === 0) {
				for(let i = 0; i < MAX_SAVED_COLORS; i++) {
					store.save(Color.random())
				}
			}
			this.transitions = true;
		}

		onPreview(color) {}
		onSet(color) {}

		onSave(color) {
			const colorElem = new ColorElement(color, this.onElementClicked.bind(this));
			this.elementList.push(colorElem);
			this.element.appendChild(colorElem.element);
			if(this.element.scrollWidth > this.element.clientWidth) {
				this.store.unsave(this.elementList[0].color);
			}
		}

		onUnSave(color) {
			for(let i = 0, el; i < this.elementList.length; i++) {
				el = this.elementList[i];
				if(el.color.equals(color)) {
					el.remove(this.transitions);
					this.elementList.splice(i, 1);
					return;
				}
			}
		}

		onElementClicked(target, event) {
			this.store.set(target.color);
		}
	}

	class ColorElement {
		constructor(color, onActionPerformed) {
			this.color = color;

			this.element = document.createElement('div');
			this.element.className = 'color-element';
			this.element.style.backgroundColor = color;

			this.tag = document.createElement('span');
			this.tag.textContent = color.toStringHEX(false).toUpperCase();
			this.tag.style.color = this.getForegroundForBackground(color);
			this.element.appendChild(this.tag);

			if(typeof onActionPerformed === 'function')
				this.element.addEventListener('click', () => {
					this.selectTag();
					onActionPerformed(this)
				});
		}

		remove(smooth) {
			if(smooth === false) {
				this.element.remove()
			} else {
				this.element.addEventListener('transitionend', e => this.element.remove());
				this.element.classList.add('hidden');
			}
		}

		selectTag() {
			let selection = document.createRange();
			selection.selectNodeContents(this.tag);
			let globalSelection = window.getSelection();
			globalSelection.removeAllRanges();
			globalSelection.addRange(selection);
		}

		getForegroundForBackground(bg) {
				let fg = bg.clone();
				fg.val = Math.min(fg.val, 0.4);
				return fg;
		}
	}

	class GUIActions {
		constructor(store) {
			document.getElementById("action-fav").addEventListener('click', () => {
				store.saveCurrent();
			});
			document.getElementById("action-info").addEventListener('click', () => {
				this.notImplemented();
			});
			document.getElementById("action-code").addEventListener('click', () => {
				this.notImplemented();
			});
			document.getElementById("action-invert").addEventListener('click', () => {
				let copy = store.current.clone();
				copy.invert();
				store.set(copy);
			});
			document.getElementById("action-random").addEventListener('click', () => {
				store.set(Color.random());
			});
			document.getElementById("action-websafe").addEventListener('click', () => {
				this.notImplemented();
			});
		}

		notImplemented() {
			alert('Not implemented yet!');
		}
	}

	/***************
	*    EVENTS    *
	***************/

	window.addEventListener("DOMContentLoaded",function() {
		const container = document.querySelector('.cp-outer-container');
		const UI = {
			pickboard: container.querySelector('.control-svboard'),
			huebar: container.querySelector('.control-huebar'),
			outsample: container.querySelector('.output-sample'),
			inputs: container.querySelector('.control-inputs'),
			favorites: container.querySelector('.favorite-colors-box')
		}
		const store = new ColorStore(Color.random());
		const inputs = new GUITextInputs(store, UI.inputs);
		const bboard = new GUIPicker(store, UI.pickboard, UI.huebar);
		const eoutput = new GUIOutput(store, UI.outsample);
		const favlist = new GUIFavoritesList(store, UI.favorites);
		const actionbtns = new GUIActions(store);

	});

})();
