window.onload = function() {
	colorBoard = document.getElementById('pickboard');
	colorPicker = document.getElementById('cursor');
	hueBoard = document.getElementById('huebar');
	huePicker = document.getElementById('hueselect');
	hueInput = document.getElementById('hue');
	satInput = document.getElementById('saturation');
	valInput = document.getElementById('value');
	redInput = document.getElementById('red');
	greenInput = document.getElementById('green');
	blueInput = document.getElementById('blue');
	muestra = document.getElementById('muestra');
	red=255; green=255; blue=255;
	hue=0; sat=0; val=255;
	colorBoard.addEventListener("mousedown", function() { pickColor(); document.body.classList.add('non-selectable'); document.body.addEventListener("mousemove", pickColor)});
	hueBoard.addEventListener("mousedown", function() { pickHue(); document.body.addEventListener("mousemove", pickHue); });
	window.addEventListener("mouseup", function() {
		document.body.classList.remove('non-selectable');
		document.body.removeEventListener("mousemove", pickHue);
		document.body.removeEventListener("mousemove", pickColor); 
		
	});
}
function pickHue() {
	var yhue = (event.clientY - hueBoard.getBoundingClientRect().top).toFixed(2);
	var hueBoardHeight = hueBoard.clientHeight;
	if(yhue<0) yhue = 0;
	if(yhue>hueBoardHeight) yhue=hueBoardHeight;
	huePicker.style.top = yhue-2 + 'px';
	hue = (1-yhue/hueBoardHeight)*360;
	setColor();
}
function pickColor() {
	var x = (event.clientX - colorBoard.getBoundingClientRect().left).toFixed(2);
	var y = (event.clientY - colorBoard.getBoundingClientRect().top).toFixed(2);
	var colorBoardHeight = colorBoard.clientHeight;
	var colorBoardWidth = colorBoard.clientWidth;
	if(x<0) x=0;
	if(y<0) y=0;
	if(x>=colorBoardWidth) x=colorBoardWidth;
	if(y>=colorBoardHeight) y=colorBoardHeight;
	colorPicker.style.top = y-5 + 'px';
	colorPicker.style.left = x-5 + 'px';
	sat=x/colorBoardWidth;
	val=(1-y/colorBoardHeight)*255;
	setColor();
}
function fromHSV(hue, sat, val) {
	var C = val*sat;
	var X = C*(1- Math.abs((hue/60)%2-1));
	var m = val-C;
	var R, G, B;
	if(hue>=0 && hue<60) {R=C; G=X; B=0}
	else if(hue>=60 && hue<120) {R=X; G=C; B=0}
	else if(hue>=120 && hue<180) {R=0; G=C; B=X}
	else if(hue>=180 && hue<240) {R=0; G=X; B=C}
	else if(hue>=240 && hue<300) {R=X; G=0; B=C}
	else if(hue>=300 && hue<360) {R=C; G=0; B=X}
	return red = (R+m).toFixed(), green=(G+m).toFixed(), blue=(B+m).toFixed();
}
function setColor() {
	fromHSV(hue, sat, val);
	hueInput.value=hue.toFixed();
	satInput.value=(sat*100).toFixed() +'%';
	valInput.value=(val/2.55).toFixed() +'%';
	redInput.value = red;
	greenInput.value = green;
	blueInput.value = blue;
	var colorRGB = "rgb(" + red + ", " + green + ", " + blue + ")";
	muestra.style.backgroundColor = colorRGB;
	colorBoardBg();
}
function colorBoardBg() {
	fromHSV(hue, 1, 255);
	document.body.style.backgroundColor = "rgb(" + red + ", " + green + ", " + blue + ")";
	colorBoard.style.backgroundColor = "rgb(" + red + ", " + green + ", " + blue + ")";
}