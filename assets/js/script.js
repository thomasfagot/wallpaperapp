const request = require('request')
const remote = require('electron').remote
const {width, height} = remote.screen.getPrimaryDisplay().workAreaSize
window.jquery = window.$ = require('jquery')
const userDataPath = (remote.app).getPath('userData')
let page = 1
let per_page = 60

function loadPixabay() {
  let loader = $('#loader')
  let load_more = $('#load-more')
  let wrapper = $('#wrapper');
  let endpoint = 'https://pixabay.com/api'
    + '?key=8734742-434607e3b811deadd84c5d69e'
    + '&per_page=' + per_page
    + '&page=' + page
    + '&orientation=horizontal'
    + '&min-width=' + width
    + '&min-height=' + height
    + '&safesearch=false'
    + '&q=' + encodeURI($('#search').val())

  loader.show()
  load_more.hide()

  request(endpoint, (r, s, b) => {
    loader.hide()
    let results = JSON.parse(b)
    if (page === 1) {
      wrapper.html('')
    }
    load_more.toggle(results.totalHits > per_page * page)
    if (results.hits.length > 0) {
      $.each(results.hits, (i) => {
        wrapper.append('<div class="widget">' +
          '<img class="widget_photo" src="' + results.hits[i].webformatURL + '">' +
          '<div class="widget_details">' +
          '<a data-id="' + results.hits[i].largeImageURL + '" class="butn butn-primary" onclick="setWallpaper(this)">Set Wallpaper</a></div></div>')
      })
    } else {
      wrapper.append('<span>No results.</span>')
    }
  })
}

function loadBing() {
  let loader = $('#loader')
  let load_more = $('#load-more')
  let wrapper = $('#wrapper');
  let endpoint = 'https://www.bing.com/images/async'
    + '?q=' + encodeURI($('#search').val())
    + '&first=' + ((page - 1) * per_page)
    + '&count=' + per_page
    + '&qft=+filterui%3aimagesize-custom_' + width + '_' + height
    + '+filterui%3aphoto-photo+filterui%3aaspect-wide'
    + '&adlt=off'

  loader.show()
  load_more.hide()

  request(endpoint, (r, s, b) => {
    loader.hide()
    if (page === 1) {
      wrapper.html('')
    }
    let results = b.match(/m="\{[^\}]+\}/g)
    if (results) {
      load_more.show()
      $.each(results, (i) => {
        results[i] = JSON.parse(results[i].replace(/m="/g, '').replace(/\&quot\;/g, '"'))
        wrapper.append('<div class="widget">' +
          '<img class="widget_photo" src="' + results[i].turl + '" alt="Could not load image"/>' +
          '<div class="widget_details">' +
          '<a data-id="' + results[i].murl + '" class="butn butn-primary" onclick="setWallpaper(this)">Set Wallpaper</a></div></div>')
      })
    } else {
      wrapper.append('<span>No results.</span>')
      load_more.hide()
    }
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

$('#search-form').submit(function (event) {
  page = 1
  loadBing()
  $("html, body").animate({ scrollTop: 0 }, "slow");
  event.preventDefault()
  return false
})

$('#load-more').click(function () {
  page += 1
  loadBing()
})
