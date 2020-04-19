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
  TODO: Supports custom device titles (on honeygains website)<br>
  TODO: Run in the background as a service<br>
  TODO: Supports Multipage Active Devices lists(more than 10 devices)
## Image
![Alt text](/Capture.PNG?raw=true )

  
  
  
