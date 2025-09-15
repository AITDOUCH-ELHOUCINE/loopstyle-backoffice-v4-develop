{% extends '../../core/views/email.server.view.swig' %}

{% block content %}
<!-- ONE COLUMN SECTION -->
<table border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td bgcolor="#ffffff" align="center" style="padding: 70px 15px 70px 15px;" class="section-padding">
      <table border="0" cellpadding="0" cellspacing="0" width="500" class="responsive-table">
        <tr>
          <td>
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td>
                  <!-- HERO IMAGE -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tbody>
                      <tr>
                        <td class="padding-copy">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="text-align:center">
                                <a href="http://alistapart.com/article/can-email-be-responsive/" target="_blank"><img src="{{app.url}}/assets/img/email/success-green-check-mark.jpg" width="50" height="50" class="logo"></a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td>
                  <!-- COPY -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" style="padding: 20px 0 0 0; font-size: 16px; line-height: 25px; font-family: Helvetica, Arial, sans-serif; color: #666666;" class="padding-copy">

                      Félicitations, votre compte a bien été validé.
                      </br>
                      Vous pouvez maintenant vous connecter à votre espace
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
{% endblock %}
