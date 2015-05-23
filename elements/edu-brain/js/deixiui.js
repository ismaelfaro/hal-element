var chatLines = new Array();
var sessionId = 0;
var userLabel = "TÚ";
var speech = new SpeechSynthesisUtterance();


speech.lang = 'es-ES';

var slide=1,
	speechUserInput = '',
	presentation = document.getElementById('slides');


function toggleVisibility(id) {
	var element = document.getElementById(id);
	if (element.style.display == "none") {
		element.style.display = "block";
	} else {
		element.style.display = "none";
	}
}


function chat() {
	var form = document.forms.chatForm;
	var userInput = form.chatInput.value;
	var control = null;
	if(speechUserInput===''){
		command=userInput;
	}else
	{
		command=speechUserInput;
	}
	console.log(command);
	if(command==="siguiente"){
		slide=slide+1;
		console.log('+1')
		control=true;
		userInput='';
	}
	if(command==="anterior"){
		slide=slide-1;
		control=true;
		userInput='';
	}

	

	if (userInput != '') {
		var userLine = userLabel + ":" + "          ".slice(-(7-userLabel.length)) + userInput;
		var contesta =  bot.transform(userInput);
		
		var botLine =  botName + ":" + "          ".slice(-(7-botName.length)) + contesta ;
		
		form.chatInput.value = '';
		chatLines.push(userLine);
		displayLines();
		chatLines.push(botLine);

		//logText(sessionId,userLine + "||" + botLine);
		window.setTimeout(displayLines, 100);


	} else if (chatLines.length == 0) {
		for (var i = 0; i < 20; i++) {
			chatLines.push(" ");
			};
		var contesta = bot.getInitial()
		var botLine = botName + ":" + "          ".slice(-(7-botName.length)) + contesta;
		chatLines.push(botLine);
		displayLines();
	} 

	if(control==true){
		slidesControl();
		console.log('-------');
		control=false;
	}

	talk(contesta);

}

function talk(texto){

	if(!texto) return;

	console.log(texto);
	
	speech.text = texto;

	window.speechSynthesis.speak(speech);
	document.forms.chatForm.chatInput.focus();

}

function slidesControl(){
	document.forms.chatForm.chatInput.value = '';
	console.info(slide);

 	document.getElementById('slides').contentDocument.location="http://127.0.0.1:3000/presentation/assets/player/KeynoteDHTMLPlayer.html#"+slide.toString();
 	document.getElementById('slides').contentDocument.location.reload();
}

function displayLines() {
	var chatText = document.getElementById('chatText');
	chatText.value = chatLines.join('\n');
	chatText.scrollTop = chatText.scrollHeight;
}

function generateSessionId() {
	return 'xxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
}

function reset() {
	sessionId = generateSessionId();
	bot.reset();
	chatLines.length = 0;
	document.forms.chatForm.chatInput.value = '';
	document.forms.chatForm.chatInput.focus();
	chat();
}

function eventWindowLoaded () {
	reset();
}

window.addEventListener("load", eventWindowLoaded, false);