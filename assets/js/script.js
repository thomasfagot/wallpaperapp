const request = require('request')
const remote = require('electron').remote
const {width, height} = remote.screen.getPrimaryDisplay().workAreaSize
const {read, write} = require('node-yaml')
const userDataPath = (remote.app).getPath('userData')
window.jquery = window.$ = require('jquery')

init()

$('#search-form').submit((event) => {
  window.page = 1
  loadBing()
  $("html, body").animate({scrollTop: 0}, "slow");
  event.preventDefault()
  return false
})

$('#load-more').click(() => {
  window.page += 1
  loadBing()
})

$(document).ready(() => {
  $('body').append('<div id="toTop" class="btn btn-info"><span class="fa fa-chevron-up"></span></div>')
  $(window).scroll(() => {
    if ($(this).scrollTop() !== 0) {
      $('#toTop').fadeIn()
    } else {
      $('#toTop').fadeOut()
    }
  })
  $('#toTop').click(() => {
    $("html, body").animate({scrollTop: 0}, 600)
    return false
  })
})

function init() {
  window.page = 1
  //load default configuration
  window.config = {
    adult_content_filter: "moderate",
    interval: 120,
    items_per_page: 25,
    keywords: [],
    min_width: width,
    min_height: height,
    orientation: 'wide'
  }
  read('./config.yml', 'utf8', (err, data) => {
    if (typeof data.min_width === 'undefined' || !data.min_width) {
      data.min_width = width
    }
    if (typeof data.min_height === 'undefined' || !data.min_height) {
      data.min_height = height
    }
    data.keywords.sort((a, b) => a.localeCompare(b))
    window.config = data
    $.each(data.keywords, (i) => {
      addKeywordHtml(data.keywords[i])
    })
  })
}

function addKeywordHtml(value) {
  $('#keyword-container').append(
    '<div class="badge badge-primary keyword-block mr-2 p-2" data-content="' + value + '">'
    + '<span class="keyword" onclick="searchKeyword(this)">' + value + '</span>'
    + '&nbsp;<i class="fa fa-times" onclick="removeKeyword(this)"></i>'
    + '</span></div>'
  )
}

function searchKeyword(element) {
  $('#search').val($(element).closest('.keyword-block').data('content'))
  loadBing()
}

function removeKeyword(element) {
  let keyword = $(element).closest('.keyword-block').data('content')
  let index = window.config.keywords.indexOf(keyword)
  if (index !== -1) {
    window.config.keywords.splice(index, 1)
  }
  $(element).closest('.keyword-block').remove()
  write('./config.yml', window.config)
  let $search = $('#search');
  if ($search.val() === keyword) {
    $search.val('')
    loadBing()
  }
}

$('#addKeyword').click(() => {
  let keyword = $('#search').val()
  if (keyword && window.config.keywords.indexOf(keyword) === -1) {
    window.config.keywords.push(keyword)
    window.config.keywords.sort((a, b) => a.localeCompare(b))
    write('./config.yml', window.config)
    $('.keyword-block').remove()
    $.each(window.config.keywords, (i) => addKeywordHtml(window.config.keywords[i]))
  }
})

function loadBing() {
  let loader = $('#loader')
  let load_more = $('#load-more')
  let wrapper = $('#wrapper');
  let endpoint = 'https://www.bing.com/images/async'
    + '?q=' + encodeURI($('#search').val())
    + '&first=' + ((window.page - 1) * window.config.items_per_page)
    + '&count=' + window.config.items_per_page
    + '&qft=+filterui%3aimagesize-custom_' + window.config.min_width + '_' + window.config.min_height
    + '+filterui%3aphoto-photo+filterui%3aaspect-' + window.config.orientation
    + '&adlt=' + window.config.adult_content_filter

  loader.show()
  load_more.hide()

  request(endpoint, (r, s, b) => {
    loader.hide()
    if (window.page === 1) {
      wrapper.html('')
    }
    let results = b.match(/m="{[^}]+}/g)
    if (results) {
      load_more.show()
      $.each(results, (i) => {
        results[i] = JSON.parse(results[i].replace(/m="/g, '').replace(/&quot;/g, '"'))
        wrapper.append('<div class="col-md-4 col-xs-1 text-center">' +
          '<img class="img-fluid" src="' + results[i].turl + '" alt="Could not load image"/>' +
          '<div class="widget_details">' +
          '<a data-id="' + results[i].murl + '" class="butn butn-primary" onclick="setWallpaper(this)">Set Wallpaper</a></div></div>')
      })
    } else {
      wrapper.append('<div class="col-12">No results.</div>')
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
