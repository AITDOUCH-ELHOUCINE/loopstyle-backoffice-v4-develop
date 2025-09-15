<!DOCTYPE html>
<html>

<head>
  <title>Nouveau compte LoopStyle</title>
  <style>
    .email-container {
      background-color: #f3f4f6;
      padding: 20px;
    }

    .app-logo {
      width: 200px;
    }

    .email-content {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e0e4e8;
      border-radius: 5px;
      padding: 20px;
    }

    .header {
      text-align: center;
    }

    .title {
      font-size: 24px;
      color: #333333;
      margin-top: 20px;
      text-align: center;
    }

    .text {
      font-size: 16px;
      color: #333333;
      line-height: 1.5;
    }

    .small-text {
      font-size: 14px;
    }

    .support-line {
      border-top: 1px solid gray;
      color: gray;
      padding-top: 20px;
      text-align: center;
    }
  </style>
</head>

<body>
  <div class="email-container">
    <div class="email-content">
      <div class="header">
        <img class="app-logo" src="https://api.loopstyle.com/assets/img/logo.png" alt="{{appName}}">
      </div>
      <h1 class="title">Nouveau compte LoopStyle</h1>
      <p class="text">Bonjour,</p>
      <p class="text">Voici vos codes d’accès à la plateforme LoopStyle :</p>
      <p class="text">Identifiant : {{email}}</p>
      <p class="text">Mot de passe: {{password}}</p>
      <p class="text">Cordialement.</p>
      <div class="support-line">
        <p><a href="mailto:contact@loopstyle-conseil.com">contact@loopstyle-conseil.com</a></p>
        <p><a href="tel:0532096034">05.32.09.60.34</a></p>
        <p>The {{appName}} Support Team</p>
      </div>
    </div>
  </div>
</body>

</html>