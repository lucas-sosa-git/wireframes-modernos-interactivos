// JavaScript Document

var didScroll;
var lastScrollTop = 0;
var delta = 500;
$(window).scroll(function(event){
    didScroll = true;
});
setInterval(function() {
    if (didScroll) {
        hasScrolled();
        didScroll = false;
    }
}, 500);
function hasScrolled() {
    var st = $(this).scrollTop();    
    if(Math.abs(lastScrollTop - st) <= delta)
        return;    
    if (st > lastScrollTop && st > 2000){
        $('.boton_scroll_top').removeClass('ocultar').addClass('mostrar');
    } else {
        if(st + $(window).height() < $(document).height()) {
            $('.boton_scroll_top').removeClass('mostrar').addClass('ocultar');
        }
    }    
    lastScrollTop = st;
}

$('#scrollTopButton').click(function(){
        $("html, body").animate({ scrollTop: 0 }, 3000);
        return false;
});