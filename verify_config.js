process.env.NODE_ENV = 'production';
try {
    const config = require('./config/index');
    console.log('Config loaded successfully');
    if (config.session && config.session.secret) {
        console.log('Session secret is present:', config.session.secret);
    } else {
        console.error('Session secret is MISSING');
        process.exit(1);
    }
} catch (e) {
    console.error('Error loading config:', e);
    process.exit(1);
}
