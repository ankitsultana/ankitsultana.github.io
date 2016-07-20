/* globals XMLHttpRequest $ */

var jsondata = {
  'data': [['', '']]
}
var totalPosts = 0
var totalMenu = 0
var currPost = 0
var url = 'https://ankitsultana.me/'
var xhr = new XMLHttpRequest()
xhr.onload = function () {
  jsondata = JSON.parse(xhr.responseText)
  totalPosts = jsondata['data'].length
  totalMenu = jsondata['menu'].length
  addPagers(totalPosts)
  addMenu(totalMenu)
  focusPager(0)
  setData(0)
  setProjects()
}
xhr.open('GET', url + 'data.json', true)
xhr.send()

function setData (idx) {
  $('#heading').fadeOut(function () {
    $('#heading').text(jsondata['data'][idx][0]).fadeIn()
  })
  $('#text').fadeOut(function () {
    $('#text').text(jsondata['data'][idx][1]).fadeIn()
  })
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
  var b = ''
  if (jsondata['menu'][idx]['leave']) {
    b = '<i class="fa fa-long-arrow-right"></i>'
  }
  $('#project_list').append('<li class="project_list_el"><a href="' + url + '"><p>' + nm + '</p></a><span>' + desc + ' ' + b + '</span></li>')
}
function addPagers (size) {
  for (var i = 0; i < size; i++) {
    var id = 'pager-' + i
    $('#page-number-container').append('<div id=' + id + ' class="pager"></div>')
  }
}
function focusPager (idx) {
  var id = '#pager-' + idx
  // $(id).removeClass('pager')
  $(id).addClass('pager-active')
}
function unfocusPager (idx) {
  var id = '#pager-' + idx
  $(id).removeClass('pager-active')
  // $(id).addClass('pager')
}
function setProjects () {
  for (var i = 0; i < jsondata['projects'].length; i++) {
    addProject(i)
  }
}
function addProject (idx) {
  var nm = jsondata['projects'][idx]['name']
  var url = jsondata['projects'][idx]['link']
  var desc = jsondata['projects'][idx]['desc']
  var b = ''
  if (jsondata['projects'][idx]['leave']) {
    b = '<i class="fa fa-long-arrow-right"></i>'
  }
  $('#ac_project_list').append('<li class="ac_project_list_el"><a href="' + url + '"><p>' + nm + '</p></a><span>' + desc + ' ' + b + '</span></li>')
}

function changeTo (idx) {
  if (idx === currPost) {
    return false
  }
  unfocusPager(currPost)
  currPost = idx
  setData(idx)
  focusPager(currPost)
}

var b = true
var p = false

$(document).ready(function () {
  setData(0)
  $('.overlay').hide()
  $('#ac-projects-container').hide()
  $('#overlay-toggle').on('click', function (e) {
    if (p) {
      p = false
      $('#ac-projects-container').fadeOut('slow')
      $('.ac_project_list_el').removeClass('fadeInLeft')
      $('.ac_project_list_el').addClass('fadeOut')
      $('.overlay').fadeIn('slow', function () {
      })
      $('.project_list_el').removeClass('fadeOut')
      $('.project_list_el').addClass('animated fadeInLeft')
    } else if (b) {
      $('.home-layer').fadeOut(function () {
      })
      $('#overlay-toggle').fadeOut(function () {
        $(this).text('     back').fadeIn()
      })
      $('.overlay').fadeIn('slow', function () {
      })
      $('.project_list_el').removeClass('fadeOut')
      $('.project_list_el').addClass('animated fadeInLeft')
      // $('.project_list_el').fadeIn('slow')
      b ^= true
    } else {
      $('#overlay-toggle').fadeOut(function () {
        $(this).text('').fadeIn()
        $(this).append('<i class="fa fa-bars"></i>').fadeIn()
      })
      $('.home-layer').fadeIn('slow')
      $('.overlay').fadeOut('slow', function () {
      })
      $('.project_list_el').removeClass('fadeInLeft')
      $('.project_list_el').addClass('fadeOut')
      b ^= true
    }
  })
  $(document).on('click', 'a', function (e) {
    if ($(this).text() === 'Projects') {
      p = true
      $('.overlay').fadeOut()
      $('#ac-projects-container').fadeIn('slow')
      $('.ac_project_list_el').removeClass('fadeOut')
      $('.ac_project_list_el').addClass('animated fadeInLeft')
    }
  })
  $('.icon-up-open').on('click', function (e) {
    changeTo((currPost - 1 + totalPosts) % totalPosts)
  })
  $('.icon-down-open').on('click', function (e) {
    changeTo((currPost + 1) % totalPosts)
  })
  $(document).on('click', '.pager', function (e) {
    var id = $(this).attr('id').substr($(this).attr('id').length - 1)
    changeTo(id)
  })
})
