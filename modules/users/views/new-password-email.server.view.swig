<!DOCTYPE html>
<html>

<head>
  <title>Nouveau mot de passe plateforme LoopStyle</title>
  <style>
    .email-container {
      background-color: #f3f4f6;
      padding: 20px;
    }

    .email-content {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e0e4e8;
      border-radius: 5px;
      padding: 20px;
    }

    .app-logo {
      width: 200px;
    }

    .header img {
      width: 100px;
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
      <h1 class="title">Nouveau mot de passe plateforme LoopStyle</h1>
      <p class="text">Bonjour {{name}},</p>
      <p class="text small-text">
        Vous avez demandé la réinitialisation de votre mot de passe pour accéder à la plateforme LoopStyle.
      </p>
      <p class="text">Votre nouveau mot de passe est : <b>{{newPassword}}</b></p>
      <br>
      <strong>Cordialement.</strong>
      <br>
      <p class="text support-line">The {{appName}} Support Team</p>
    </div>
  </div>
</body>

</html>