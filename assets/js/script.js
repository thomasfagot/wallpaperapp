const request = require('request')
const remote = require('electron').remote
const {width, height} = remote.screen.getPrimaryDisplay().workAreaSize
window.jquery = window.$ = require('jquery')
load()
const userDataPath = (remote.app).getPath('userData')

function load() {
  let endpoint = 'https://pixabay.com/api'
    + '?key=8734742-434607e3b811deadd84c5d69e'
    + '&per_page=60'
    + '&page=1'
    + '&orientation=horizontal'
    + '&min-width=' + width
    + '&min-height=' + height
    + '&safesearch=false'
    + '&q=ferrari'
  request(endpoint, (r, s, b) => {
    let results = JSON.parse(b)
    $.each(results.hits, (i) => {
      $('.wrapper').append('<div class="widget">' +
        '<img class="widget_photo" src="' + results.hits[i].webformatURL + '">' +
        '<div class="widget_details">' +
        '<a data-id="' + results.hits[i].largeImageURL + '" class="butn butn-primary right" onclick="setWallpaper(this)">Set Wallpaper</a></div></div>')
    })
  })
}

function setWallpaper(e) {
  const wallpaper = require('wallpaper')
  const download = require('images-downloader').images
  const dest = userDataPath + '/wallpapers'
  let images = [$(e).attr('data-id')]
  download(images, dest)
    .then(result => {
      wallpaper.set(result[0].filename)
    })
    .catch(error => console.log("downloaded error", error))
}
