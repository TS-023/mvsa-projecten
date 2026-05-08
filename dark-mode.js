/* Donkere modus — herstellen bij laden */
(function(){
  if(localStorage.getItem('mvsa.dark') === '1')
    document.documentElement.setAttribute('data-theme', 'dark');
})();
