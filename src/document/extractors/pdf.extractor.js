const path = require('node:path');
const { fork } = require('node:child_process');
const textNormalizer = require('../utils/text.normalizer');

const workerPath = path.join(__dirname, 'pdf.extractor.worker.js');

function runWorker(buffer, mode) {
    return new Promise((resolve, reject) => {
        const worker = fork(workerPath, [], {
            stdio: ['ignore', 'ignore', 'ignore', 'ipc']
        });

        let settled = false;

        worker.once('message', message => {
            settled = true;

            if (message?.error) {
                const error = new Error(message.error.message);
                error.name = message.error.name || 'PdfExtractionError';
                error.details = message.error.details || null;
                reject(error);
                return;
            }

            resolve(message);
        });

        worker.once('error', error => {
            settled = true;
            reject(error);
        });

        worker.once('exit', code => {
            if (!settled && code !== 0) {
                reject(new Error(
                    `PDF worker finalizado com código ${code}.`
                ));
            }
        });

        worker.send({
            base64: Buffer.from(buffer).toString('base64'),
            mode
        });
    });
}

exports.extract = async buffer => {
    const data = await runWorker(buffer, 'document');

    return {
        success: true,
        pages: data.pages,
        info: data.info,
        metadata: data.metadata,
        text: textNormalizer.normalize(data.text)
    };
};

exports.extractPages = async buffer => {
    const data = await runWorker(buffer, 'pages');
    return data.pageTexts.map(text =>
        textNormalizer.normalize(text)
    );
};
