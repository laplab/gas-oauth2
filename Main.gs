/**
 * Handles GET requests to the app
 * @param {object} e Data&info from request
 * @function
 */
function doGet(e) {
  
  // scopes you want get access to
  var scopes = [
    'https://www.googleapis.com/auth/glass.timeline',
    'https://www.googleapis.com/auth/glass.location',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];
  var LogIn = new OAuth2('app client id', 'app client password', scopes);
  
  var link = LogIn.auth(e), html = 'You have successfully logged in!';
  
  
  if(link != false)
    html = '<a href="'+res+'">Would you like to log in?</a>';
  
  return HtmlService.createHtmlOutput('<html><body>'+html+'</body></html>');
}

/**
 * Logs tokens in logger (hit to see logs Ctrl+Enter, only for debug)
 * @function
 */
function scanProps(){
  var props = PropertiesService.getUserProperties();
  Logger.log(props.getProperty('access'));
  Logger.log(props.getProperty('refresh'));
  
  var ts = ScriptApp.getProjectTriggers();
  for(var t in ts)
    Logger.log(ts[t].getHandlerFunction());
}

/**
 * Deletes tokens (only for debug)
 * @function
 */
function deleteProps(){
  var a;
  var ts = ScriptApp.getProjectTriggers();
  for(var t in ts)
    ScriptApp.deleteTrigger(ts[t]);
  if(a = PropertiesService.getUserProperties().getProperty('access'))
    UrlFetchApp.fetch("https://accounts.google.com/o/oauth2/revoke?token="+a);
  PropertiesService.getUserProperties().deleteAllProperties();
  ScriptApp.invalidateAuth();
}