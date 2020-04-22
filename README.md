# HoneyGainGrapher
## Installation
  1) Install npm and nodejs https://nodejs.org/en/
  2) Install python 3.x https://www.python.org/downloads/
  3) Download this repository <br> with Git `git clone https://github.com/chaos511/HoneyGainGrapher`<br>On windows download zip and extract
  4) Install all the node dependencies with `npm install` <br> On windows double click install
  5) Add auth token to config file see Finding Your Auth Token for details
  6) Start The program with `node index.js` or double click start
  7) Go to http://127.0.0.1 with any browser
## Finding Your Auth Token
  1) Go to http://https://dashboard.honeygain.com/ and login
  2) Open Devtools (in chrome you can do this with ctrl+shift+i)
  3) Go to the network tab in Devtools
  4) Click on the request for balances and look for a section labeled "Request Headers" and under that, a section labeled "authorization"
  ![Alt text](/Capture2.PNG?raw=true )
  5) Copy the auth token from the authorization section starting after the word Bearer and past it into the file config/default.json
  
## Features
  Adjustable ping interval<br>
  Supports custom device titles (on honeygains website)<br>
  Supports Multipage Active Devices lists(more than 10 devices)<br>
  Dashboard with earning stats and estomated next payout<br>
  TODO: Drops sample points when data is older than x days to save space<br>
  TODO: Runs in the background as a service<br>
  TODO: Supports HTTP basic auth for password protection<br>
  TODO: Pool mode where multiple devices can summed into a user<br>

## Config File
  The config file is located at config/default.json the felds in the config file are
   
  authToken: This is where you need to put your honeygain auth token

  pingInterval: How offen to record data
  
  startOnTheHour: If the ping interval should start counting from on the hour example x:00:00 instead of when the program starts

  graphTitle: The title to be showen above the graph on the  webpage

  webserverPort: The port the webserver should sisten on

  webserverHost: The ip address the webserver should sisten on


## Image
![Alt text](/Capture.PNG?raw=true )

  
  
  
