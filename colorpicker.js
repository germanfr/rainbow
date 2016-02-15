(function() {

	/**************
	*    OTHER    *
	**************/

	function setBackgroundRGB(elemento,rgb) {
		elemento.style.backgroundColor = rgb.toString();
	}



	/******************
	*    DRAGGABLE    *
	******************/

	//Toma la posicion en el cuadrado
	function getPosSquare(event,pickboard, pos) { 		
		var x = event.clientX - pickboard.position.left,
			y = event.clientY - pickboard.position.top;
		if(x < 0)
			x = 0;
		else if(x > pickboard.clientWidth)
			x = pickboard.clientWidth;
		if(y < 0)
			y = 0;
		else if(y > pickboard.clientHeight)
			y = pickboard.clientHeight;
		pos[0] = x;
		pos[1] = y;
	}

	function getPosHue(event,huebar) {		//Toma la posicion en el huebar
		var x = event.clientX - huebar.position.left;
		if(x < 0)
			x = 0;
		else if(x > huebar.clientWidth)
			x = huebar.clientWidth;
		return x;
	}

	function pointerPos(x,y,pointer) {		//Posicion del picker del cuadrado
		if(y < 2) y = 2;
		if(x < 2) x = 2;
		pointer.style.top = y - 7 + 'px';
		pointer.style.left = x - 7 + 'px';
	}

	function pointerPosBar(s,pointer) {		//Posicion del picker de hue
		pointer.style.left = s - 8 + 'px';
	}


	/***************
	*    OUTPUT    *
	***************/

	function actualizar(rgb,hsv,hex,items) {
		actualizarPointers(hsv,items);
		actualizarInput(rgb,hsv,hex,items);
		actualizarColor(rgb,hsv,items);
	}	

	function actualizarPointers(hsv, where) {
		var x = hsv.sat*where.pickboard.clientWidth;
		var y = (1-hsv.val)*where.pickboard.clientHeight;
		var z = hsv.hue/360*where.huebar.clientWidth;
		pointerPos(x,y,where.pointer);
		pointerPosBar(z,where.huePointer);
	}

	function actualizarInput(rgb,hsv,hex,items) {
		//RGB inputs
		items.redInput.value = rgb.red;
		items.greenInput.value = rgb.green;
		items.blueInput.value = rgb.blue;
		//HSV inputs
		items.hueInput.value = Math.floor(hsv.hue);
		items.satInput.value = Math.floor(hsv.sat*100);
		items.valInput.value = Math.floor(hsv.val*100);
		//HEX input
		items.hexInput.value = hex.getValue().toUpperCase();
	}

	function actualizarColor(rgb,hsv,editable) {
		var hsvMax = new HSV (hsv.hue,1,1);
		setBackgroundRGB(editable.currentColor,rgb);
		setBackgroundRGB(editable.pickboard, hsvMax.toRGB());
	}

	function updateOld(rgb,where) {
		if(!where.attached) {
			setBackgroundRGB(where,rgb);
		}
	}


	/***************
	*    EVENTS    *
	***************/

	var rgb = RGB.random();
	var hsv = rgb.toHSV();
	var hex = rgb.toHEX();

	var pos = [0,0];
	var poshue = 0/*, posalpha = 0*/;

	window.addEventListener("DOMContentLoaded",function() {
		var editable = {
			pickboard: document.getElementById("pickboard"),
			pointer: document.getElementById("pickboardPointer"),
			huebar: document.getElementById("huebar"),
			huePointer: document.getElementById("huebarPointer"),
			/*alphabar: document.getElementById("alphabar"), //Future alpha feature support
			alphabarPointer: document.getElementById("alphabarPointer"),*/
			hexInput: document.getElementById("hexInput"),
			redInput: document.getElementById("redInput"),
			greenInput: document.getElementById("greenInput"),
			blueInput: document.getElementById("blueInput"),
			hueInput: document.getElementById("hueInput"),
			satInput: document.getElementById("satInput"),
			valInput: document.getElementById("valInput"),
			currentColor: document.getElementById("currentColor"),
			attachedColor: document.getElementById("attachedColor")
		}

		editable.attachedColor.attached = false;
		actualizar(rgb,hsv,hex,editable);
		updateOld(rgb,editable.attachedColor);

		/**********************
		*    PICKER EVENTS    *
		**********************/

		//Color board picker
		editable.pickboard.addEventListener("mousedown", function(event) {
			document.body.className += ' non-selectable ';
			editable.pickboard.position = editable.pickboard.getBoundingClientRect();
			window.addEventListener("mousemove", mover = function(event) {
				//Get pickboard color
				getPosSquare(event, editable.pickboard, pos);
				hsv.set(
					hsv.hue,
					pos[0]/editable.pickboard.clientWidth,
					1-pos[1]/editable.pickboard.clientHeight
				);
				rgb = hsv.toRGB();
				hex = rgb.toHEX();
				//Show colors
				actualizar(rgb,hsv,hex,editable);
			});
			mover(event);
			window.addEventListener("mouseup", quitar);
		});

		//Hue bar slider
		editable.huebar.addEventListener("mousedown", function(event) {
			document.body.className += ' non-selectable ';
			editable.huebar.position = editable.huebar.getBoundingClientRect();
			window.addEventListener("mousemove", mover = function(event) {
				//Get huebar color
				poshue = getPosHue(event, editable.huebar);
				hsv.set(
					poshue/editable.huebar.clientWidth*360,
					hsv.sat,
					hsv.val
				);
				rgb = hsv.toRGB();
				hex = rgb.toHEX();
				//Show colors
				actualizar(rgb,hsv,hex,editable);
			});
			mover(event);
			window.addEventListener("mouseup", quitar);
		});

		//Quitar movimientos
		var quitar = function() {
			window.removeEventListener("mousemove", mover);
			updateOld(rgb,editable.attachedColor);
			document.body.className = document.body.className.replace(' non-selectable ', '');
			window.removeEventListener("mouseup", quitar);
		}


		/**********************
		*    INPUT EVENTS    *
		**********************/

		//Hex input
		editable.hexInput.addEventListener("change",function() {
			//Get color
			hex.set(this.value);
			rgb = hex.toRGB();
			hsv = rgb.toHSV();
			actualizar(rgb,hsv,hex,editable);
			updateOld(rgb,editable.attachedColor);
		});

		//Red input
		editable.redInput.addEventListener("change", function() {
			//Get color
			rgb.red = parseInt(this.value, 10);
			rgb.fix();
			//Show colors
			hsv = rgb.toHSV();
			hex = rgb.toHEX();
			actualizar(rgb,hsv,hex,editable);
			updateOld(rgb,editable.attachedColor);
		});
		//Green input
		editable.greenInput.addEventListener("change", function() {
			//Get color
			rgb.green = parseInt(this.value, 10);
			rgb.fix();
			//Show colors
			hsv = rgb.toHSV();
			hex = rgb.toHEX();
			actualizar(rgb,hsv,hex,editable);
			updateOld(rgb,editable.attachedColor);
		});
		//Blue input
		editable.blueInput.addEventListener("change", function() {
			//Get color
			rgb.blue = parseInt(this.value, 10);
			rgb.fix();
			//Show colors
			hsv = rgb.toHSV();
			hex = rgb.toHEX();
			actualizar(rgb,hsv,hex,editable);
			updateOld(rgb,editable.attachedColor);
		});

		//Hue input
		editable.hueInput.addEventListener("change", function() {
			//Get color
			hsv.hue = parseInt(this.value, 10);
			hsv.fix();
			//Show colors
			rgb = hsv.toRGB();
			hex = rgb.toHEX();
			actualizar(rgb,hsv,hex,editable);
			updateOld(rgb,editable.attachedColor);
		});
		//Sat input
		editable.satInput.addEventListener("change", function() {
			//Get color
			hsv.sat = parseInt(this.value, 10)/100;
			hsv.fix();
			//Show colors
			rgb = hsv.toRGB();
			hex = rgb.toHEX();
			actualizar(rgb,hsv,hex,editable);
			updateOld(rgb,editable.attachedColor);
		});
		//Val input
		editable.valInput.addEventListener("change", function() {
			//Get color
			hsv.val = parseInt(this.value, 10)/100;
			hsv.fix();
			//Show colors
			rgb = hsv.toRGB();
			hex = rgb.toHEX();
			actualizar(rgb,hsv,hex,editable);
			updateOld(rgb,editable.attachedColor);
		});


		/****************
		*    ACTIONS    *
		****************/

		document.getElementById("action-random").addEventListener("click", function() {
			//Random color
			rgb = RGB.random();
			//Set colors
			hsv = rgb.toHSV();
			hex = rgb.toHEX();
			//Show colors
			actualizar(rgb,hsv,hex,editable);
			updateOld(rgb,editable.attachedColor);
		});

	});

})();