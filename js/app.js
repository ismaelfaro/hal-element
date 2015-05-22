var conexion = new Firebase("https://hall9000.firebaseio.com");




conexion.on('child_changed', function (snapshot) {
    var message = snapshot.val();
    console.log('------>' + message);
    //document.forms.chatForm.chatText.value+=message;
    document.forms.chatForm.chatInput.value = message;
    chat();
});


document.forms.chatForm.chatInput.focus();


var form = document.querySelector('#recognition-form'),
    input = document.querySelector('#recognition-input'),

    element = document.getElementById('recognition-element'),
    startButton = document.getElementById('start'),
    stopButton = document.getElementById('stop');


function start() {

    element.start();
}

function stop() {
    element.stop();

}


element.addEventListener('result', function (e) {
    input.textContent = '';

    input.textContent = e.detail.result;
    conexion.set({
        control: input.textContent
    });
});

start();