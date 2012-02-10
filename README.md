Mangonel
======

Default HTML5 Canvas 2D + Node.js + Express.js + Socket.IO game project template (boilerplate?)

Based on my [default](https://github.com/Fabryz/default) app template

Mangonel is actually a stripped version of [Wander](https://github.com/Fabryz/wander), I'm trying to polish it

It provides:

* Prepared a minimal realtime multiplayer environment
* Shared classes for client / server
* Console.log debug messages
* Player connection / disconnection
* Player list management and synchronization
* Player class with id, nick, position...
* Keyboard input managements, minimal up/down/left/right supported
* Movements broadcasted with websockets
* Rate limit for sent movement messages
* Minimal server authority for player position
* Simple player visualization on HTML5 Canvas
* Uses [Paul Irish's requestAnimationFrame](http://paulirish.com/2011/requestanimationframe-for-smart-animating/)
* Toggable debug panel by pressing "\"
* Show FPS on debug panel
* Ping all connected clients, show current player ping on debug panel
* View Player list by pressing "tab"
* Collisions with map bounds

Online working demo app: [http://mangonel.nodejitsu.com/](http://mangonel.nodejitsu.com/)

TODOs:

* Viewport
* Collisions with other players
* Canvas click
* Websocket message enumeration
* Tileset engine (maybe)

Requirements
------------

* [Node.js](http://nodejs.org/)
* [Npm](http://npmjs.org/)

Modules:

* [Express](http://expressjs.com/)
* [Socket.io](http://socket.io/)

Installation
----------

1. Clone the repository with ``git clone git://github.com/Fabryz/mangonel.git YOUR_PROJECT_NAME``
2. Install dependencies with ``npm install``
3. Start the server with ``node server.js``
4. Point your browser to ``YOUR_SERVER_IP:8080``
5. Learn it, be it, develop it, play it

License
-------

MIT License

Copyright (c) 2012 Fabrizio Codello

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.