{% extends './layout.server.view.swig' %}

{% block content %}
<h1>{{ title }}</h1>
<h3>Error</h3><br/>
<pre>
  {{ error }}
</pre>
<h3>Sentry</h3><br/>
<pre>
  {{ sentry }}
</pre>
{% endblock %}
