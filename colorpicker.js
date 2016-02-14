var pickboardHeight = 256;
var huebarHeight = 256;

var redId = "red", greenId = "green", blueId = "blue";
var hueId = "hue", satId = "saturation", valId = "value";
var hexId = "hex";


function obtenerID(elemento) {			//Para coger objetos por id
	var objeto = document.getElementById(elemento);
	return objeto;
}

function setBackgroundColor(rgb, elObjeto) {		//Establece un color de fondo en CSS
	obtenerID(elObjeto).style.backgroundColor = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
}
function comprobarRGB(rgb) {
	for(var i=0; i<3; i++) {
		if(isNaN(rgb[i]) || rgb[i]<0) rgb[i]=0;
		else if(rgb[i]>255) rgb[i] = 255;
	}
}
function comprobarHSV(hsv) {
	for (var i=0; i<3; i++) {
		if(isNaN(hsv[i]) || hsv[i]<0) 
            hsv[i] = 0;
	}
	if(hsv[0]>360) hsv[0]=360;
	if(hsv[1]>1) hsv[1]=1;
	if(hsv[2]>1) hsv[2]=1;
}

function HSVtoRGB(hsv) {	//Convierte HSV a RGB
	comprobarHSV(hsv);

	var R, G, B;
	var C = hsv[2]*hsv[1];
	var X = C*(1- Math.abs((hsv[0]/60)%2-1));
	var m = hsv[2]-C;
	if(hsv[0]>=0 && hsv[0]<60) {R=C; G=X; B=0}
	else if(hsv[0]<120)  {R=X; G=C; B=0}
	else if(hsv[0]<180)  {R=0; G=C; B=X}
	else if(hsv[0]<240)  {R=0; G=X; B=C}
	else if(hsv[0]<300)  {R=X; G=0; B=C}
	else if(hsv[0]<=360) {R=C; G=0; B=X}

	R = Math.round((R+m)*255);
	G = Math.round((G+m)*255);
	B = Math.round((B+m)*255);
	return [R, G, B];
}

function RGBtoHSV(rgb) {		//Convierte RGB a HSV
	comprobarRGB(rgb);

	var R = rgb[0]/255, G = rgb[1]/255, B = rgb[2]/255, hue, sat;
	var maximo,minimo,diferencia;
	maximo = Math.max(R,G,B);
	minimo = Math.min(R,G,B);
	diferencia = maximo-minimo;
	if(diferencia!=0) {
		if(maximo==R) {hue = ((G-B)/diferencia)%6; if(hue<0) hue = 6+hue;}
		else if(maximo==G) {hue = (B-R)/diferencia+2; }
		else {hue = (R-G)/diferencia+4; }
		hue *= 60;
		sat = diferencia/maximo;
	}
	else {
		hue = 360;
		sat=0;
	}
	return [hue, sat, maximo];
}

function RGBtoHEX(rgb) {	//Convierte RGB a HEX
	comprobarRGB(rgb);

	var A = Number(rgb[0]).toString(16);
	if(A.length==1)
		A = '0'+A;
	var B = Number(rgb[1]).toString(16);
	if(B.length==1)
		B = '0'+B;
	var C = Number(rgb[2]).toString(16);
	if(C.length==1)
		C ='0'+C;
	return (A + B + C).toUpperCase();
}

function HEXtoRGB(hex) {		//Convierte HEX a RGB
	return [
		parseInt("0x" + hex.substring(0,2),16),
		parseInt("0x" + hex.substring(2,4), 16),
		parseInt("0x" + hex.substring(4,6), 16)
	]
}

function invertRGB(rgb) {		//Invierte RGB
	return [ 255-rgb[0], 255-rgb[1], 255-rgb[2] ];
}
function webSafeColor(rgb) {
	var op;
	var wsc = [];
	for(var c = 0; c<3; c++) {
		op = rgb[c]%51;
		wsc[c] = rgb[c] - op;
		if(op >= 25.5) {
			wsc[c] = wsc[c] + 51;
		}
	}
	return wsc;
}

//FIXME doesnt works
function hsv2hsl(hue,sat,val){
	var aux = ((aux=(2-sat)*val)>=1)?(2-aux):aux;
	if(aux == 0)
		aux = 1;
	return[hue, sat*val/aux, (2-sat)*val/2]
    /*return[ //[hue, saturation, lightness]
            //Range should be between 0 - 1
        hue, //Hue stays the same
 
        //Saturation is very different between the two color spaces
        //If (2-sat)*val < 1 set it to sat*val/((2-sat)*val)
        //Otherwise sat*val/(2-(2-sat)*val)
        //Conditional is not operating with hue, it is reassigned!
        sat*val/((hue=(2-sat)*val)<1?hue:2-hue),
		
        hue/2 //Lightness is (2-sat)*val/2
        //See reassignment of hue above
    ]*/
}

function makeInvisible(objeto) {
	objeto.style.visibility="hidden";
	objeto.style.opacity="0";

}
function makeVisible(objeto) {
	objeto.style.visibility="visible";
	objeto.style.opacity="1";
}



function pointerPosition(x,y) {			//Posicion del picker del cuadrado
	var cursor = obtenerID('colorCursor');
	if(y<=4) y=4;
	if(x<=4) x=4;
	cursor.style.top = y-8 + 'px';
	cursor.style.left = x-8 + 'px';
}

function selectorPosition(y) {		//Posicion del picker de hue
	if(y<=2) y=2;
	obtenerID('hueCursor').style.top = y-4 + 'px';
}

function getPosSquare(event) { 		//Toma la posicion en el cuadrado
	var colorBoard = obtenerID('pickboard'); 
	var x = (event.clientX - colorBoard.getBoundingClientRect().left),
		y = (event.clientY - colorBoard.getBoundingClientRect().top);
	if(x<=0)
		x=0;
	else if(x>=pickboardHeight)
		x=pickboardHeight;
	if(y<=0)
		y=0;
	else if(y>=pickboardHeight)
		y=pickboardHeight;
	return [x,y];
}

function getPosHue(event) {		//Toma la posicion en el huebar
	var y = (event.clientY - obtenerID('huebar').getBoundingClientRect().top);
	if(y<=0)
		y = 0;
	else if(y>=huebarHeight)
		y = huebarHeight;
	return y;
}

function generarShades(hex,container) {
	var hsv = RGBtoHSV(HEXtoRGB(hex));
	var container = obtenerID(container);
	if(hsv[2]>1/7) {
 		container.innerHTML ="";
 		
 		for(var i=1;i<=7;i++) {
	 		crearShade(RGBtoHEX(HSVtoRGB([hsv[0],hsv[1],hsv[2]*i/7])),container);
	 		
 		}
 	}
 	else {
 		container.innerHTML = "Shades of #" + hex + " are identical"; 		
 	}

}

function generarLights(hex,container) {
	var rgb = HEXtoRGB(hex);
	var container = obtenerID(container);
	if((rgb[0]+rgb[1]+rgb[2])/3<255*0.9) {
 		container.innerHTML ="";
 		
 		for(var i=1;i<=7;i++) {
	 		crearShade(RGBtoHEX([Math.round(255-(255-rgb[0])*i/7),Math.round(255-(255-rgb[1])*i/7),Math.round(255-(255-rgb[2])*i/7)]),container);
	 		
 		}
 	}
 	else {
 		container.innerHTML = "Lights of #" + hex + " are identical"; 		
 	}

}

function rellenarCodigosGenerados(rgb,hsv,hex,hsl) {
	obtenerID('hexCodes-color').value = "color: #"+hex+";";
 	obtenerID('hexCodes-background').value = "background-color: #"+hex+";";
 	obtenerID('rgbCodes-color').value = "color: rgb("+rgb[0]+","+rgb[1]+","+rgb[2]+");";
 	obtenerID('rgbCodes-background').value = "background-color: rgb("+rgb[0]+","+rgb[1]+","+rgb[2]+");";
 	obtenerID('hslCodes-color').value = "color: hsl("+Math.round(hsl[0])+","+Math.round(hsl[1]*100)+"%,"+Math.round(hsl[2]*100)+"%);";
 	obtenerID('hslCodes-background').value = "background-color: hsl("+Math.round(hsl[0])+","+Math.round(hsl[1]*100)+"%,"+Math.round(hsl[2]*100)+"%);";
 	makeVisible(obtenerID('html-css-codes'));
 	setBackgroundColor(rgb,'muestra-extended');
 	obtenerID('html-extended-color').innerHTML = "#" + hex + ", (" + rgb[0] + "," + rgb[1] + "," + rgb[2] +")";

 	
 	obtenerID("shades-title").innerHTML = "Shades of #" + hex;
 	generarShades(hex,"extended-shades");

 	obtenerID("lights-title").innerHTML = "Lights of #" + hex;
 	generarLights(hex,"extended-lights");
 	obtenerID('html-extended-color').scrollIntoView(false);

}
 	

function coloresALosInput(hsv,rgb,hex) {		//Muestra el color en los cuadros
	obtenerID(hueId).value = Math.round(hsv[0]);
	obtenerID(satId).value = Math.round(hsv[1]*100);
	obtenerID(valId).value = Math.round(hsv[2]*100);
	obtenerID(redId).value = rgb[0];
	obtenerID(greenId).value = rgb[1];
	obtenerID(blueId).value = rgb[2];
	obtenerID(hexId).value = hex;
}
function mostrarColores(hsv,rgb,hex) {
	coloresALosInput(hsv,rgb,hex);
	setBackgroundColor(rgb, 'nuevo');
	setBackgroundColor(HSVtoRGB([hsv[0],1,1]), 'pickboard');
	setBackgroundColor(webSafeColor(rgb),'safeColor');
}
function salidaColor(hsv,rgb,hex) {
	mostrarColores(hsv,rgb,hex);
	pointerPosition(hsv[1]*pickboardHeight,(1-hsv[2])*pickboardHeight);
	selectorPosition((1-hsv[0]/360)*huebarHeight);
}

function oldColor(rgb,attached) {
	if(!attached)
		setBackgroundColor(rgb, 'viejo');
}
function guardarColor(color,contenedor) {

	var MAX = 6;
	if(contenedor != undefined) {
		var coloresGuardados = contenedor.getElementsByTagName('div');

		if(coloresGuardados.length>=MAX) {
			contenedor.removeChild(coloresGuardados[MAX-1]);
		}
		
		var nuevoColor = crearColor(color,contenedor);
		contenedor.insertBefore(nuevoColor,coloresGuardados[0]);
	}
}

function crearColor(color,contenedor) {

	var nuevoColor = document.createElement('div');
		nuevoColor.className = "saved-color";
		nuevoColor.style.backgroundColor= "#" + color;

		var colorCode = document.createElement('input');
		colorCode.type="text";
		colorCode.value= color;
		colorCode.spellcheck = false;
		colorCode.setAttribute("readonly","readonly");
		nuevoColor.appendChild(colorCode);
		return nuevoColor;
}

function crearShade(color,contenedor) {
	var MAX = 7;
	if(contenedor != undefined) {
		var coloresGuardados = contenedor.getElementsByTagName('div');

		if(coloresGuardados.length>=MAX) {
			contenedor.removeChild(coloresGuardados[MAX-1]);
		}
		
		var nuevoColor = crearColor(color,contenedor);
		contenedor.insertBefore(nuevoColor,coloresGuardados[0]);
	}
}

function setCookie(cname, cvalue, exdays) {	//Establece una cookie dado el nombre, valor y dias
    var d = new Date();
    d.setTime(d.getTime() + (exdays*86400000));	//exdays*24*60*60*1000=ms
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {	//Obtener una cookie dado su nombre
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1); //Elimina espacios en blanco
        if (c.indexOf(name) == 0) 
        	return c.substring(name.length, c.length);
    }
    return "";
}

function checkCookies() {	//Checkea las cookies existentes y los muestra por color
	var aleatorio; var color;
	for(var c=5; c>=0;c--) {
	    color = getCookie("savedColor" + c);
	    if(color!="") 
	        guardarColor(color,obtenerID('saved-colors'));
	    else {
	    	aleatorio = [numAleatorio(0,255),numAleatorio(0,255),numAleatorio(0,255)];
	    	guardarColor(RGBtoHEX(aleatorio),obtenerID('saved-colors'));
	    }
	}
}
function insertarCookie(hex) {
	var cookie;
	for(var c=5;c>0; c--) {
			cookie = getCookie("savedColor" + (c-1));
			setCookie("savedColor" + c, cookie, 30);
		}
		setCookie("savedColor0", hex, 30);
}
function numAleatorio(A,B) {
	return Math.round(Math.random()*(B-A)+A);
}

function createTextareaField(fieldID,textContent,nodoPadre) {
	 	var codeTextField = document.createElement('input');
		codeTextField.value = textContent;
		codeTextField.setAttribute("id",fieldID);
		codeTextField.setAttribute("type","text");
		codeTextField.spellcheck = false;
		nodoPadre.appendChild(codeTextField);
}


function main() {
	var hsv = [360, 0, 1], rgb = [255,255,255], hex = 'FFFFFF', hsl = [0,0,1];
	var attached = false, displayWebSafe = false;
	pickboardHeight = obtenerID('pickboard').clientHeight;
	huebarHeight = obtenerID('huebar').clientHeight;

	rgb = [numAleatorio(0,255),numAleatorio(0,255),numAleatorio(0,255)];
	hsv = RGBtoHSV(rgb);
	hex = RGBtoHEX(rgb);
	oldColor(rgb,false);
	salidaColor(hsv,rgb,hex);

		//Entrada por picker
	var _pos = function(event) {		//Cuando se mueve el ratón en el pickerboard
		var mousePosPickboard = getPosSquare(event);
		pointerPosition(mousePosPickboard[0], mousePosPickboard[1]);
		hsv[1] = mousePosPickboard[0]/pickboardHeight;
		hsv[2] = 1-(mousePosPickboard[1]/pickboardHeight);
		rgb = HSVtoRGB(hsv);
		hex = RGBtoHEX(rgb);
		mostrarColores(hsv,rgb,hex);
	};
	obtenerID('pickboard').onmousedown = function(event) {
		_pos(event);
		document.body.className += ' non-selectable ';
		window.addEventListener("mousemove", __pos = function(event) {_pos(event) });
		window.addEventListener("mouseup", quitar = function() {
		 	levantaElMouse(); 
		 	window.removeEventListener("mousemove", __pos); 
		});
	};

	var _posHue = function(event) {		//Cuando se mueve el ratón en la huebar
		var mousePosHuebar = getPosHue(event);
		selectorPosition(mousePosHuebar);
		hsv[0] = 360-mousePosHuebar/huebarHeight*360;
		rgb = HSVtoRGB(hsv);
		hex = RGBtoHEX(rgb);
		mostrarColores(hsv,rgb,hex);
	}
	obtenerID('huebar').onmousedown = function(event) {
		_posHue(event);
		document.body.className += ' non-selectable ';
		window.addEventListener("mousemove", __posHue = function(event) {_posHue(event) });
		window.addEventListener("mouseup", quitar = function() {
		 	levantaElMouse(); 
		 	window.removeEventListener("mousemove", __posHue); 
		});
	};
	
	var levantaElMouse = function() {
		oldColor(rgb,attached);
		document.body.className = document.body.className.replace(' non-selectable ', '');
		obtenerID('hex').select();
		window.removeEventListener("mouseup", quitar);
	}

	//Entrada por inputs
	var losInput = obtenerID('inputs').getElementsByTagName('input');
	for(var i=0; i<losInput.length; i++) {		
		losInput[i].onchange = function() {
			oldColor(rgb,attached);
			var valor = parseInt(this.value,10);
			switch(this.id) {
				case hueId:
					hsv[0] = valor;
					rgb = HSVtoRGB(hsv);
					hex = RGBtoHEX(rgb);
					break;
				case satId:
					hsv[1] = valor/100;
					rgb = HSVtoRGB(hsv);
					hex = RGBtoHEX(rgb);
					break;
				case valId: 
					hsv[2] = valor/100;
					rgb = HSVtoRGB(hsv);
					hex = RGBtoHEX(rgb);
					break;
				case redId:
					rgb[0] = valor;
					valor=rgb[1];
				case greenId:
					rgb[1] = valor;
					valor=rgb[2];
				case blueId: 
					rgb[2] = valor;
					hsv = RGBtoHSV(rgb);
					hex = RGBtoHEX(rgb);
					break;
				case hexId: 
					hex = this.value;
					if(hex.length==6) {
						hex = hex.toUpperCase();
						rgb = HEXtoRGB(hex);
						hsv = RGBtoHSV(rgb);
					}
					else if(hex.length==3) {
						hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) 
							+ hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
						hex = hex.toUpperCase();
						rgb = HEXtoRGB(hex);
						hsv = RGBtoHSV(rgb);
					}
			}
			salidaColor(hsv,rgb,hex);
		}
	}

	//Entrada por botones de acción
	obtenerID('rw-attach').onclick = function() {
		var attachedCode = obtenerID('attached-code');
		oldColor(rgb,attached);
		attached = !attached;
		oldColor(rgb,attached);
		this.classList.toggle('rw-button-active');

		if(attached) {
			attachedCode.innerText = "#" + hex;
			makeVisible(attachedCode);
			attachedCode.style.color = "#" + ((hsv[2]>0.6&&hsv[1]<0.6)?"444":hex) ;
		}
		else {
			makeInvisible(attachedCode);
		}
	};

	obtenerID('rw-invert').onclick = function() {
		oldColor(rgb,attached);
		rgb = invertRGB(rgb);
		hsv = RGBtoHSV(rgb);
		hex = RGBtoHEX(rgb);
		salidaColor(hsv,rgb,hex);
		obtenerID('hex').select();
	 };

	 obtenerID('rw-random').onclick = function() {
		oldColor(rgb,attached);
		rgb = [numAleatorio(0,255),numAleatorio(0,255),numAleatorio(0,255)];
		hsv = RGBtoHSV(rgb);
		hex = RGBtoHEX(rgb);
		salidaColor(hsv,rgb,hex);
		obtenerID('hex').select();
	 };
	 obtenerID('rw-websafe').onclick = function() {
	 	var safeColor = obtenerID('safeColor');
	 	this.classList.toggle('rw-button-active');
	 	
	 	displayWebSafe = !displayWebSafe;
		if(displayWebSafe) {
			makeVisible(safeColor);	
	 	}
		else {
			makeInvisible(safeColor);
		}

	 	safeColor.onmousedown = function() {
	 		oldColor(rgb,attached);
	 		rgb = webSafeColor(rgb);
	 		hsv = RGBtoHSV(rgb);
			hex = RGBtoHEX(rgb);
			salidaColor(hsv,rgb,hex);
			obtenerID('hex').select();
			return false;
	 	};
		
	 };
	 obtenerID('rw-codes').onclick = function() {
	 	hsl = hsv2hsl(hsv[0],hsv[1],hsv[2]);
	 	rellenarCodigosGenerados(rgb,hsv,hex,hsl);
	 };
	 //Entrada por colores guardados
	var comprobarSavedColors = function() {
		var favList = obtenerID('saved-colors').getElementsByTagName('div');
		for(var fL=0;fL<favList.length;fL++) {
			favList[fL].onclick = function() { 
				var color = this.getElementsByTagName('input')[0];
				oldColor(rgb,attached);
				hex = color.value;
				rgb = HEXtoRGB(hex);
				hsv = RGBtoHSV(rgb);
				salidaColor(hsv,rgb,hex);
				color.select();
			};
		}
	};
	checkCookies();
	comprobarSavedColors();
	obtenerID('rw-fav').onclick = function() {
		guardarColor(hex,obtenerID('saved-colors'));
		insertarCookie(hex);
		comprobarSavedColors();
	};
}


window.onload = main;