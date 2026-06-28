module.exports = (text) => {
    const match = text.match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}:\d{2})/);

    return {
        data: match?.[1] || null,
        hora: match?.[2] || null
    };
};