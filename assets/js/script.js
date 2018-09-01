const request = require('request')
const remote = require('electron').remote
const fs = require('fs')
const {width, height} = remote.screen.getPrimaryDisplay().workAreaSize
const {read, write} = require('node-yaml')
const userDataPath = (remote.app).getPath('userData')
const wallpaper = require('wallpaper')
const download = require('images-downloader').images
const dest = userDataPath + '/wallpapers'
const widgetTemplate =
  '<div class="col-12 col-md-4 col-lg-3 col-xl-2 text-center mb-3 widget _CLASS_">' +
  '  <img data-id="_IMAGE_SRC_" class="img-fluid show-preview" data-position="_POSITION_" onclick="preview(this)" src="_THUMBNAIL_SRC_" alt="Could not load image"/>' +
  '  <div class="widget_details position-absolute">' +
  '    <a data-id="_IMAGE_SRC_" class="btn btn-primary set-wallpaper" onclick="setWallpaper(this)" title="Set as wallpaper">' +
  '      <i class="fa fa-image fa-inverse"></i>' +
  '    </a>' +
  '    <a data-id="_IMAGE_SRC_" class="btn btn-danger set-wallpaper removeButton" onclick="removeWallpaper(this)" title="Remove from filesystem">' +
  '      <i class="fa fa-times fa-inverse"></i>' +
  '    </a>' +
  '  </div>' +
  '</div>'
const noResultTemplate = '<div class="col-12 text-center">No results.</div>'
const keywordTemplate =
  '<div class="badge badge-primary keyword-block mr-2 p-2" data-content="_VALUE_">' +
  '  <span class="keyword" onclick="searchKeyword(this)">_VALUE_</span>' +
  '  &nbsp;<i class="fa fa-times" onclick="removeKeyword(this)"></i>' +
  '</div>'

window.jquery = window.$ = require('jquery')

init()

$(document).ready(() => {
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

  $('#search-form').submit(event => {
    window.page = 1
    loadBing()
    $('html, body').animate({scrollTop: 0}, 'slow')
    event.preventDefault()
    return false
  })

  $('#load-more').click(event => {
    event.preventDefault()
    window.page += 1
    loadBing()
    return false
  })

  $('#showHistory').click(event => {
    event.preventDefault()
    showHistory()
    return false
  })

  $(document).keydown(function(e) {
    let preview = $('#preview')
    if (preview.is(':visible')) {
      switch (e.which) {
        //escape
        case 27:
          closePreview()
          break
        //left arrow / q / a
        case 37:
        case 81:
        case 65:
          previewLeft()
          break
        //right arrow / d
        case 39:
        case 68:
          previewRight()
          break
      }
    }
  })

  $('body').append('<div id="toTop" class="btn btn-info"><span class="fa fa-chevron-up"></span></div>')
  $(window).scroll(() => {
    if ($(this).scrollTop() !== 0) {
      $('#toTop').fadeIn()
    } else {
      $('#toTop').fadeOut()
    }
  })
  $('#toTop').click(() => {
    scrollToTop()
  })
})

function init()
{
  window.eval = global.eval = function () {
    throw new Error(`Sorry, this app does not support window.eval().`)
  }
  window.page = 1
  //load default configuration
  window.config = {
    adult_content_filter: 'moderate',
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
  
  showHistory()
}

function showHistory()
{
  let $wrapper = $('#wrapper')
  let position = 1
  window.page = 1
  $wrapper.html('')
  $('#load-more').hide()
  fs.readdir(dest, (err, dir) => {
    for (let file of dir) {
      $wrapper.append(
        widgetTemplate
          .replace(/_IMAGE_SRC_/g, userDataPath + '/wallpapers/' + file)
          .replace(/_THUMBNAIL_SRC_/g, userDataPath + '/wallpapers/' + file)
          .replace(/_POSITION_/g, position)
          .replace(/_CLASS_/g, 'localImage')
      )
      position++
    }
  })
}

function addKeywordHtml(value)
{
  $('#keyword-container').append(keywordTemplate.replace(/_VALUE_/g, value))
}

function searchKeyword(element)
{
  $('#search').val($(element).closest('.keyword-block').attr('data-content'))
  loadBing()
}

function removeKeyword(element)
{
  let keyword = $(element).closest('.keyword-block').attr('data-content')
  let index = window.config.keywords.indexOf(keyword)
  if (index !== -1) {
    window.config.keywords.splice(index, 1)
  }
  $(element).closest('.keyword-block').remove()
  write('./config.yml', window.config)
  let $search = $('#search')
  if ($search.val() === keyword) {
    $search.val('')
    loadBing()
  }
}

function loadBing()
{
  let loader = $('#loader')
  let load_more = $('#load-more')
  let wrapper = $('#wrapper')
  let search = $('#search').val()
  let endpoint = 'https://www.bing.com/images/async'
    + '?q=' + encodeURI(search)
    + '&first=' + ((window.page - 1) * window.config.items_per_page)
    + '&count=' + window.config.items_per_page
    + '&qft=+filterui%3aimagesize-custom_' + window.config.min_width + '_' + window.config.min_height
    + '+filterui%3aphoto-photo+filterui%3aaspect-' + window.config.orientation
    + '&adlt=' + window.config.adult_content_filter

  closePreview()
  if (window.page === 1) {
    wrapper.html('')
  }
  load_more.hide()
  
  if (search.length === 0) {
    return false
  }
  
  loader.show()

  request(endpoint, (r, s, b) => {
    loader.hide()
    let current_count = $('.widget').length
    let results = b.match(/m="{[^}]+}/g) || []
    load_more.toggle(results.length === window.config.items_per_page)
    if (results.length) {
      $.each(results, (i) => {
        results[i] = JSON.parse(results[i].replace(/m="/g, '').replace(/&quot;/g, '"'))
        wrapper.append(
          widgetTemplate
            .replace(/_THUMBNAIL_SRC_/g, results[i].turl)
            .replace(/_IMAGE_SRC_/g, results[i].murl)
            .replace(/_POSITION_/g, (current_count + i))
            .replace(/_CLASS_/g, 'remoteImage')
        )
      })
    } else {
      wrapper.append(noResultTemplate)
    }
  })
}

function setWallpaper(e)
{
  let image = $(e).attr('data-id')
  if (image.match(/^https?/)) {
    download([image], dest)
      .then(result => {
        wallpaper.set(result[0].filename)
          .then(() => {
            $('.set-wallpaper i').removeClass('fa-check').addClass('fa-image')
            $('*[data-id="' + $(e).attr('data-id') + '"]').find('i').removeClass('fa-image').addClass('fa-check')
          })
          .catch(error => {
            alert('Image could not be set as wallpaper.')
            console.log('wallpaper error', error)
          })
      })
      .catch(error => {
        alert('Image could not be downloaded.')
        console.log('downloaded error', error)
      })
  } else {
    wallpaper.set(image).then(() => {
      $('.set-wallpaper i').removeClass('fa-check').addClass('fa-image')
      $('*[data-id="' + $(e).attr('data-id') + '"]').find('i').removeClass('fa-image').addClass('fa-check')
    })
  }
  return false
}

function preview(element)
{
  let preview = $('#preview')
  let position = parseInt($(element).attr('data-position'))
  preview.find('img').attr('src', $(element).attr('data-id'))
  $('#set-wallpaper-preview').attr('data-id', $(element).attr('data-id'))
  preview.attr('data-position', position)
  preview.css('height', $(window).height() - 66)

  $('#preview-left').toggle(position !== 1)
  $('#preview-right').toggle(position < $('.widget').length)
  
  preview.fadeIn()
}

function closePreview()
{
  $('#preview').fadeOut().find('img').attr('src', '')
  $('#set-wallpaper-preview').find('i').removeClass('fa-check').addClass('fa-image')
}

function previewLeft()
{
  let current_position = $('#preview').attr('data-position')
  if (current_position && current_position > 0) {
    $('#set-wallpaper-preview').find('i').removeClass('fa-check').addClass('fa-image')
    $('#wrapper').find('.show-preview[data-position="' + (current_position - 1) + '"]').trigger('click')
  }
  return false
}

function previewRight()
{
  let current_position = parseInt($('#preview').attr('data-position'))
  if (typeof current_position !== 'undefined' && current_position < $('.widget').length) {
    $('#set-wallpaper-preview').find('i').removeClass('fa-check').addClass('fa-image')
    $('#wrapper').find('.show-preview[data-position="' + (current_position + 1) + '"]').trigger('click')
  }
  return false
}

function scrollToTop()
{
  $('html, body').animate({scrollTop: 0}, 600)
  return false
}

function removeWallpaper(element)
{
  let filepath = $(element).data('id')
  if (fs.existsSync(filepath)) {
    fs.unlink(filepath, (err) => {
      if (err) {
        alert('An error ocurred while removing the file.')
        console.log(err)
      } else {
        let $widget = $(element).closest('.widget')
        let position = 1
        $widget.fadeOut('slow', () => {
          $widget.remove()
          $('#wrapper').find('.widget').each((index, value) => {
            let img = $(value).find('img')
            img.data('position', position)
            position++
          })
        })
      }
    })
  } else {
    alert('File not found.');
  }
}
