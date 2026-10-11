(function () {
  "use strict";

  function initializeTabs(root) {
    var tabs = Array.prototype.filter.call(root.querySelectorAll('[role="tab"]'), function (tab) {
      return tab.closest("[data-tabset]") === root;
    });
    if (!tabs.length) return;
    var panels = tabs.map(function (tab) {
      return document.getElementById(tab.getAttribute("aria-controls"));
    });
    if (panels.some(function (panel) { return !panel; })) return;
    var vertical = tabs[0].parentNode.getAttribute("aria-orientation") === "vertical";

    function activate(index, moveFocus) {
      tabs.forEach(function (tab, position) {
        var selected = index === position;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        panels[position].setAttribute("data-active", String(selected));
        panels[position].setAttribute("aria-hidden", String(!selected));
        panels[position].inert = !selected;
      });
      if (moveFocus) tabs[index].focus();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () { activate(index, false); });
      tab.addEventListener("keydown", function (event) {
        var next = index;
        if (event.key === (vertical ? "ArrowDown" : "ArrowRight")) next = (index + 1) % tabs.length;
        else if (event.key === (vertical ? "ArrowUp" : "ArrowLeft")) next = (index + tabs.length - 1) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        activate(next, true);
      });
    });
    activate(Number(root.getAttribute("data-initial-tab")) || 0, false);
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-tabset]"), initializeTabs);
  document.documentElement.classList.add("course-ready");

  // Keep illustration animations local to the cards visible on screen.
  var cards = document.querySelectorAll(".course-card");
  if ("IntersectionObserver" in window) {
    var artObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle("art-in-view", entry.isIntersecting);
      });
    }, { rootMargin: "80px 0px" });
    Array.prototype.forEach.call(cards, function (card) { artObserver.observe(card); });
  } else {
    Array.prototype.forEach.call(cards, function (card) { card.classList.add("art-in-view"); });
  }

  var hero = document.querySelector(".course-hero");
  if ("IntersectionObserver" in window && hero) {
    new IntersectionObserver(function (entries) {
      document.body.classList.toggle("hero-offscreen", !entries[0].isIntersecting);
    }).observe(hero);
  }
}());
