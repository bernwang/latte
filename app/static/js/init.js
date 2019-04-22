FRAMES_TABLE = "#frames-table"
OBJECT_TABLE = "#object-table"
COLOR_RED =  new THREE.Color( 1,0,0 );
COLOR_WHITE = new THREE.Color( 1,1,1 );
DATA_STRIDE = 4;
FRAME_ROW_FOCUS = "rgba(120, 120, 120, 1)";
FRAME_ROW_NORMAL = "rgba(80, 80, 80, 0.7)";

/* Variables to toggle */
var enable_predict_label = false;
var enable_mask_rcnn = false;
var enable_one_click_annotation = true;
var enable_bounding_box_tracking = true;



String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

function eventFire(el, etype){
  if (el.fireEvent) {
    el.fireEvent('on' + etype);
  } else {
    var evObj = document.createEvent('Events');
    evObj.initEvent(etype, true, false);
    el.dispatchEvent(evObj);
  }
}

function pathJoin(parts, sep){
   var separator = sep || '/';
   var replace   = new RegExp(separator+'{1,}', 'g');
   return parts.join(separator).replace(replace, separator);
}
