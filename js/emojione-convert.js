window.onload = function () {
    var inputs = document.getElementsByClassName("emojione");
    var i;
    for (i = 0; i < inputs.length; i++) {
    	inputs[i].innerHTML = emojione.toImage(inputs[i].textContent);
    }
  }

