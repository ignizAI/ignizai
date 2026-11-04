/* Journal hero: gentle mouse parallax on the drifting books */
(function(){
  var hero=document.querySelector('.ph[data-word="Journal"]'); if(!hero) return;
  var layer=hero.querySelector('.jr-books__layer'); if(!layer) return;
  if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  hero.addEventListener('mousemove',function(e){
    var r=hero.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
    layer.style.transform='translate3d('+(x*-26).toFixed(1)+'px,'+(y*-18).toFixed(1)+'px,0)';
  });
  hero.addEventListener('mouseleave',function(){ layer.style.transform=''; });
})();
