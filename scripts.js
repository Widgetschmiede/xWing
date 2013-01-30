// scripts.js

// Globals
var model = getModel();		// holds the image to display
var random = randomTrue();			// true for random images
var activation = activationTrue();		// true if refresh on activation
var slideshow = { refresh:getRefresh(), interval:null };	// refresh is seconds till next refresh; 0 means never


// Globals for Apple
var flipShown = false;
var animation = { timer:null, duration:0, starttime:0, to:1.0, now:0.0, from:0.0, firstElement:null };


function showVersion() {
	getObj('infospan').innerHTML = "v 0.8a";
}


// Dashboard Setup
function setup() {
	if(window.widget) {
		widget.onshow = onShow;
		widget.onhide = onHide;
		widget.onremove = doCleanup;
	}

	createGenericButton(getObj("done"), "done", savePrefs);
	showModel();
	startSlideshow();
}





function getRefresh() {
	if(window.widget)
		var value = widget.preferenceForKey(prefKey('refresh'));
	else
		value = document.forms[0].mode.element[document.forms[0].mode.selectedIndex].value;
	
	return value ? value * 1000 : 0;
}

function activationTrue() {
	var value = false;
	if(window.widget)
		value = widget.preferenceForKey(prefKey('activation'));
	else
		value = document.forms[0].activation.checked;
	
	return value;
}

function randomTrue() {
	var value = false;
	if(window.widget)
		value = widget.preferenceForKey(prefKey('random'));
	else
		value = document.forms[0].random.checked;
	
	return value;
}

function getModel(next) {
	var value, random;
	var poss = getPossibilities();
	
	if(window.widget)
		value = widget.preferenceForKey(prefKey('model'));
	else
		value = document.forms[0].model.element[document.forms[0].model.selectedIndex].value;
	
	// take a random one
	if(random) {
		var rand = new Date().getMilliseconds() % (poss.length -1);
		value = poss[rand];
	}
	
	// take the next model in the folder (if wished)
	else if(next) {
		var take_next = false;
		
		for(i = 0; i < poss.length; i++) {
			if(poss[i].length < 1)
				continue;
			
			if(take_next) {
				value = poss[i];
				take_next = false;
				break;
			}
			
			take_next = (poss[i] == model);
		}
		
		if(take_next)		// we were at the last element but have no 'next'-value yet. lets start over with the first model.
			value = poss[0];
	}
	
	return value ? value : (poss[0] ? poss[0] : "../Default.png");
}







function setModel(img) {
	if(!model)
		model = getModel();
	
	if(!img) {
		var img1_displayed = (getObj("the_alt_image").style.display != "block");
		var img = img1_displayed ? "the_image" : "the_alt_image";
	}
	
	// alert("setting model:" + model + " for image " + img);
	myimage = getObj(img);
	myimage.src = "./Images/" + model;
}


function showModel(next) {
	model = getModel(next);
	
	var img1_displayed = (getObj("the_alt_image").style.display != "block");
	
	/*** flipping ***
	if(next) {
		var myfront = img1_displayed ? getObj("the_image") : getObj("the_alt_image");
		var myback = img1_displayed ? getObj("the_alt_image") : getObj("the_image");
		
		if(window.widget)
			widget.prepareForTransition("ToBack");
		
		setModel();
		myfront.style.display = "none";
		myback.style.display = "block";
			
		if(window.widget)
			setTimeout("widget.performTransition();", 0);
	}
	else {
		setModel();
	}
	/* end flipping */
	
	/*** fading ***/
	var outModel = img1_displayed ? "the_image" : "the_alt_image";
	var inModel = img1_displayed ? "the_alt_image" : "the_image";
	
	// fade current model out
	modelFadingOut.start = (new Date).getTime();
	modelFadingOut.stop = modelFadingOut.start + modelFading.totalTime;
	
	// fade new model in
	modelFadingIn.start = (new Date).getTime() + modelFading.waitTime;
	modelFadingIn.stop = modelFadingIn.start + modelFading.totalTime;
	setModel(inModel);
	
	fadeModelOut(outModel);
	setTimeout("fadeModelIn('" + inModel + "')", modelFading.waitTime);
	
	/* end fading */
}


var modelFading = { totalTime:800, waitTime:600 }
var modelFadingOut = { start:null, stop:null, aim:0 }
var modelFadingIn = { start:null, stop:null, aim:1 }

function fadeModelOut(img) {
	var image = getObj(img);
	var now = (new Date()).getTime();
	
	if(now < modelFadingOut.stop) {
		var delta = (now - modelFadingOut.start) / modelFading.totalTime;
		var factor = ((delta * delta) * 3.0) - ((delta * delta * delta) * 2.0);
		var opacity = (modelFadingOut.aim == 1) ? factor : 1 - factor;
		// alert("OUT >> delta:" + delta + " factor:" + factor + " opacity:" + opacity);
		
		image.style.opacity = opacity;
		
		setTimeout("fadeModelOut('" + img + "')", 30);
	} else {
		image.style.opacity = modelFadingOut.aim;
		image.style.display = "none";
		modelFadingOut.start = null;
		modelFadingOut.stop = null;
	}
}

function fadeModelIn(img) {
	var image = getObj(img);
	var now = (new Date()).getTime();
	
	image.style.display = "block";
	
	if(now < modelFadingIn.stop) {
		var delta = (now - modelFadingIn.start) / modelFading.totalTime;
		var factor = ((delta * delta) * 3.0) - ((delta * delta * delta) * 2.0);
		var opacity = (modelFadingIn.aim == 1) ? factor : 1 - factor;
		// alert("IN >> delta:" + delta + " factor:" + factor + " opacity:" + opacity);
		
		image.style.opacity = opacity;
		
		setTimeout("fadeModelIn('" + img + "')", 30);
	} else {
		image.style.opacity = modelFadingIn.aim;
		modelFadingIn.start = null;
		modelFadingIn.stop = null;
	}
}








function getPossibilities() {
	var images;
	if(window.widget) {
		images = widget.system("/bin/ls -1 ./Images", null).outputString;
	}
	images = images ? images : "";
	return images.split("\n");
}

function setupModes() {
	var modeobj = document.forms[0].mode;
	
	// remove old options first
	var startlen = modeobj.options.length;
	for(i = 0; i < startlen; i++) {
		modeobj.removeChild(modeobj.options[0]);
	}
	
	// add
	var possarr = new Array();
	possarr[5] = "5 seconds";
	possarr[10] = "10 seconds";
	possarr[20] = "20 seconds";
	possarr[60] = "minute";
	possarr[300] = "5 minutes";
	possarr[600] = "10 minutes";
	possarr[1800] = "half hour";
	possarr[3600] = "hour";
	
	modeobj.appendChild(document.createElement("option"));
	modeobj.lastChild.value = 0;
	modeobj.lastChild.innerHTML = "No Change";
	modeobj.lastChild.selected = (slideshow.refresh <= 1000);
	
	modeobj.appendChild(document.createElement("option"));
	modeobj.lastChild.value = "";
	modeobj.lastChild.innerHTML = "---";
	
	for(var seconds in possarr) {
		modeobj.appendChild(document.createElement("option"));
		modeobj.lastChild.value = seconds;
		modeobj.lastChild.innerHTML = "Change every " + possarr[seconds];
		modeobj.lastChild.selected = (slideshow.refresh == seconds * 1000);		// select the right one
	}
}

function adjustPrefs() {
	setupModes();
	
	var selector = document.forms[0].selector;
	var activationcheck = document.forms[0].activation;
	var randomcheck = document.forms[0].random;
	var imagearr = getPossibilities();
	
	// add nodes
	var a = 0;
	for(i = 0; i < imagearr.length; i++) {
		if(imagearr[i].length > 0) {
			var imagename = imagearr[i].replace(/\.[^\.]+$/, "");
			
			selector.appendChild(document.createElement("option"));
			selector.options[a].value = imagearr[i];
			selector.options[a].innerHTML = imagename.replace(/_/g, " ");
			selector.options[a].selected = (imagearr[i] == model);		// select the right one
			
			a++;
		}
	}
	
	// set activation
	if(activation == true) {
		activationcheck.checked = true;
	}
	
	// set random
	if(random == true) {
		randomcheck.checked = true;
	}
}

function removePossibilities() {
	var selector = document.forms[0].selector;
	
	var startlen = selector.options.length;
	for(i = 0; i < startlen; i++) {
		selector.removeChild(selector.options[0]);
	}
}






function startSlideshow() {
	if(slideshow.refresh > 0)
		slideshow.interval = setInterval("showModel(true)", slideshow.refresh);
}

function stopSlideshow() {
	clearInterval(slideshow.interval);
	slideshow.interval = null;
}

function getObj(id) {
	return document.getElementById(id);
}




function showPrefs() {
	var front = getObj("front");
	var back = getObj("back");
	
	adjustPrefs();		// creates the option-menu to select an image and prechecks the random-checkbox
	showVersion();		// sets version-number
	
	if(window.widget)
		widget.prepareForTransition("ToBack");
	
	stopSlideshow();
				
	front.style.display = "none";
	back.style.display = "block";
		
	if(window.widget)
		setTimeout("widget.performTransition();", 0);
}


function savePrefs() {
	var selector = document.forms[0].selector;
	model = selector.options[selector.selectedIndex].value;
	model = model ? model : getModel();
	
	var mode = document.forms[0].mode;
	refresh = mode.options[mode.selectedIndex].value;
		
	var activationcheck = document.forms[0].activation;
	var randomcheck = document.forms[0].random;
	
	if(window.widget) {
		widget.setPreferenceForKey(refresh, prefKey('refresh'));
		widget.setPreferenceForKey(model, prefKey('model'));
		widget.setPreferenceForKey(activationcheck.checked, prefKey('activation'));
		widget.setPreferenceForKey(randomcheck.checked, prefKey('random'));
		// alert('setting xWing-prefs: model=' + model + ' random=' + randomcheck.checked + ' refresh=' + refresh + ' activation=' + activationcheck.checked);
	}
	
	hidePrefs();
}

function prefKey(key) {
	if(window.widget)
		return widget.identifier + "_" + key;
	else
		return key;
}

function hidePrefs() {
	var front = getObj("front");
	var back = getObj("back");
	
	if(window.widget)
		widget.prepareForTransition("ToFront");
	
	//getObj("fliprollie").style.display = "none";	
	front.style.display = "block";
	back.style.display = "none";
	
	slideshow.refresh = getRefresh();
	startSlideshow();
	
	removePossibilities();		// will be re-created next time the prefs are called
	setTimeout("showModel()", 600);
		
	if(window.widget)
		setTimeout("widget.performTransition();", 0);
}






function onShow() {
	if(activation) {
		showModel(true);
	}
	startSlideshow();
}

function onHide() {
	stopSlideshow();
}

function doCleanup() {
	if(window.widget) {
		widget.setPreferenceForKey(null, prefKey('model'));
		widget.setPreferenceForKey(null, prefKey('random'));
		widget.setPreferenceForKey(null, prefKey('refresh'));
		widget.setPreferenceForKey(null, prefKey('activation'));
	}
}


// ---------------------
// by Apple
// ---------------------
// 
//

function mousemove(event) {
	if(! flipShown) {
		if (animation.timer != null) {
			clearInterval (animation.timer);
			animation.timer  = null;
		}
		var starttime = (new Date).getTime() - 13;
 
		animation.duration = 500;
		animation.starttime = starttime;
		animation.firstElement = getObj ('flip');
		animation.timer = setInterval ("animate();", 13);
		animation.from = animation.now;
		animation.to = 1.0;
		animate();
		flipShown = true;
	}
}


function mouseexit (event) {
	if (flipShown) {
		// fade in the info button
		if (animation.timer != null) {
			clearInterval (animation.timer);
			animation.timer  = null;
		}

		var starttime = (new Date).getTime() - 13;

		animation.duration = 500;
		animation.starttime = starttime;
		animation.firstElement = getObj ('flip');
		animation.timer = setInterval ("animate();", 13);
		animation.from = animation.now;
		animation.to = 0.0;
		animate();
		flipShown = false;
	}
}

function animate()
{
	var T;
	var ease;
	var time = (new Date).getTime();
   

	T = limit_3(time-animation.starttime, 0, animation.duration);

	if (T >= animation.duration)
	{
		clearInterval (animation.timer);
		animation.timer = null;
		animation.now = animation.to;
	}
	else
	{
		ease = 0.5 - (0.5 * Math.cos(Math.PI * T / animation.duration));
		animation.now = computeNextFloat (animation.from, animation.to, ease);
	}

	animation.firstElement.style.opacity = animation.now;
}

function limit_3 (a, b, c)
{
	return a < b ? b : (a > c ? c : a);
}

function computeNextFloat (from, to, ease)
{
	return from + (to - from) * ease;
}

// these functions are called when the info button itself receives onmouseover and onmouseout events (by Apple)
// I modified them to inverse the colors on hover

function enterflip(event) {
	getObj("flip").style.backgroundImage = "url(/System/Library/WidgetResources/ibutton/white_rollie.png)";
	getObj("flippi").src = "/System/Library/WidgetResources/ibutton/black_i.png";
}

function exitflip(event) {
	getObj("flip").style.backgroundImage = "url(/System/Library/WidgetResources/ibutton/black_rollie.png)";
	getObj("flippi").src = "/System/Library/WidgetResources/ibutton/white_i.png";
}