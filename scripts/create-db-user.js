db.createUser( {
  user: 'loopstyle_user_dev',
  pwd:  passwordPrompt(),   // or cleartext password
  roles: [ { role: 'readWrite', db: 'loopstyle-dev' }],
} );
