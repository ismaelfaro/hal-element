function DeixiBot(botData) {

  this.maxRecursion = 5;

  this.initials = ["?"];
  if (botData.initials) {
    this.initials = botData.initials;
  }

  this.defaultReplies = ["..."];
  if (botData.defaultReplies) {
    this.defaultReplies = botData.defaultReplies;
  }
  
  this.preSub = new DeixiMultiPassSub(botData.preSubs);
  this.personSub = new DeixiSinglePassSub(botData.personSubs);
  this.synonymSub = new DeixiSynonymSub(botData.synonyms);
  
  this.rules = []
  if (botData.rules) {
    for (var i=0; i<botData.rules.length; i++) {
      this.rules.push(new DeixiRule(botData.rules[i], this.synonymSub));
    }
  }
  
  this.abbreviations = []
  if (botData.abbreviations) {
    this.abbreviations = botData.abbreviations;
  }

	this.reset();
}

DeixiBot.prototype.reset = function() {
  this.lastReply = undefined;
  this.variables = {};
}

DeixiBot.prototype.getInitial = function() {
  this.lastReply = this._getRandom(this.initials);
  return this.lastReply;
}

DeixiBot.prototype.transform = function(input) {
  input = this.preSub.replace(input);
  var sentences = this._splitSentences(input);
  var replies = new Array();
  for (var i=0; i<sentences.length; i++) {
    var reply = this._transformSentence(sentences[i], 0);
    if (reply) {
      replies.push(reply);
    }
  }
  if (replies.length) {
    this.lastReply = replies[replies.length-1];
  } else {
    this.lastReply = this._getRandom(botData.defaultReplies);
  }
  return this.lastReply;
}

DeixiBot.prototype._splitSentences = function(input) {
  input = this._tokenize(input);
  rawSentences = input.split(/\./);
  var sentences = [];
  for (var i=0; i<rawSentences.length; i++) {
    var sentence = rawSentences[i].replace(/^\s+/,""); // remove leading spaces
    sentence = sentence.replace(/\s+$/,""); // remove trailing spaces
    sentence = sentence.replace(/\s+\?/g,"?"); // remove spaces before '?'
    sentence = sentence.replace(/\s\s+/g," "); // single spaces only
    if (sentence) {
      sentences.push(sentence);
    }
  }
  return sentences;
}

DeixiBot.prototype._tokenize = function(input) {
  for (var i=0; i<this.abbreviations.length; i++) {
    var abbrevPattern = "\\b" + this.abbreviations[i].replace(/\./g,"\\.");
    var abbrevSub = this.abbreviations[i].replace(/\./g,"");
    input = input.replace(new RegExp(abbrevPattern,"gi"),abbrevSub);
  }
  input = input.replace(/\?+/g,"?."); // Add a period after '?'s to split on that period but keep the '?'
  input = input.replace(/,/g," "); // substitute spaces for commas
  input = input.replace(/[.;!¿¡]+/g,"."); // Replace any series of punctuation with a single period
  return input;
}

DeixiBot.prototype._transformSentence = function(sentence, recursionLevel) {
  if (recursionLevel >= this.maxRecursion) {
    console.log("Too much recursion");
    return undefined;
  }
  var reply;
  if (sentence === "default")
    return reply;
  for (var i=0; i<this.rules.length; i++) {
    var rule = this.rules[i];
    // get inputMatch
    var inputMatch = rule.matchInput(sentence);
    if (inputMatch) {
      // check that we don't match an exception
      if (rule.matchException(sentence))
        continue;
      // see if there is a condition to match last reply (and if so, see if it does)
      if (rule.isMatchLastReplyRequired() && !rule.matchLastReply(this.lastReply))
        continue;
      // see if we match any variable-related conditions
      if (!rule.matchRequiredVariables(this.variables))
        continue;
      // set variables
      if (rule.set) {
        for (var key in rule.set) {
          this.variables[key] = this._replaceCaptures(inputMatch, rule.set[key], true);
        }
      }
      // reply or retry
      var action;
      if (rule.reply.length) {
        action = "reply";
        if (rule.retry.length && Math.random() > (rule.reply.length/(rule.reply.length + rule.retry.length))) {
          action = "retry";
        }
      } else if (rule.retry.length) {
        action = "retry";
      }
      if (action === "reply") {
        reply = this._getRandom(rule.reply);
        reply = this._replaceCaptures(inputMatch, reply, true);
        reply = this._replaceVariables(reply);
        return reply;
      } else if (action === "retry") {
        sentence = this._getRandom(rule.retry);
        sentence = this._replaceCaptures(inputMatch, sentence);
        return this._transformSentence(sentence, ++recursionLevel);
      }
    }
  }
  return reply;
}

DeixiBot.prototype._replaceCaptures = function(match, text, switchPerson) {
  for (var i=1; i<match.length; i++) {
    var capture = match[i];
    if (capture) {
      var capture = capture.toLowerCase();
      if (switchPerson)
        capture = this.personSub.replace(capture);
      text = text.replace(new RegExp("\\(" + i + "\\)","g"), capture);
    }
  }
  return text;
}

DeixiBot.prototype.varRx = /\(@([\w\-]+)\)/; // read-only, don't make global

DeixiBot.prototype._replaceVariables = function(text) {
  var match = text.match(this.varRx);
  while (match) {
    var value = this.variables[match[1]];
    if (typeof value !== 'string')
      value = "";
    text = text.replace(this.varRx,value);
    match = text.match(this.varRx);
  }
  return text;
}

DeixiBot.prototype._getRandom = function(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function DeixiRule(ruleData, synonymSub) {

  this.inputRxs = [];
  if (ruleData.input) {
    for (var i=0; i<ruleData.input.length; i++) {
      var input = ruleData.input[i];
      input = synonymSub.replace(input);
      var rx = new RegExp(delimitPattern(input), "i");
      this.inputRxs.push(rx);
    }
  }
  
  this.exceptRxs = [];
  if (ruleData.except) {
    for (var i=0; i<ruleData.except.length; i++) {
      var except = ruleData.except[i];
      except = synonymSub.replace(except);
      var rx = new RegExp(delimitPattern(except), "i");
      this.exceptRxs.push(rx);
    }
  }
  
  this.retry = [];
  if (ruleData.retry) {
    this.retry = ruleData.retry;
  }
  
  this.lastRxs = [];
  if (ruleData.last) {
    for (var i=0; i<ruleData.last.length; i++) {
      var last = ruleData.last[i];
      last = synonymSub.replace(last);
      this.lastRxs.push(new RegExp(delimitPattern(last), "i"));
    }
  }
   
  this.variableRxs = {};
  for (var propName in ruleData) {
    if (ruleData.hasOwnProperty(propName)) {
      if (["input","except","last","reply","retry","set"].indexOf(propName) === -1) {
        var varName = propName;
        this.variableRxs[varName] = [];
        for (var i=0; i<ruleData[varName].length; i++) {
          var varValue = ruleData[varName][i];
          if (varValue === "") {
            this.variableRxs[varName].push(new RegExp("not_set"));
          } else {
            varValue = synonymSub.replace(varValue);
            this.variableRxs[varName].push(new RegExp(delimitPattern(varValue), "i"));
          }
        }
      }
    }
  }
  
  this.reply = [];
  if (ruleData.reply) {
    this.reply = ruleData.reply;
  }
  
  this.set = {};
  if (ruleData.set) {
    this.set = ruleData.set;
  }
}

DeixiRule.prototype.matchInput = function(text) {
  return this._match(this.inputRxs, text);
}

DeixiRule.prototype.matchException = function(text) {
  return this._match(this.exceptRxs, text);
}

DeixiRule.prototype.matchLastReply = function(text) {
  return this._match(this.lastRxs, text);
}

DeixiRule.prototype.isMatchLastReplyRequired = function(text) {
  return (this.lastRxs.length > 0);
}

DeixiRule.prototype.matchVariable = function(varName, text) {
  return this._match(this.variableRxs[varName],text);
}

DeixiRule.prototype.matchRequiredVariables = function(variables) {
  for (var varName in this.variableRxs) {
    if (variables.hasOwnProperty(varName)) {
      if (!this.matchVariable(varName,variables[varName])) {
        return false;
      }
    } else {
        if (this.variableRxs[varName].toString() !== "/not_set/")
          return false;
    }
  }
  return true;
}

DeixiRule.prototype._match = function(rxs, text) {
  var match;
  for (var i=0; i<rxs.length; i++) {
    match = rxs[i].exec(text);
    if (match) break;
  }
  return match;
}

function DeixiMultiPassSub(subs) {
  this.pairs = [];
  if (subs) {
    for (var i=0; i<subs.length; i+=2) {
      var pair = new Object();   
      pair.originalRx = new RegExp(delimitPattern(subs[i]),"i");
      pair.replacement = subs[i+1];
      this.pairs.push(pair);
    }
  }
}

DeixiMultiPassSub.prototype.replace = function(text) {
  for (var i=0; i<this.pairs.length; i++) {
    var pair = this.pairs[i];
    text = text.replace(pair.originalRx, pair.replacement);
  }
  return text;
}

function DeixiSinglePassSub(subs) {
  this.pairs = [];
  var originals = [];
  if (subs) {
    for (var i=0; i<subs.length; i+=2) {
      var pair = new Object();
      var prefix = "\\b";
      var postfix = "\\b"; 
      pair.originalRx = new RegExp(prefix + subs[i] + postfix);
      pair.replacement = subs[i+1];
      this.pairs.push(pair);
      originals.push(subs[i]);
    }
  }
  if (originals.length) {
    this.commonRx = new RegExp("\\b(" + originals.join("|") + ")\\b","gi");
  } else {
    this.commonRx = new RegExp("(?=a)b"); // never matches anything
  }
}

DeixiSinglePassSub.prototype.replace = function(text) {  
  var newText = "";
  var start = 0;
  this.commonRx.lastIndex = 0;
  while (this.commonRx.exec(text)) {
    var substring = text.substring(start, this.commonRx.lastIndex);
    for (var i=0; i<this.pairs.length; i++) {
      if (this.pairs[i].originalRx.test(substring)) {
        substring = substring.replace(this.pairs[i].originalRx, this.pairs[i].replacement);
        break;
      }
    }
    newText += substring;
    start = this.commonRx.lastIndex;
  }
  newText += text.substring(start);
  return newText;
}

function DeixiSynonymSub(synonyms) {
  this.pairs = [];
  if (synonyms) {
    for (var key in synonyms) {
      if (synonyms.hasOwnProperty(key)) {
        var pair = new Object();
        pair.originalRx = new RegExp("\\(%" + key + "\\)", "g");
        pair.replacement = "(" + synonyms[key].join("|") + ")";
        this.pairs.push(pair);
      }
    }
  }
  this.commonRx = new RegExp(/\(%([\w\-]+)\)/);
}

DeixiSynonymSub.prototype.replace = function(text) {
  if (this.commonRx.test(text)) {
    for (var i=0; i<this.pairs.length; i++) {
      var pair = this.pairs[i];
      text = text.replace(pair.originalRx, pair.replacement);
    }
  }
  return text;
}

function delimitPattern(pattern) {
  var prefix = "\\b";
  if (pattern.length > 0 && pattern[0] === '^')
    prefix = "";
  var postfix = "(\\b|$)";
  if (pattern.length > 0 && pattern[pattern.length-1] === '$')
    postfix = "";
  else if (pattern.match(/[\u00E0-\u00FC]$/i))
    postfix = "(?=([^a-z\u00E0-\u00FC]|$))";
  return prefix + pattern + postfix;
}
