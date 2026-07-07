(function () {
  var target = document.documentElement.dataset.target || "../app.html";
  var destination = new URL(target, window.location.href);
  destination.search = window.location.search;
  destination.hash = window.location.hash;
  window.location.replace(destination.toString());
})();
