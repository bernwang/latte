FRAMES_TABLE = "#frames-table"
OBJECT_TABLE = "#object-table"
COLOR_RED =  new THREE.Color( 1,0,0 );
COLOR_WHITE = new THREE.Color( 1,1,1 );
DATA_STRIDE = 4;

String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};