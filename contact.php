<?php

  /* Задаем переменные */
  $name = htmlspecialchars($_POST["name"]);
  $email = htmlspecialchars($_POST["email"]);
  $message = htmlspecialchars($_POST["message"]);
  $bezspama = htmlspecialchars($_POST["bezspama"]);

  /* Ваш адрес и тема сообщения */
  $address = "marinakaluzhnaya13@gmail.com";
  $sub = "Сообщение с сайта mari-code";

  /* Формат письма */
  $mes = "Сообщение с сайта mari-code.\n
  Имя отправителя: $name
  Электронный адрес отправителя: $email
  Текст сообщения:\n
  $message";


  if (empty($bezspama)) { /* Оценка поля bezspama - должно быть пустым*/
    /* Отправляем сообщение, используя mail() функцию */
    $from  = "From: $name <$email> \r\n Reply-To: $email \r\n";
    if (mail($address, $sub, $mes, $from)) {
      header('Refresh: 5; URL=contacts.html');
      echo 'Письмо отправлено, через 5 секунд вы вернетесь на страницу';
    } else {
      header('Refresh: 5; URL=contacts.html');
      echo 'Письмо не отправлено, через 5 секунд вы вернетесь на страницу';}
  }
  exit; /* Выход без сообщения, если поле bezspama заполнено спам ботами */
?>
