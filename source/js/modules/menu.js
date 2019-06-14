/* global document*/
'use strict';

const $ = require('jquery');

$(document).ready(function () {
  const menuList = document.querySelector('.navigation-list');
  const menuBtn = document.querySelector('.burger-btn');
  let isOpen = true;

  menuList.classList.add('visually-hidden');

  menuBtn.addEventListener('click', () => {
    if (isOpen) {
      menuBtn.classList.add('burger-btn--forward');
      menuBtn.classList.remove('burger-btn--backward');
      menuList.classList.remove('visually-hidden');
    } else {
      menuList.classList.add('visually-hidden');
      menuBtn.classList.remove('burger-btn--forward');
      menuBtn.classList.add('burger-btn--backward');
    }

    isOpen = !isOpen;
  });
});
