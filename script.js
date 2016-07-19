/* globals XMLHttpRequest $ */

var jsondata = {
  'data': [['', '']]
}
var total = 0
var curr = 0
var url = 'http://127.0.0.1:8080/'
var xhr = new XMLHttpRequest()
xhr.onload = function () {
  jsondata = JSON.parse(xhr.responseText)
  total = jsondata['data'].length
  addPagers(total)
  focusPager(0)
}
xhr.open('GET', url + 'data.json', true)
xhr.send()

function setData (idx) {
  $('#heading').text(jsondata['data'][idx][0])
  $('#text').text(jsondata['data'][idx][1])
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

$(document).ready(function () {
  setData(0)
  $('.icon-up-open').on('click', function (e) {
    unfocusPager(curr)
    curr = (curr - 1 + total) % total
    focusPager(curr)
    setData(curr)
  })
  $('.icon-down-open').on('click', function (e) {
    unfocusPager(curr)
    curr = (curr + 1) % total
    focusPager(curr)
    setData(curr)
  })
})
