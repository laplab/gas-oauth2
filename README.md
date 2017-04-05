# OAuth2 lib for Google Apps Script
---
Represents OAuth2 object that provides several methods for OAuth2 Google authentication.

## Methods

#### OAuth2.auth(event)
If *event* is not provided returns auth link else finishes auth process with getting the token.
If process is not finished or error has occured returns *false*. All steps of process are logged with *Logger* app.

## Example
```javascript
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
```

## TODO
Fix token refresh proccess
