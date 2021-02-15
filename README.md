# comic reader

This is a Electron application designed for reading comics based on the [Quick Start Guide](https://electronjs.org/docs/tutorial/quick-start).


This Electron application needs just these files:

- `package.json` - Points to the app's main file and lists its details and dependencies.
- `main.js` - Starts the app and creates a browser window to render HTML. This is the app's **main process**.
- `index.html` - A web page to render. This is the app's **renderer process**.
- `renderer.html` - Most of js needed.


## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/MoonWhiteZqy/comic_reader
# Go into the repository
cd comic_reader
# Install dependencies
npm install
# Run this app
electron .
# Release this app
npm start
```

Note: Your comic folder shoule be like this:
```bash
comic_folder
   |
   |-chapter 1
   |
   |-chapter 2
   ...
   |
   |-chapter n

And each folder shoule contain some jpg with index,
e.g.
1.jpg 2.jpg ... 20.jpg
```