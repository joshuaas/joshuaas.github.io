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

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function initializeGallery(root) {
    var track = root.querySelector("[data-gallery-track]");
    var cards = Array.prototype.slice.call(root.querySelectorAll("[data-gallery-card]"));
    var indicators = Array.prototype.slice.call(root.querySelectorAll("[data-gallery-index]"));
    var playback = root.querySelector("[data-gallery-playback]");
    var previous = root.querySelector("[data-gallery-previous]");
    var next = root.querySelector("[data-gallery-next]");
    if (!track || !cards.length || !playback) return;
    var current = 0;
    var playing = true;
    var visible = false;
    var focused = false;
    var timer = null;
    var scrollFrame = null;
    var target = null;
    var label = root.getAttribute("aria-labelledby");
    var heading = document.getElementById(label);
    var name = heading ? heading.textContent : "课程";
    var interval = 12000;

    function position(index) {
      return cards[index].offsetLeft - cards[0].offsetLeft;
    }

    function schedule(reset) {
      var running = playing && visible && !focused && !document.hidden;
      if (!running || reset === true) {
        window.clearTimeout(timer);
        timer = null;
      }
      root.setAttribute("data-timing", String(running));
      if (running && timer === null) {
        timer = window.setTimeout(function () {
          goTo((current + 1) % cards.length, false);
        }, interval);
      }
      playback.setAttribute("aria-pressed", String(playing));
      playback.setAttribute("aria-label", (playing ? "暂停" : "开始") + name + "自动播放");
    }

    function update(index) {
      current = index;
      indicators.forEach(function (button, index) {
        button.setAttribute("aria-pressed", String(index === current));
      });
      previous.disabled = current === 0;
      next.disabled = current === cards.length - 1;
      root.setAttribute("data-current-index", String(current));
      cards.forEach(function (card, index) { card.setAttribute("data-current", String(index === current)); });
      var indicator = indicators[current];
      var nav = indicator.parentNode;
      nav.scrollTo({ left: indicator.offsetLeft - nav.offsetLeft - (nav.clientWidth - indicator.offsetWidth) / 2, behavior: reducedMotion.matches ? "auto" : "smooth" });
      schedule(true);
    }

    function goTo(index, manual) {
      if (manual) playing = false;
      index = Math.max(0, Math.min(cards.length - 1, index));
      target = index;
      track.scrollTo({ left: position(index), behavior: reducedMotion.matches ? "auto" : "smooth" });
      update(index);
    }

    indicators.forEach(function (button, index) {
      button.addEventListener("click", function () { goTo(index, true); });
    });
    previous.addEventListener("click", function () { goTo(current - 1, true); });
    next.addEventListener("click", function () { goTo(current + 1, true); });
    playback.addEventListener("click", function () {
      playing = !playing;
      schedule();
    });
    track.addEventListener("keydown", function (event) {
      // Keep keyboard interaction with downloads intact.
      if (event.target !== track) return;
      var index = current;
      if (event.key === "ArrowRight") index += 1;
      else if (event.key === "ArrowLeft") index -= 1;
      else if (event.key === "Home") index = 0;
      else if (event.key === "End") index = cards.length - 1;
      else return;
      event.preventDefault();
      goTo(index, true);
    });
    track.addEventListener("pointerdown", function () { target = null; playing = false; schedule(); });
    track.addEventListener("wheel", function (event) {
      if (event.deltaX || event.shiftKey) { target = null; playing = false; schedule(); }
    }, { passive: true });
    track.addEventListener("scroll", function () {
      if (scrollFrame !== null) return;
      scrollFrame = window.requestAnimationFrame(function () {
        scrollFrame = null;
        if (target !== null) {
          if (Math.abs(position(target) - track.scrollLeft) < 2) target = null;
          else return;
        }
        var nearest = 0;
        cards.forEach(function (card, index) {
          if (Math.abs(position(index) - track.scrollLeft) < Math.abs(position(nearest) - track.scrollLeft)) nearest = index;
        });
        if (nearest !== current) update(nearest);
      });
    }, { passive: true });
    // Pause for interaction with card contents, but let the focused play control start its timer.
    root.addEventListener("focusin", function (event) { focused = track.contains(event.target); schedule(); });
    root.addEventListener("focusout", function (event) {
      focused = !!event.relatedTarget && track.contains(event.relatedTarget);
      schedule();
    });
    document.addEventListener("visibilitychange", schedule);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        root.setAttribute("data-in-view", String(visible));
        schedule();
      }, { threshold: 0 }).observe(root);
    } else {
      visible = true;
      root.setAttribute("data-in-view", "true");
    }
    var resizeFrame = null;
    function resizeGallery() {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(function () {
        track.scrollTo({ left: position(current), behavior: "auto" });
        schedule();
      });
    }
    if ("ResizeObserver" in window) new ResizeObserver(resizeGallery).observe(track);
    else window.addEventListener("resize", resizeGallery);
    update(0);
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-gallery]"), initializeGallery);

  Array.prototype.forEach.call(document.querySelectorAll("[data-tabset]"), initializeTabs);
  document.documentElement.classList.add("course-ready");

  var logo = document.querySelector(".course-logo");
  var wordmark = document.querySelector(".logo-wordmark");
  if (logo && wordmark) {
    var narrowScreen = window.matchMedia("(max-width: 760px)");
    function arrangeLogo() {
      logo.setAttribute("viewBox", narrowScreen.matches ? "0 0 660 760" : "0 0 1450 600");
      var position = narrowScreen.matches ? [15, 540, 630, 210] : [700, 130, 720, 300];
      ["x", "y", "width", "height"].forEach(function (attribute, index) {
        wordmark.setAttribute(attribute, position[index]);
      });
    }
    arrangeLogo();
    if (narrowScreen.addEventListener) narrowScreen.addEventListener("change", arrangeLogo);
    else narrowScreen.addListener(arrangeLogo);
  }

  var hero = document.querySelector(".course-hero");
  if ("IntersectionObserver" in window && hero) {
    new IntersectionObserver(function (entries) {
      document.body.classList.toggle("hero-offscreen", !entries[0].isIntersecting);
    }).observe(hero);
  }
}());
