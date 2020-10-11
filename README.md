### Hello, my name is Martin Barker and I'm a Seattle software developer who loves music.
This repo is for my personal website www.martinbarker.me
I also upload music 

## How to develop for this Website:
- Fork and clone the Repo.
- Install the packages/dependecies for this website by running the command `npm i`.
- Make changes, push them to your forked branch, and make a pull request. If It looks good I'll merge it in!

## How colors work for this website:
- Every time you load a page on this website, a random image is chosen from the folder `\static\assets\aesthetic-images`
- Color Data is generated for this image, including the 6 most prominent colors: Vibrant, Light Vibrant, Dark Vibrant, Muted, Light Muted, and Dark Muted.
- These colors are sent to the page's CSS content to color different parts of the page.
- For each area where color is applied, the text color is also calculated as to weather it is better to color the text black or white.

## Pages on this site:

# Home
-  Info about myself.

# Projects / tagger.site
- Generate a timestamped tracklist based on a Discogs URl or File Upload.
- Generate comma separated metadata tags based on a Discogs URL.

# Projects / audio-archiver
- Electron app availiable for free download on Windows/Mac/Linux.
- Render videos by combining a single audio file or multiple audio files and an image.

# Projects / popularify
- Organize a Spotify artist's discography by Popularity (Need to migrate from Python3 Django to Node.js)

### Future To-Do:
- Improve tagger.site UI
