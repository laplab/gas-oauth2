/**
 * OAuth2 lib object
 * @constructor
 * @param {string} id Client id of app
 * @param {string} secret Client secret of app
 * @param {array} scopes Array of scopes for app
 * @param {string} v Name of variable for storing special code from Google in GET
 * @param {string} a Name of variable for storing access token in UserProperties
 * @param {string} r Name of variable for storing refresh token in UserProperties
 */
var OAuth2 = function(id, secret, scopes, v, a, r){
  this.client = {id: id, secret: secret};
  this.url = {
    auth: 'https://accounts.google.com/o/oauth2/auth',
    token: 'https://accounts.google.com/o/oauth2/token',
    redirect: ScriptApp.getService().getUrl(),
    confirm: ''
  };
  this.url.confirm = this.url.auth+'?approval_prompt=force&access_type=offline&response_type=code&client_id='+this.client.id+'&redirect_uri='+this.url.redirect+'&scope='+encodeURIComponent(scopes.join(' '))+'&state=/profile';
  this.props = PropertiesService.getUserProperties();
  this.v = v || 'code';
  this.a = a || 'access';
  this.r = r || 'refresh';
}

/**
 * Starts OAuth2 process
 * @param {object} e Data and info from request
 * @memberof OAuth2
 * @method
 * @todo Remove dependency of event object structure
 */
OAuth2.prototype.auth = function(e){
  if(e.parameter.error)
    Logger.log('OAuth2: Error occurred: '+e.parameter.error)
  else if(e.parameter[this.v]){
    this.getToken(e.parameter[this.v]);
    Logger.log('OAuth2: Token is stored in UserProperties');
  }else if(this.tokenValid())
    Logger.log('OAuth2: Token is already exist, calling of function OAuth2.auth() is rejected');
  else{
    Logger.log('OAuth2: Token doesn\'t exist, function OAuth2.auth() returns URL for authorization');
    return this.url.confirm;
  }

  return false;
}

/**
 * Naive check for "is token valid?"
 * @method
 * @memberof OAuth2
 */
OAuth2.prototype.tokenValid = function(){
  var token = this.props.getProperty(this.a);
  return !!token;
}

/**
 * Gets access token by the code (first token)
 * @param {string} code Code from Google (first token)
 * @method
 * @memberof OAuth2
 */
OAuth2.prototype.getToken = function(code){
  var params = {
     method : 'post',
     payload : 'client_id='+this.client.id+'&client_secret='+this.client.secret+'&grant_type=authorization_code&redirect_uri='+this.url.redirect+'&code='+code
   };
  
  var response = UrlFetchApp.fetch(this.url.token, params).getContentText();   
  var tokens = JSON.parse(response);
  
  Logger.log(tokens);
  
  this.props.setProperty(this.a, tokens.access_token);
  this.props.setProperty(this.r, tokens.refresh_token);
  
  // run trigger for refreshing token
  ScriptApp.newTrigger(this.refreshToken.name).timeBased().after((parseInt(tokens["expires_in"])-60)*1000).create();
}

/**
 * Function for calling in trigger fore refreshing. Trigger needs function name, so we can make this a method of OAuth2 constructor. It will have no name in instances.
 * @function
 */
function GoogleOAuth2LibRefreshTokenFunction(){
  // Delete source trigger
  var triggers = ScriptApp.getProjectTriggers();
  for (var i in triggers)
    if (triggers[i].getHandlerFunction() == arguments.callee.name) { // w/o hardcoding function's name
      ScriptApp.deleteTrigger(triggers[i]);
      break;
    }
  
  // Delete OAuth token property
  this.props.deleteProperty(this.a);
  
  var token = this.requestToken();
  this.props.setProperty("access", token["access_token"]);
  // Create new trigger
  Logger.log("OAuth2: new trigger\'s expiration time: "+parseInt(token["expires_in"]));
  
  // Substructing a value resulting in 1 min to make sure token's refreshed in time
  ScriptApp.newTrigger(arguments.callee.name).timeBased().after((parseInt(token["expires_in"])-60)*1000).create();
}

/**
 * Function for getting token by the code. just for fun.
 * @param {string} code Code from Google (first token)
 * @function
 */
function GoogleOAuth2LibRequestTokenFunction(code){
  var refreshToken = this.props.getProperty(this.r);
  var params = {
    method : "post",
    payload: {
      "client_id": this.client.id,
      "client_secret": this.client.secret
    }
  };
  
  if(code) {
    params.payload.code = code;
    params.payload["grant_type"] = "authorization_code";
    params.payload["redirect_uri"] = this.url.redirect;
  }
  else if(refreshToken) {
    params.payload["refresh_token"] = refreshToken;
    params.payload["grant_type"] = "refresh_token";
  }
  else Logger.log('OAuth2: Error: Neither authorization code or refresh tokens are available');
  
  var response = UrlFetchApp.fetch("https://accounts.google.com/o/oauth2/token", params);
  var token = Utilities.jsonParse(response.getContentText());
  return token;
}