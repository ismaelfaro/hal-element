 
// Chat Bot by George Dunlop, www.peccavi.com
// Note - Eliza is a Classic Model of chat Bots.. but this implementation is mine :)
// May be used/modified if credit line is retained (c) 1997 All rights reserved
// Modified 2008,2009,2010,2011  http://nlp-addiction.com/chatbots/ 

loaded = false;  
maxKey = 36;
keyNotFound = maxKey-1;
keyword = new Array(maxKey);
var elizaresponse = "";
chatmax = 12;// number of lines/2
chatpoint = 0;
chatter = new Array(chatmax);
maxrespnses =116;
response = new Array(maxrespnses);
maxConj = 19;
max2ndConj = 7;
var conj1 = new Array(maxConj);
var conj2 = new Array(maxConj);
var conj3 = new Array(max2ndConj);
var conj4 = new Array(max2ndConj);
var RPstrg = "";
var ht = 0;// head tail stearing
var pass = 0;
var thisstr = "";
var keyid = 0;
var wTopic = "";// Last worthy responce
var sTopic = "";// Last worthy responce
var greet = false;
var wPrevious = "";// so we can check for repeats
var started = false;  

// Funtion to replaces all occurances of substring substr1 with substr2 within strng
// if type == 0 straight string replacement
// if type == 1 assumes padded strings and replaces whole words only
// if type == 2 non case sensitive assumes padded strings to compare whole word only
// if type == 3 non case sensitive straight string replacement
function key(key,idx,end){
 this.key = key;// phrase to match
 this.idx = idx;// first response to use
 this.end = end;// last response to use
 this.last = end;// response used last time
}
function replaceStr( strng, substr1, substr2, type){
  var pntr = -1; aString = strng;
  if( type == 0 ){  
    if( strng.indexOf( substr1 ) >= 0 ){ pntr = strng.indexOf( substr1 );  }
  } else if( type == 1 ){ 
    if( strng.indexOf( " "+ substr1 +" " ) >= 0 ){ pntr = strng.indexOf( " " + substr1 + " " ) + 1; }  
  } else if( type == 2 ){ 
    bstrng = strng.toUpperCase();
    bsubstr1 = substr1.toUpperCase();
    if( bstrng.indexOf( " "+ bsubstr1 +" " )>= 0 ){ pntr = bstrng.indexOf( " " + bsubstr1 + " " ) + 1; }  
  } else {
    bstrng = strng.toUpperCase();
    bsubstr1 = substr1.toUpperCase();
    if( bstrng.indexOf( bsubstr1 ) >= 0 ){ pntr = bstrng.indexOf( bsubstr1 ); }  
  }
  if( pntr >= 0 ){
    RPstrg += strng.substring( 0, pntr ) + substr2;
    aString = strng.substring(pntr + substr1.length, strng.length );
    if( aString.length > 0 ){ replaceStr( aString, substr1, substr2, type ); }
  }
  aString =  RPstrg + aString; RPstrg = "";
  return aString;
}
function padString(strng){ aString = " " + strng + " ";
 for( i=0; i < punct.length; i++ ){ aString = replaceStr( aString, punct[i], " " + punct[i] + " ", 0 ); } return aString
}
// Function to strip padding
function unpadString(strng){
 aString = strng; aString = replaceStr( aString, "  ", " ", 0 ); // compress spaces
 if( strng.charAt( 0 ) == " " ){ aString = aString.substring(1, aString.length ); }
 if( strng.charAt( aString.length - 1 ) == " " ){ aString = aString.substring(0, aString.length - 1 ); }
 for( i=0; i < punct.length; i++ ){ aString = replaceStr( aString, " " + punct[i], punct[i], 0 ); }
 return aString
}
// Dress Input formatting i.e leading & trailing spaces and tail punctuation
function strTrim(strng){
    if(ht == 0){ loc = 0; }  // head clip
    else { loc = strng.length - 1; }// tail clip  ht = 1 
    if( strng.charAt( loc ) == " "){
      aString = strng.substring( - ( ht - 1 ), strng.length - ht);
      aString = strTrim(aString);
    } else { 
      var flg = false;
      for(i=0; i<=5; i++ ){ flg = flg || ( strng.charAt( loc ) == punct[i]); }
      if(flg){  
        aString = strng.substring( - ( ht - 1 ), strng.length - ht );
      } else { aString = strng; }
      if(aString != strng ){ strTrim(aString); }
    }
    if( ht ==0 ){ ht = 1; strTrim(aString); } 
    else { ht = 0; }    
    return aString;
}
// adjust pronouns and verbs & such
function conjugate( sStrg ){             // rephrases sString
 var sString = sStrg;
 for( i = 0; i < maxConj; i++ ){ sString = replaceStr( sString, conj1[i], "#@&" + i, 2 ); } // decompose
 for( i = 0; i < maxConj; i++ ){ sString = replaceStr( sString, "#@&" + i, conj2[i], 2 ); } // recompose
 // post process the resulting string
 for( i = 0; i < max2ndConj; i++ ){ sString = replaceStr( sString, conj3[i], "#@&" + i, 2 ); } // decompose
 for( i = 0; i < max2ndConj; i++ ){ sString = replaceStr( sString, "#@&" + i, conj4[i], 2 ); } // recompose
 return sString;
}
// Build our response string
// get a random choice of response based on the key
// Then structure the response
function phrase( sString, keyidx ){
    idxmin = keyword[keyidx].idx;
    idrange = keyword[keyidx].end - idxmin + 1;
    choice = keyword[keyidx].idx + Math.floor( Math.random() * idrange );
    if( choice == keyword[keyidx].last && pass < 5 ){ pass++; phrase(sString, keyidx ); }
    keyword[keyidx].last = choice;
    var rTemp = response[choice];
    var tempt = rTemp.charAt( rTemp.length - 1 );
    if(( tempt == "*" ) || ( tempt == "@" )){
      var sTemp = padString(sString);
      var wTemp = sTemp.toUpperCase();
      var strpstr = wTemp.indexOf( " " + keyword[keyidx].key + " " );
       strpstr += keyword[ keyidx ].key.length + 1;
      thisstr = conjugate( sTemp.substring( strpstr, sTemp.length ) );
      thisstr = strTrim( unpadString(thisstr) )
      if( tempt == "*" ){
        sTemp = replaceStr( rTemp, "<*", " " + thisstr + "?", 0 );
      } else { sTemp = replaceStr( rTemp, "<@", " " + thisstr + ".", 0 );
      }
    } else sTemp = rTemp;
    return sTemp;
}
// returns array index of first key found
function testkey(wString){ if( keyid < keyNotFound && !( wString.indexOf( " " + keyword[keyid].key + " ") >= 0 )){ keyid++; testkey(wString); } }
function findkey(wString){ keyid = 0; found = false; testkey(wString); if( keyid >= keyNotFound ){ keyid = keyNotFound; } return keyid; }
function listen(User){
 sInput = User;
 if(started){ clearTimeout(Rtimer); }
 Rtimer = setTimeout("wakeup()", 180000);    // wake up call
 started = true;                  // needed for Rtimer
 sInput = strTrim(sInput);              // dress input formating
 if( sInput != "" ){ 
      wInput = padString(sInput.toUpperCase());  // Work copy
      var foundkey = maxKey;                   // assume it's a repeat input
      if (wInput != wPrevious){           // check if user repeats himself
        foundkey = findkey(wInput);         // look for a keyword.
      }
      if( foundkey == keyNotFound ){
        if( !greet ){ greet = true; 
        //return "Don't you ever say Hello?" 
        return "Ahh.  Please continue..." 
        } 
        else {
          wPrevious = wInput; // save input to check repeats
          if(( sInput.length < 10 ) && ( wTopic != "" ) && ( wTopic != wPrevious )){
            lTopic = conjugate( sTopic ); sTopic = ""; wTopic = "";
            return 'OK... "' + lTopic + '". Tell me more.';
          } else {
            if( sInput.length < 15 ){ 
              return "Tell me more..."; 
            } else { return phrase( sInput, foundkey ); }
          }
        }
      } else { 
        if( sInput.length > 12 ){ sTopic = sInput; wTopic = wInput; }
        greet = true; wPrevious = wInput; // save input to check repeats
        return phrase( sInput, foundkey );  // Get our response
      }
  } else { return "I can't help, if you will not chat with me!"; }
}
function wakeup(){ var strng1 = "    *** Are We going to Chat? ***"; var strng2 = "  I can't help you without a dialog!"; update(strng1,strng2); }    
function think(){ document.Eliza.input.value = ""; if( elizaresponse != "" ){ respond(); } else { setTimeout("think()", 250); } }
function dialog(){
 var Input = document.Eliza.input.value;    // capture input and copy to log
 document.Eliza.input.value = "";  chatter[chatpoint] = " \n* " + Input; elizaresponse = listen(Input);
 setTimeout("think()", 100 + Math.random()*300); chatpoint ++ ; if( chatpoint >= chatmax ){ chatpoint = 0; } return write();
}
function respond(){
 chatpoint -- ; if( chatpoint < 0 ){ chatpoint = chatmax-1; }chatter[chatpoint] += "\n> " + elizaresponse; chatpoint ++ ; if( chatpoint >= chatmax ){ chatpoint = 0; }
 return write();
}
// Allow for unprompted response from the engine
function update(str1,str2){
 chatter[chatpoint] = " \n> " + str1; chatter[chatpoint] += "\n> " + str2; chatpoint ++ ; if( chatpoint >= chatmax ){ chatpoint = 0; }
 return write();
}
function write(){
    document.Eliza.log.value = "";
    for(i = 0; i < chatmax; i++){
      n = chatpoint + i;
      if( n < chatmax ){ document.Eliza.log.value += chatter[ n ]; }
      else { document.Eliza.log.value += chatter[ n - chatmax ]; }
    }
    refresh();
    return false; // don't redraw the ELIZA's form!
}
function refresh(){ setTimeout("write()", 1000); }  // Correct user overwrites
function hello(){ chatter[chatpoint] = "> Hello. My name is Eliza.  How may I help you?"; chatpoint = 1; return write(); }
function start(){ for( i = 0; i < chatmax; i++){ chatter[i] = ""; } chatter[chatpoint] = "  Loading..."; document.Eliza.input.focus(); write(); if( loaded ){ hello() } else { setTimeout("start()", 100); }}
punct = new Array(".", ",", "!", "?", ":", ";", "&", '"', "@", "#", "(", ")" );
conj1[0]  = "are"; conj2[0]  = "am";
conj1[1]  = "am"; conj2[1]  = "are";
conj1[2]  = "were"; conj2[2]  = "was";
conj1[3]  = "was"; conj2[3]  = "were";
conj1[4]  = "I"; conj2[4]  = "you";    
conj1[5]  = "me"; conj2[5]  = "you";    
conj1[6]  = "you"; conj2[6]  = "me";
conj1[7]  = "my"; conj2[7]  = "your";    
conj1[8]  = "your"; conj2[8]  = "my";
conj1[9]  = "mine"; conj2[9]  = "your's";    
conj1[10] = "your's"; conj2[10] = "mine";    
conj1[11] = "I'm"; conj2[11] = "you're";
conj1[12] = "you're"; conj2[12] = "I'm";    
conj1[13] = "I've"; conj2[13] = "you've";
conj1[14] = "you've"; conj2[14] = "I've";
conj1[15] = "I'll"; conj2[15] = "you'll";
conj1[16] = "you'll"; conj2[16] = "I'll";
conj1[17] = "myself"; conj2[17] = "yourself";
conj1[18] = "yourself"; conj2[18] = …