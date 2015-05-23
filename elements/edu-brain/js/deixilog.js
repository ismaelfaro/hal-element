function logText(sessionId, text) {
	var request;
	var ip = "0";
	var url = "http://" + ip + ":8080/api/bots/log/" + sessionId + "/" + encodeURIComponent(text);
    try {
		request = new XMLHttpRequest();
		request.open("POST",url,true);
		request.send(null);
	} catch (e) {
		// fail silently for now
	}
}

