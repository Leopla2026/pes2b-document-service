module.exports = (text, label) => {
    const regex = new RegExp(`${label}\\s*([\\d\\.,]+)`, 'i');
    return text.match(regex)?.[1] || null;
};