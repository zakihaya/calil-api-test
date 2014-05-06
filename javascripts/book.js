var systemid_list;
var isbn_list;
var city_selector;


var AREA_NAME_KEY = 'area_name';
var SYSTEMID_LIST_KEY = 'system_id';

$(function(){
  isbn_list = $.query.get('isbn').split(',');
  initarea();

  apishow();

  city_selector = new CalilCitySelectDlg({
    'appkey' : '94093f0ca345ad76312fe898f6347797',
    'select_func' : on_select_city
  });

  bind_events();
});

function bind_events() {
  $("#change_area").on('click', show_area_select);
}

function initarea() {
  var area_name = $.cookie(AREA_NAME_KEY);
  if (area_name) {
    systemid_list = $.cookie(SYSTEMID_LIST_KEY);
  } else {
    area_name = '東京都世田谷区';
    systemid_list = ['Tokyo_Setagaya'];
  }
  $("#select_area").text(area_name);
}

function apishow() {
    $('#calil_booklist').html('');
    $(isbn_list).each(function(i, isbn, a, b, c) {
        var thumbnail = '<a href="http://www.amazon.co.jp/exec/obidos/ASIN/' + isbn + '" target="_blank"><img border="0" src="https://images-na.ssl-images-amazon.com/images/P/' + isbn + '.09.MZZZZZZ.jpg" style="" alt="" onload="if(this.width==\'1\') this.src=\'/public/img/no-image/middle.gif\'"></a>';
        $('#calil_booklist').append('<div class="calil_book_wrapper clearfix" id="wrapper_' + isbn + '"><div class="calil_book">' + thumbnail + '<div id="' + isbn + '"></div></div><div class="calil_book_info"></div></div>');
    });
    var calil = new Calil({'appkey': '94093f0ca345ad76312fe898f6347797','render': new MyRender(),'isbn': isbn_list,'systemid': systemid_list});
    calil.search();
}

function on_select_city(systemids, area_name){
  $.cookie(SYSTEMID_LIST_KEY, systemids, { expires: 365 });
  $.cookie(AREA_NAME_KEY, area_name, { expires: 365 });

  systemid_list = systemids;
  $("#select_area").text(area_name);
  apishow();
}

function show_area_select(e) {
  e.preventDefault();
  city_selector.showDlg();
}


var MyRender = function(){};
MyRender.prototype = new CalilRender();
MyRender.prototype.render_abstract = function (isbn,systemid,data, conti){
  var text = "";
  var status = '蔵書なし';
  var status_show = status;
  var status_rank = 0;

  //優先表示するステータスを取得
  for (var i in data.libkey) {
    if (this.filter_libkey == '' || this.filter_libkey == i){
      //状況をまとめる
      var temp = data.libkey[i];
      if (this.get_rank(temp) > status_rank){
        status = temp;
        status_show = status;
        status_rank = this.get_rank(temp);
      }
    }
  }
  //システムエラー
  if (data.status == 'Error'){
    status = 'システムエラー';
    status_show = status;
  }

  var style = this.render_status(status);
  var link = 'http://calil.jp/book/' + isbn;
  text += '<div style="white-space:nowrap;">';
  text += '<a href="'+link+'" class="calil_status '+style.css+'">'+ style.status + '</a></div>';

  //検索の途中であれば40点以下は表示しない
  if ((data.status == 'Running' || conti) && this.get_rank(status) <= 40){
    return;
  }

  if ($("#"+isbn)){
    var before_s = $("#"+isbn).attr("status");
    var isup =  ((this.filter_system_id != 'all') || 
        (this.get_rank(status) > this.get_rank(before_s)));
    if (isup){
      if (data.reserveurl != ""){
        text += '<div style="clear:both">';
        text += '<a href="'+data.reserveurl+'" target="_blank"><img border="0" src="http://gae.calil.jp/public/img/gyazo/2064f557b8c17c879558165b0020ff5e.png"></a>';
        text += '</div>';
      }
      $("#"+isbn).html(text);
      $("#"+isbn).attr("status",status)
      this.showSearchProgress();
    }
  }
}
