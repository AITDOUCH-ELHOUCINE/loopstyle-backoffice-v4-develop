<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">


<head>
  <title></title>
  <style>
.content {
  max-width: 500px;
  margin: auto;
}
#order {
  font-family: Arial, Helvetica, sans-serif;
  border-collapse: collapse;
  width: 80%;
}

#order td, #order th {
  border: 1px solid #ddd;
  padding: 8px;
}

#order tr:nth-child(even){background-color: #f2f2f2;}

#order tr:hover {background-color: #ddd;}

#order th {
  padding-top: 12px;
  padding-bottom: 12px;
  text-align: center;
  background-color: #F13758;
  color: white;
}
   .details {
        background: #F13758;
        padding: 2px 0 25px 0;
        width: 100%;
        display: flex;
        justify-content: center;
      }
</style>
</head>

<body >
<div class="content">
  <!-- Page content -->

<table id="order">
  <tr>
    <th colspan="2">Nouvelle Commande</th>

  </tr>

  <tr>
    <td  rowspan="2">Type de commande </td>
    <td>{{natureProduct}}</td>

  </tr>
  <tr>
    <td  rowspan="2">Client</td>
    <td>{{clientName}}</td>

  </tr>
   <tr>

    <td>Tél: {{clientPhone}}</td>

  </tr>

  <tr>
    <td>Prix TTC</td>
    <td>{{total_ttc}} MAD</td>

  </tr>
  <tr >
  <td colspan="2">
        <a href="{{editOrderLink}}" target="_blank">Voir dans le backoffice  </a>

    </td>
  </tr>

</table>
  <p>The {{appName}} Support Team</p>
</div>

</body>

</html>
