// $( document ).click(function() {
//   $( "#toggle" ).toggle( { direction: "left" } );
// });
$(document).ready(function(){
    $("#flip").click(function(){
        $("#panel").slideToggle("slow");
    });
});

$(document).ready(function(){
    $("#flip2").click(function(){
        $("#panel2").slideToggle("slow");
    });
});