$(document).ready(function () {
  // 🔹 Sidebar Accordion (toggle submenu)
  $(".sidebar-wrapper").on("click", ".has-submenu > .sidebar-nav-link", function (e) {
    e.preventDefault();

    const $parent = $(this).closest(".has-submenu");
    const $submenu = $parent.children(".submenu");
    const isOpen = $submenu.is(":visible");

    // Close other open submenus at the same level
    $parent.siblings(".has-submenu").removeClass("open")
      .children(".submenu").slideUp(200);
    $parent.siblings(".has-submenu").find(".rotate-icon").removeClass("rotate");

    // Toggle current submenu
    if (isOpen) {
      $submenu.slideUp(200);
      $parent.removeClass("open");
      $parent.find(".rotate-icon").removeClass("rotate");
    } else {
      $submenu.slideDown(200);
      $parent.addClass("open");
      $parent.find(".rotate-icon").addClass("rotate");
    }

  });

  // 🔹 Highlight active link on load
  const currentPage = window.location.pathname.split("/").pop();
  let $activeLink = null;

  $(".sidebar-nav-link[href]").each(function () {
    const href = $(this).attr("href");
    if (href === currentPage) {
      $activeLink = $(this);
      return false; // stop looping
    }
  });

  if ($activeLink) {
    // Remove open states from everything first
    $(".has-submenu").removeClass("open").children(".submenu").hide();
    $(".rotate-icon").removeClass("rotate");

    // Add active classes only to the current path
    $activeLink.addClass("active");
    const $parentMenu = $activeLink.closest(".has-submenu");
    $parentMenu.addClass("open").children(".submenu").show();
    $parentMenu.children(".sidebar-nav-link")
      .addClass("active")
      .find(".rotate-icon").addClass("rotate");
  }

  // 🔹 Mobile sidebar close behavior
  $(".sidebar-nav-link[href]").on("click", function () {
    if ($(window).width() < 1200) {
      $(".sidebar-wrapper").removeClass("active");
    }
  });

  // 🔹 Recheck mobile resize
  $(window).on("resize", function () {
    if ($(this).width() >= 1200) {
      $(".sidebar-wrapper").removeClass("active");
    }
  });


  // 🔹 Sidebar link focus behavior
  $(".sidebar-wrapper").on("click", ".sidebar-nav-link", function () {
    $(".sidebar-nav-link").removeClass("focus");
    $(this).addClass("focus");
  });


  // 🔹 Sidebar collapse toggle
  $('.btn-toggle').on('click', function () {
    $('.layout-wrapper').toggleClass('collapsed');
    $('.sidebar-overlay').addClass('show');
  });

  $('.sidebar-overlay').on('click', function () {
    $('.layout-wrapper').removeClass('collapsed');
    $(this).removeClass('show');
  });


  // Load saved theme from localStorage or default to light
  let savedTheme = localStorage.getItem("theme") || "light";
  $("html").attr("data-bs-theme", savedTheme);

  // Update icon based on saved theme
  updateIcon(savedTheme);

  // On click, toggle theme
  $(".theme-toggle-btn").on("click", function () {
    let currentTheme = $("html").attr("data-bs-theme");
    let newTheme = currentTheme === "light" ? "dark" : "light";

    $("html").attr("data-bs-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateIcon(newTheme);
  });

  // Function to update the icon dynamically
  function updateIcon(theme) {
    const icon = $(".theme-toggle-btn i");
    if (theme === "light") {
      icon.removeClass("bx-sun").addClass("bx-moon"); // 🌙 show moon in light mode
    } else {
      icon.removeClass("bx-moon").addClass("bx-sun"); // ☀️ show sun in dark mode
    }
  }


});
