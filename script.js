/* globals XMLHttpRequest $ */

var jsondata = {
  'data': [['', '']]
}
var totalPosts = 0
var totalMenu = 0
var currPost = 0
var url = 'http://127.0.0.1:8080/'
var xhr = new XMLHttpRequest()
xhr.onload = function () {
  jsondata = JSON.parse(xhr.responseText)
  totalPosts = jsondata['data'].length
  totalMenu = jsondata['menu'].length
  addPagers(totalPosts)
  addMenu(totalMenu)
  focusPager(0)
}
xhr.open('GET', url + 'data.json', true)
xhr.send()

function setData (idx) {
  $('#heading').text(jsondata['data'][idx][0])
  $('#text').text(jsondata['data'][idx][1])
}

function addMenu (size) {
  for (var i = 0; i < size; i++) {
    setMenu(i)
  }
}

function setMenu (idx) {
  var url = jsondata['menu'][idx]['link']
  var nm = jsondata['menu'][idx]['name']
  var desc = jsondata['menu'][idx]['desc']
  $('#project_list').append('<li class="project_list_el"><a href="' + url + '"><p>' + nm + '</p></a><span>' + desc + '</span></li>')
}

function addPagers (size) {
  for (var i = 0; i < size; i++) {
    var id = 'pager-' + i
    $('#page-number-container').append('<div id=' + id + ' class="pager"></div>')
  }
}

function focusPager (idx) {
  var id = '#pager-' + idx
  $(id).removeClass('pager')
  $(id).addClass('pager-active')
}

function unfocusPager (idx) {
  var id = '#pager-' + idx
  $(id).removeClass('pager-active')
  $(id).addClass('pager')
}

var b = true

$(document).ready(function () {
  setData(0)
  $('#overlay').hide()
  $('#overlay-toggle').on('click', function (e) {
    console.log('clicked')
    if (b) {
      $('.home-layer').fadeOut()
      $('#overlay').show()
      $('.project_list_el').removeClass('fadeOut')
      $('.project_list_el').addClass('animated fadeInLeft')
      // $('.project_list_el').fadeIn('slow')
    } else {
      $('.home-layer').fadeIn('slow')
      $('#overlay').fadeOut('slow')
      $('.project_list_el').removeClass('fadeInLeft')
      $('.project_list_el').addClass('fadeOut')
    }
    b ^= true
  })
  $('.icon-up-open').on('click', function (e) {
    unfocusPager(currPost)
    currPost = (currPost - 1 + totalPosts) % totalPosts
    focusPager(currPost)
    setData(currPost)
  })
  $('.icon-down-open').on('click', function (e) {
    unfocusPager(currPost)
    currPost = (currPost + 1) % totalPosts
    focusPager(currPost)
    setData(currPost)
  })
})
