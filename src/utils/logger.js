function normalizeError(error) {
    if (!error) {
        return null;
    }

    return {
        name: error.name || 'Error',
        message: error.message || String(error),
        code: error.code || null,
        stack: process.env.NODE_ENV === 'production'
            ? undefined
            : error.stack
    };
}

function write(level, event, details = {}) {
    const payload = {
        timestamp: new Date().toISOString(),
        level,
        service: 'PES2B Document Service',
        event,
        ...details
    };

    const line = JSON.stringify(payload);

    if (level === 'error') {
        console.error(line);
        return payload;
    }

    if (level === 'warn') {
        console.warn(line);
        return payload;
    }

    console.log(line);
    return payload;
}

module.exports = {
    info(event, details) {
        return write('info', event, details);
    },
    warn(event, details) {
        return write('warn', event, details);
    },
    error(event, details) {
        return write('error', event, details);
    },
    normalizeError
};
