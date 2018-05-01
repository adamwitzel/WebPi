console.log('testing');
var http = require('http');
var crypto = require('crypto');
var child_process= require('child_process');

var textBody = require('body');

var requestCounter = 0;
var updateCounter = 0;

http.createServer(function (request, response) {
  // Send the HTTP header
  // HTTP Status: 200 : OK
  // Content Type: text/plain
  response.writeHead(200, {'Content-Type': 'text/plain'});

  // Send the response body
  response.write('Hello World. This is Node.js.\n')
  requestCounter++;
  response.write('requestCounter: ' + requestCounter + '\n');
  requestCounter %= 1000;
  response.write('updateCounter: ' + updateCounter);
  response.end();
}).listen(8081);


// Github webhooks
http.createServer(function (request, response) {
  request.on('error', (err) => {
    console.error(err);
    response.statusCode = 400;
    response.end();
    return;
  });

  response.on('error', (err) => {
    console.error(err);
  });


  const { headers } = request;
  if (
    request.method === 'POST'
    && headers['x-github-event'] === 'push'
    && headers['user-agent'].startsWith('GitHub-Hookshot/')
  ) {
    textBody(request, response, function(err, payload_body) {
      var signature = Buffer.from(headers['x-hub-signature'], 'utf8');

      if (validate_github_webhook(signature, payload_body)) {
        console.log('Success');
        response.statusCode = 200;
        updateCounter++;
        updateCounter %= 1000;

        auto_update();
      } else {
        console.log('Failure');
        response.statusCode = 403;
      }

      response.setHeader('Content-Type', 'application/json');
      response.end();
    })
  } else {
    console.log('github_deploy not from github');
    response.statusCode = 403;
    response.end();
  }
}).listen(8082);


function validate_github_webhook(signature, payload_body) {
  console.log('Running validate function');

  var hmac = crypto.createHmac('sha1', process.env.WebPi_GitHub_Token);
  hmac.update(payload_body);

  const digest = Buffer.from('sha1=' + hmac.digest('hex'), 'utf8');
  return crypto.timingSafeEqual(digest, signature);
}


function auto_update() {
  console.log('Auto-updating...');
  child_process.exec('sudo /home/yizow/test.sh', (err, stdout, stderr) => {
    if (err) {
      return;
    }

    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
}

