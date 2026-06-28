module.exports = (value) => {
    if (!value) return null;

    return value
        .replace(/\./g, '')
        .replace(',', '.');
};