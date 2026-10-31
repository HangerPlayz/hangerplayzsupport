/* Footer: fills in config-driven values. */
(function () {
  var HP = window.HP;
  HP.components.Footer = function () {
    HP.$("#footUpi").textContent = HP.config.payment.upiId;
  };
})();
